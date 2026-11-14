import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import sharp from "sharp";
import { animatedImageReason, cloudinaryApiError, cloudinaryDeliveryUrlMismatch, cloudinaryUploadContext, deterministicPublicId, matchesOptimizedContent, selectLargestSupportedImages, selectSupportedImages, sha256, supportsMigrationFormat, type ListedImage, unsupportedFormatReason, validateSelectionOptions } from "./migration-utils";
import { assertManifestMatchesMapping, countManifestActions, createApplyManifest, executeApplyPass, executeRollbackPass, makeMigrationId, validateApplyManifest, verifyPostApplyState, type ApplyManifest, type JournalOperationState, type ManifestEntry, type VerifyJournalRecord, type VerifyJournalStatus } from "./migration-manifest";

dotenv.config({ path: ".env.local" });
dotenv.config();

const BUCKET = "projects";
const OUTPUT_DIR = path.resolve("migration-data/cloudinary-project-images");
const MAPPING_FILE = path.join(OUTPUT_DIR, "mapping.json");
const REPORT_FILE = path.join(OUTPUT_DIR, "report.json");
const MANIFEST_FILE = path.join(OUTPUT_DIR, "apply-manifest.json");
const PAGE_SIZE = 100;
const CONCURRENCY = 2;

type MappingEntry = {
  originalPath: string;
  originalUrl: string;
  /** Exact database URLs observed for this source image; generated URLs are validated against these. */
  databaseUrls?: string[];
  sourceSha256?: string;
  optimizedSha256?: string;
  cloudinaryPublicId: string;
  cloudinarySecureUrl: string;
  originalFileSize: number;
  optimizedFileSize: number;
  uploadStatus: "uploaded" | "existing" | "skipped" | "failed";
  verificationStatus: "verified" | "failed" | "pending" | "not_applicable";
  recordedAt?: string;
  error?: string;
  errorStage?: string;
  cloudinaryErrorCode?: string;
  cloudinaryErrorMessage?: string;
  verifiedAt?: string;
};
type SelectionReport = {
  mode: "all" | "limit" | "largest";
  requested?: number;
  bucketListed?: number;
  selected: Array<{ originalPath: string; originalFileSize: number | null }>;
};
type StoredMapping = { version: 2; updatedAt: string; entries: MappingEntry[]; selection?: SelectionReport };
type StorageFile = ListedImage;

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
cloudinary.config({
  cloud_name: required("CLOUDINARY_CLOUD_NAME"),
  api_key: required("CLOUDINARY_API_KEY"),
  api_secret: required("CLOUDINARY_API_SECRET"),
  secure: true,
});
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const databaseSupabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function normalizeLegacyMapping(raw: { version?: number; updatedAt?: string; entries?: Array<Record<string, unknown>>; selection?: SelectionReport }): StoredMapping {
  const entries: MappingEntry[] = (raw.entries ?? []).map((entry) => {
    const { status: legacyStatus, ...rest } = entry;
    const uploadStatus = entry.uploadStatus ?? legacyStatus ?? "failed";
    const verificationStatus = entry.verificationStatus ?? (
      entry.verifiedAt ? "verified" : entry.cloudinarySecureUrl ? "pending" : "not_applicable"
    );
    return {
      ...rest,
      uploadStatus,
      verificationStatus,
      databaseUrls: Array.isArray(entry.databaseUrls) ? entry.databaseUrls : undefined,
      sourceSha256: typeof entry.sourceSha256 === "string" ? entry.sourceSha256 : undefined,
      optimizedSha256: typeof entry.optimizedSha256 === "string" ? entry.optimizedSha256 : undefined,
    } as MappingEntry;
  });
  return { version: 2, updatedAt: raw.updatedAt ?? new Date().toISOString(), entries, selection: raw.selection };
}

async function loadMapping(): Promise<StoredMapping> {
  try {
    return normalizeLegacyMapping(JSON.parse(await readFile(MAPPING_FILE, "utf8")) as { version?: number; updatedAt?: string; entries?: Array<Record<string, unknown>>; selection?: SelectionReport });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return { version: 2, updatedAt: new Date().toISOString(), entries: [] };
  }
}

async function saveMapping(mapping: StoredMapping): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  mapping.updatedAt = new Date().toISOString();
  await writeJsonSafely(MAPPING_FILE, mapping);
}

async function writeJsonSafely(file: string, value: unknown): Promise<void> {
  const temp = `${file}.tmp`;
  await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temp, file);
}

async function saveReport(mapping: StoredMapping): Promise<void> {
  const entries = mapping.entries;
  const completed = entries.filter((entry) => ["uploaded", "existing"].includes(entry.uploadStatus));
  const currentByPath = new Map<string, MappingEntry>();
  for (const entry of entries) currentByPath.set(entry.originalPath, entry);
  const current = [...currentByPath.values()];
  const currentSuccessful = current.filter((entry) => ["uploaded", "existing"].includes(entry.uploadStatus));
  const totalOriginal = currentSuccessful.reduce((sum, entry) => sum + entry.originalFileSize, 0);
  const totalOptimized = currentSuccessful.reduce((sum, entry) => sum + entry.optimizedFileSize, 0);
  const withCompression = (entry: MappingEntry) => ({
    ...entry,
    compressionPercent: entry.originalFileSize > 0
      ? Number(((1 - entry.optimizedFileSize / entry.originalFileSize) * 100).toFixed(2))
      : null,
  });
  const report = {
    generatedAt: new Date().toISOString(),
    bucket: BUCKET,
    selection: mapping.selection ?? { mode: "all", selected: [] },
    totals: {
      listed: mapping.selection?.bucketListed ?? (mapping.selection?.mode === "all" ? mapping.selection.selected.length : current.length),
      recorded: current.length,
      unrecordedSelected: Math.max(0, (mapping.selection?.selected.length ?? current.length) - new Set(current.map((entry) => entry.originalPath)).size),
      uploaded: current.filter((entry) => entry.uploadStatus === "uploaded").length,
      existing: current.filter((entry) => entry.uploadStatus === "existing").length,
      skipped: current.filter((entry) => entry.uploadStatus === "skipped").length,
      failed: current.filter((entry) => entry.uploadStatus === "failed").length,
      originalBytes: current.filter((entry) => ["uploaded", "existing"].includes(entry.uploadStatus)).reduce((sum, entry) => sum + entry.originalFileSize, 0),
      optimizedBytes: current.filter((entry) => ["uploaded", "existing"].includes(entry.uploadStatus)).reduce((sum, entry) => sum + entry.optimizedFileSize, 0),
      bytesSaved: current.filter((entry) => ["uploaded", "existing"].includes(entry.uploadStatus)).reduce((sum, entry) => sum + entry.originalFileSize - entry.optimizedFileSize, 0),
      reductionPercent: totalOriginal ? Number(((1 - totalOptimized / totalOriginal) * 100).toFixed(2)) : 0,
      verificationFailures: current.filter((entry) => entry.verificationStatus === "failed").length,
    },
    successful: entries.filter((entry) => ["uploaded", "existing"].includes(entry.uploadStatus)).map(withCompression),
    skipped: current.filter((entry) => entry.uploadStatus === "skipped"),
    failures: current.filter((entry) => entry.uploadStatus === "failed"),
    rollback: completed.map((entry) => ({
      originalPath: entry.originalPath,
      fromUrl: entry.cloudinarySecureUrl,
      toUrl: entry.originalUrl,
      databaseUrls: entry.databaseUrls ?? [entry.originalUrl],
      sourceSha256: entry.sourceSha256,
    })),
  };
  await writeJsonSafely(REPORT_FILE, report);
}

function getPublicUrl(objectPath: string): string {
  return supabase.storage.from(BUCKET).getPublicUrl(objectPath).data.publicUrl;
}

function isProjectsBucketUrl(value: string): boolean {
  try {
    return new URL(value).pathname.includes("/storage/v1/object/public/projects/");
  } catch {
    return false;
  }
}

async function getDatabaseUrlInventory(): Promise<Set<string>> {
  const urls = new Set<string>();
  for (const target of [
    { table: "project_images" as const, column: "image_url" as const },
    { table: "projects" as const, column: "cover_image" as const },
  ]) {
    let offset = 0;
    while (true) {
      const { data, error } = await databaseSupabase
        .from(target.table)
        .select(`${target.column},id`)
        .order("id", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);
      if (error) throw new Error(`Could not inspect ${target.table}.${target.column}: ${error.message}`);
      for (const row of data ?? []) {
        const url = (row as Record<string, unknown>)[target.column];
        if (typeof url === "string" && url) urls.add(url);
      }
      if (!data || data.length < PAGE_SIZE) break;
      offset += data.length;
    }
  }
  return urls;
}

async function validateStorageAndUrlConsistency(objects: StorageFile[]): Promise<{ urlToPath: Map<string, string> }> {
  const listedUrlToPath = new Map(objects.map((object) => [getPublicUrl(object.name), object.name]));
  const inventory = await getDatabaseUrlInventory();
  const urlToPath = new Map<string, string>();
  for (const url of inventory) {
    const pathForUrl = listedUrlToPath.get(url);
    if (pathForUrl) {
      urlToPath.set(url, pathForUrl);
    } else if (isProjectsBucketUrl(url)) {
      // A stale database URL may point to an object that has already been
      // removed. Leave it unmatched so preview reports it; do not stop uploads
      // for unrelated, available sources.
    }
  }
  return { urlToPath };
}

async function listObjects(): Promise<StorageFile[]> {
  const objects: StorageFile[] = [];
  async function walk(prefix: string): Promise<void> {
    let offset = 0;
    while (true) {
      const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
        limit: PAGE_SIZE,
        offset,
        sortBy: { column: "name", order: "asc" },
      });
      if (error) throw new Error(`Storage listing failed at '${prefix || "/"}': ${error.message}`);
      if (!data?.length) break;
      const files = data.filter((item) => item.id || item.metadata);
      const folders = data.filter((item) => !item.id && !item.metadata);
      for (const file of files) objects.push({ name: prefix ? `${prefix}/${file.name}` : file.name, metadata: file.metadata });
      for (const folder of folders) await walk(prefix ? `${prefix}/${folder.name}` : folder.name);
      offset += data.length;
      if (data.length < PAGE_SIZE) break;
    }
  }
  await walk("");
  return objects;
}

async function cloudinaryContentMatches(secureUrl: string, optimizedSha256: string): Promise<{ valid: boolean; reason?: string }> {
  try {
    const response = await fetch(secureUrl, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return { valid: false, reason: `delivery request returned HTTP ${response.status}` };
    const actualHash = sha256(Buffer.from(await response.arrayBuffer()));
    return actualHash === optimizedSha256
      ? { valid: true }
      : { valid: false, reason: `downloaded WebP SHA-256 ${actualHash} does not match expected ${optimizedSha256}` };
  } catch (error) {
    return { valid: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

async function uploadBuffer(buffer: Buffer, publicId: string, sourceSha256: string, optimizedSha256: string): Promise<{ publicId: string; secureUrl: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        type: "upload",
        format: "webp",
        overwrite: false,
        unique_filename: false,
        context: cloudinaryUploadContext(sourceSha256, optimizedSha256),
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.public_id || !result.secure_url || result.public_id !== publicId || result.resource_type !== "image" || result.type !== "upload" || result.format !== "webp" || result.bytes !== buffer.byteLength) {
          return reject(new Error("Cloudinary upload response did not match the requested public_id, image/upload WebP format, and byte size"));
        }
        resolve({ publicId: result.public_id, secureUrl: result.secure_url });
      },
    );
    stream.end(buffer);
  });
}

class CloudinaryStageError extends Error {
  constructor(readonly stage: string, message: string, readonly code?: string) {
    super(message);
    this.name = "CloudinaryStageError";
  }
}

function safeCloudinaryApiError(error: unknown): { code: string; message: string } {
  const details = cloudinaryApiError(error);
  const secrets = [process.env.CLOUDINARY_API_SECRET, process.env.CLOUDINARY_API_KEY]
    .filter((value): value is string => Boolean(value));
  return {
    code: details.code,
    message: secrets.reduce((message, secret) => message.split(secret).join("[redacted]"), details.message),
  };
}

async function cloudinaryAssetIsValid(objectPath: string, publicId: string, secureUrl: string, sourceSha256?: string, optimizedSha256?: string): Promise<{ valid: boolean; reason?: string }> {
  if (!sourceSha256 || !optimizedSha256) return { valid: false, reason: "source or optimized SHA-256 is missing; asset identity cannot be established" };
  const expectedIds = [deterministicPublicId(objectPath, sourceSha256), deterministicPublicId(objectPath, sourceSha256, optimizedSha256)];
  if (!expectedIds.includes(publicId)) return { valid: false, reason: "Cloudinary public_id does not match this source path and content version" };
  const mismatch = cloudinaryDeliveryUrlMismatch(secureUrl, required("CLOUDINARY_CLOUD_NAME"), publicId);
  if (mismatch) return { valid: false, reason: mismatch };
  // A successful GET followed by a byte-for-byte digest comparison proves both accessibility and content identity.
  return cloudinaryContentMatches(secureUrl, optimizedSha256);
}

async function uploadWithoutOverwrite(
  objectPath: string,
  buffer: Buffer,
  sourceSha256: string,
  optimizedSha256: string,
): Promise<{ publicId: string; secureUrl: string; status: "uploaded" | "existing"; optimizedSha256: string; optimizedFileSize: number }> {
  const ids = [
    deterministicPublicId(objectPath, sourceSha256),
    deterministicPublicId(objectPath, sourceSha256, optimizedSha256),
  ];
  let lastError: { code: string; message: string } | undefined;
  for (const publicId of ids) {
    const candidateUrl = cloudinary.url(publicId, { resource_type: "image", type: "upload", secure: true, format: "webp" });
    const validation = await cloudinaryAssetIsValid(objectPath, publicId, candidateUrl, sourceSha256, optimizedSha256);
    if (validation.valid) {
      return {
        publicId,
        secureUrl: candidateUrl,
        status: "existing",
        optimizedSha256,
        optimizedFileSize: buffer.byteLength,
      };
    }
    try {
      const uploaded = await uploadBuffer(buffer, publicId, sourceSha256, optimizedSha256);
      return { ...uploaded, status: "uploaded", optimizedSha256, optimizedFileSize: buffer.byteLength };
    } catch (error) {
      lastError = safeCloudinaryApiError(error);
      // Recover a successful upload whose local checkpoint was interrupted by checking delivered bytes.
      if ((await cloudinaryAssetIsValid(objectPath, publicId, candidateUrl, sourceSha256, optimizedSha256)).valid) {
        return {
          publicId,
          secureUrl: candidateUrl,
          status: "existing",
          optimizedSha256,
          optimizedFileSize: buffer.byteLength,
        };
      }
      const details = safeCloudinaryApiError(error);
      // This also covers an unrelated or different asset occupying the deterministic ID; never overwrite it.
      if (details.code === "409") continue;
      throw new CloudinaryStageError("cloudinary_upload", `Cloudinary upload failed (${details.code}): ${details.message}`, details.code);
    }
  }
  throw new Error(`Could not create a safe Cloudinary ID for '${objectPath}' without overwriting an existing asset${lastError ? ` (last Cloudinary error ${lastError.code}: ${lastError.message})` : ""}`);
}

async function processObject(object: StorageFile, mapping: StoredMapping, databaseUrls: Map<string, string>, downloaded?: Buffer): Promise<MappingEntry> {
  const objectPath = object.name;
  const originalUrl = getPublicUrl(objectPath);
  const actualDatabaseUrls = [...databaseUrls.entries()].filter(([, pathForUrl]) => pathForUrl === objectPath).map(([url]) => url);
  let originalFileSize = object.metadata?.size ?? 0;
  let sourceSha256: string | undefined;
  let optimizedSha256: string | undefined;
  let uploadedRecord: Awaited<ReturnType<typeof uploadWithoutOverwrite>> | undefined;
  let errorStage = "download";
  try {
    let original = downloaded;
    if (!original) {
      const { data, error } = await supabase.storage.from(BUCKET).download(objectPath);
      if (error || !data) throw new Error(error?.message ?? "Storage returned an empty download");
      original = Buffer.from(await data.arrayBuffer());
    }
    originalFileSize = original.byteLength;
    sourceSha256 = sha256(original);
    const sourceMetadata = await sharp(original, { animated: true }).metadata();
    const animationReason = animatedImageReason(sourceMetadata.format, sourceMetadata.pages);
    if (animationReason) {
      return {
        originalPath: objectPath,
        originalUrl,
        databaseUrls: actualDatabaseUrls,
        sourceSha256,
        cloudinaryPublicId: "",
        cloudinarySecureUrl: "",
        originalFileSize,
        optimizedFileSize: 0,
        uploadStatus: "skipped",
        verificationStatus: "not_applicable",
        error: animationReason,
      };
    }
    errorStage = "optimization";
    const optimized = await sharp(original)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80, alphaQuality: 100, effort: 4 })
      .toBuffer();
    optimizedSha256 = sha256(optimized);
    const previous = mapping.entries.find((entry) => entry.originalPath === objectPath && entry.sourceSha256 === sourceSha256 && ["uploaded", "existing"].includes(entry.uploadStatus));
    errorStage = "resume_validation";
    const previousValidation = previous?.cloudinaryPublicId && matchesOptimizedContent(previous.optimizedSha256, optimizedSha256)
      ? await cloudinaryAssetIsValid(objectPath, previous.cloudinaryPublicId, previous.cloudinarySecureUrl, sourceSha256, previous.optimizedSha256)
      : { valid: false, reason: "no reusable prior mapping" };
    if (previous && previous.cloudinaryPublicId && matchesOptimizedContent(previous.optimizedSha256, optimizedSha256) && previousValidation.valid) {
      previous.verificationStatus = "verified";
      previous.verifiedAt = new Date().toISOString();
      previous.databaseUrls = actualDatabaseUrls;
      previous.error = undefined;
      return previous;
    }
    errorStage = "cloudinary_upload_or_existing_asset_check";
    uploadedRecord = await uploadWithoutOverwrite(objectPath, optimized, sourceSha256, optimizedSha256);
    errorStage = "post_upload_validation";
    const validation = await cloudinaryAssetIsValid(objectPath, uploadedRecord.publicId, uploadedRecord.secureUrl, sourceSha256, uploadedRecord.optimizedSha256);
    if (!validation.valid) {
      throw new CloudinaryStageError(errorStage, `Cloudinary asset validation failed for public_id '${uploadedRecord.publicId}': ${validation.reason ?? "unknown validation failure"}`);
    }
    return {
      originalPath: objectPath,
      originalUrl,
      databaseUrls: actualDatabaseUrls,
      sourceSha256,
      optimizedSha256: uploadedRecord.optimizedSha256,
      cloudinaryPublicId: uploadedRecord.publicId,
      cloudinarySecureUrl: uploadedRecord.secureUrl,
      originalFileSize,
      optimizedFileSize: uploadedRecord.optimizedFileSize,
      uploadStatus: uploadedRecord.status,
      verificationStatus: "verified",
      recordedAt: new Date().toISOString(),
      verifiedAt: new Date().toISOString(),
    };
  } catch (error) {
    const cloudinaryFailure = error instanceof CloudinaryStageError ? error : undefined;
    return {
      originalPath: objectPath,
      originalUrl,
      databaseUrls: actualDatabaseUrls,
      sourceSha256,
      optimizedSha256: uploadedRecord?.optimizedSha256 ?? optimizedSha256,
      cloudinaryPublicId: uploadedRecord?.publicId ?? "",
      cloudinarySecureUrl: uploadedRecord?.secureUrl ?? "",
      originalFileSize,
      optimizedFileSize: uploadedRecord?.optimizedFileSize ?? 0,
      uploadStatus: uploadedRecord?.status ?? "failed",
      verificationStatus: uploadedRecord ? "failed" : "not_applicable",
      recordedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
      errorStage: cloudinaryFailure?.stage ?? errorStage,
      cloudinaryErrorCode: cloudinaryFailure?.code,
      cloudinaryErrorMessage: cloudinaryFailure?.message,
    };
  }
}

async function runPool<T>(items: T[], concurrency: number, task: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) await task(items[next++]);
  }));
}

function listedOriginalSize(object: StorageFile): number | undefined {
  const size = object.metadata?.size;
  return typeof size === "number" && Number.isSafeInteger(size) && size >= 0 ? size : undefined;
}

async function downloadOriginalSize(object: StorageFile): Promise<number> {
  const { data, error } = await supabase.storage.from(BUCKET).download(object.name);
  if (error || !data) throw new Error(`Could not determine original size for '${object.name}': ${error?.message ?? "empty download"}`);
  return (await data.arrayBuffer()).byteLength;
}

async function upload(limit?: number, largest?: number): Promise<void> {
  const objects = await listObjects();
  let selected: StorageFile[];
  let selection: SelectionReport;
  if (largest !== undefined) {
    const supported = objects.filter(supportsMigrationFormat);
    const sizesByPath = new Map<string, number>();
    await runPool(supported, CONCURRENCY, async (object) => {
      try {
        const size = listedOriginalSize(object) ?? await downloadOriginalSize(object);
        sizesByPath.set(object.name, size);
      } catch (error) {
        console.warn(`Could not size source ${object.name}; skipping it: ${error instanceof Error ? error.message : "download failed"}`);
      }
    });
    selected = selectLargestSupportedImages(objects, sizesByPath, largest);
    selection = {
      mode: "largest",
      requested: largest,
      bucketListed: objects.length,
      selected: selected.map((object) => ({ originalPath: object.name, originalFileSize: sizesByPath.get(object.name)! })),
    };
  } else if (limit !== undefined) {
    selected = selectSupportedImages(objects, limit);
    selection = {
      mode: "limit",
      requested: limit,
      bucketListed: objects.length,
      selected: selected.map((object) => ({ originalPath: object.name, originalFileSize: listedOriginalSize(object) ?? null })),
    };
  } else {
    selected = [...objects].sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
    selection = {
      mode: "all",
      bucketListed: objects.length,
      selected: selected.map((object) => ({ originalPath: object.name, originalFileSize: listedOriginalSize(object) ?? null })),
    };
  }
  const validatedStorage = await validateStorageAndUrlConsistency(objects);
  const actualDatabaseUrls = validatedStorage.urlToPath;
  const mapping = await loadMapping();
  mapping.selection = selection;
  if (largest !== undefined) {
    console.log(`Largest-files selection: ${selected.length} supported JPEG/PNG images (requested exactly ${largest}), sorted by original size descending:`);
    for (const item of selection.selected) console.log(`  ${item.originalPath} — ${item.originalFileSize} bytes`);
  } else {
    console.log(`Listed ${objects.length} objects; processing ${selected.length}${limit !== undefined ? ` supported JPEG/PNG images (requested exactly ${limit})` : " objects"}.`);
  }
  await saveMapping(mapping);
  await saveReport(mapping);
  let checkpoint = Promise.resolve();
  const persist = () => {
    checkpoint = checkpoint.then(async () => {
      await saveMapping(mapping);
      await saveReport(mapping);
    });
    return checkpoint;
  };
  await runPool(selected, CONCURRENCY, async (object) => {
    if (!supportsMigrationFormat(object)) {
      const reason = unsupportedFormatReason(object);
      upsertMappingEntry(mapping, {
        originalPath: object.name,
        originalUrl: getPublicUrl(object.name),
        databaseUrls: [...actualDatabaseUrls.entries()].filter(([, objectPath]) => objectPath === object.name).map(([url]) => url),
        cloudinaryPublicId: "",
        cloudinarySecureUrl: "",
        originalFileSize: object.metadata?.size ?? 0,
        optimizedFileSize: 0,
        uploadStatus: "skipped",
        verificationStatus: "not_applicable",
        recordedAt: new Date().toISOString(),
        error: reason,
      });
      await persist();
      console.log(`skipped: ${object.name} — ${reason}`);
      return;
    }
    const entry = await processObject(object, mapping, actualDatabaseUrls);
    upsertMappingEntry(mapping, entry);
    await persist();
    console.log(`${entry.uploadStatus}/${entry.verificationStatus}: ${object.name}${entry.error ? ` — ${entry.error}` : ""}`);
  });
  console.log(`Mapping: ${MAPPING_FILE}\nReport: ${REPORT_FILE}`);
}

function upsertMappingEntry(mapping: StoredMapping, incoming: MappingEntry): void {
  let index = mapping.entries.findIndex((entry) =>
    entry.originalPath === incoming.originalPath &&
    entry.sourceSha256 === incoming.sourceSha256 &&
    entry.optimizedSha256 === incoming.optimizedSha256
  );
  if (index < 0 && incoming.uploadStatus !== "failed") {
    index = mapping.entries.findIndex((entry) =>
      entry.originalPath === incoming.originalPath &&
      entry.sourceSha256 === incoming.sourceSha256 &&
      entry.uploadStatus === "failed" &&
      !entry.optimizedSha256
    );
  }
  if (index < 0) {
    const existingSuccessful = mapping.entries.find((entry) =>
      entry.originalPath === incoming.originalPath &&
      entry.sourceSha256 === incoming.sourceSha256 &&
      ["uploaded", "existing"].includes(entry.uploadStatus)
    );
    if (existingSuccessful && incoming.uploadStatus === "failed") {
      existingSuccessful.verificationStatus = existingSuccessful.cloudinarySecureUrl ? "failed" : "not_applicable";
      existingSuccessful.error = incoming.error;
      existingSuccessful.databaseUrls = incoming.databaseUrls ?? existingSuccessful.databaseUrls;
      return;
    }
    mapping.entries.push(incoming);
  } else {
    const existing = mapping.entries[index];
    if (["uploaded", "existing"].includes(existing.uploadStatus) && incoming.uploadStatus === "failed") {
      existing.verificationStatus = incoming.verificationStatus;
      existing.error = incoming.error;
      existing.databaseUrls = incoming.databaseUrls ?? existing.databaseUrls;
    } else {
      mapping.entries[index] = incoming;
    }
  }
}

async function verify(): Promise<void> {
  const mapping = await loadMapping();
  const candidates = mapping.entries.filter((item) => ["uploaded", "existing"].includes(item.uploadStatus));
  if (!candidates.length) {
    console.log("No successfully uploaded Cloudinary assets found to verify.");
    return;
  }
  for (const entry of candidates) {
    let validation = { valid: false, reason: "Cloudinary public_id or secure_url is missing" } as { valid: boolean; reason?: string };
    if (entry.cloudinaryPublicId && entry.cloudinarySecureUrl) {
      try {
        if (!entry.optimizedSha256) {
          const { data, error } = await supabase.storage.from(BUCKET).download(entry.originalPath);
          if (error || !data) throw new Error(`Cannot recover expected content hash from Supabase: ${error?.message ?? "empty download"}`);
          const original = Buffer.from(await data.arrayBuffer());
          if (!entry.sourceSha256 || sha256(original) !== entry.sourceSha256) {
            throw new Error("Supabase source content does not match the original source SHA-256 in the mapping");
          }
          const optimized = await sharp(original)
            .rotate()
            .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80, alphaQuality: 100, effort: 4 })
            .toBuffer();
          entry.optimizedSha256 = sha256(optimized);
          entry.optimizedFileSize = optimized.byteLength;
        }
        validation = await cloudinaryAssetIsValid(entry.originalPath, entry.cloudinaryPublicId, entry.cloudinarySecureUrl, entry.sourceSha256, entry.optimizedSha256);
      } catch (error) {
        validation = { valid: false, reason: error instanceof Error ? error.message : String(error) };
        if (error instanceof CloudinaryStageError) {
          entry.errorStage = error.stage;
          entry.cloudinaryErrorCode = error.code;
          entry.cloudinaryErrorMessage = error.message;
        }
      }
    }
    if (!validation.valid) {
      entry.verificationStatus = "failed";
      entry.error = `Verification failed: ${validation.reason ?? "unknown mismatch"}`;
      console.error(`FAIL ${entry.originalPath}`);
    } else {
      entry.verificationStatus = "verified";
      entry.verifiedAt = new Date().toISOString();
      entry.error = undefined;
      console.log(`OK ${entry.originalPath}`);
    }
  }
  await saveMapping(mapping);
  await saveReport(mapping);
}

type DatabaseUrlRow = {
  tableName: "project_images" | "projects";
  primaryKeyColumn: "id";
  rowId: string;
  urlColumn: "image_url" | "cover_image";
  url: string;
};

async function getDatabaseUrlRows(): Promise<DatabaseUrlRow[]> {
  const rows: DatabaseUrlRow[] = [];
  for (const target of [
    { tableName: "project_images" as const, urlColumn: "image_url" as const },
    { tableName: "projects" as const, urlColumn: "cover_image" as const },
  ]) {
    let offset = 0;
    while (true) {
      const { data, error } = await databaseSupabase.from(target.tableName)
        .select("id," + target.urlColumn).order("id", { ascending: true }).range(offset, offset + PAGE_SIZE - 1);
      if (error) throw new Error("Could not inspect " + target.tableName + "." + target.urlColumn + ": " + error.message);
      const page = ((data ?? []) as unknown[]).flatMap((row) => {
        const record = row as Record<string, unknown>;
        return typeof record.id === "string" && typeof record[target.urlColumn] === "string" && record[target.urlColumn]
          ? [{ tableName: target.tableName, primaryKeyColumn: "id" as const, rowId: record.id, urlColumn: target.urlColumn, url: record[target.urlColumn] as string }]
          : [];
      });
      rows.push(...page);
      if (!data || data.length < PAGE_SIZE) break;
      offset += data.length;
    }
  }
  return rows;
}

async function buildManifestEntries(migrationId: string): Promise<ManifestEntry[]> {
  const mapping = await loadMapping();
  const databaseRows = await getDatabaseUrlRows();
  const entries: ManifestEntry[] = [];
  const missing: string[] = [];
  const invalid: string[] = [];
  for (const row of databaseRows) {
    if (!isProjectsBucketUrl(row.url)) continue;
    const match = mapping.entries.filter((entry) =>
      entry.originalUrl === row.url && entry.originalUrl === getPublicUrl(entry.originalPath) &&
      entry.databaseUrls?.includes(row.url) && ["uploaded", "existing"].includes(entry.uploadStatus) &&
      entry.verificationStatus === "verified" && entry.sourceSha256 && entry.optimizedSha256
    ).at(-1);
    if (!match) {
      missing.push(`${row.tableName}.${row.rowId}: ${row.url}`);
      continue;
    }
    const mismatch = cloudinaryDeliveryUrlMismatch(match.cloudinarySecureUrl, required("CLOUDINARY_CLOUD_NAME"), match.cloudinaryPublicId);
    if (mismatch) {
      invalid.push(match.originalPath + ": " + mismatch);
      continue;
    }
    entries.push({
      migrationId, tableName: row.tableName, primaryKeyColumn: row.primaryKeyColumn, rowId: row.rowId,
      urlColumn: row.urlColumn, expectedOriginalUrl: row.url, expectedCloudinarySecureUrl: match.cloudinarySecureUrl,
      originalPath: match.originalPath, cloudinaryPublicId: match.cloudinaryPublicId,
      expectedSourceSha256: match.sourceSha256!, expectedOptimizedSha256: match.optimizedSha256!,
      mappingVerificationStatus: match.verificationStatus, action: "apply",
    });
  }
  if (missing.length || invalid.length) {
    const missingDetails = missing.slice(0, 20).join("; ");
    throw new Error("Manifest preview refused: " + missing.length + " missing source mapping(s), " + invalid.length + " invalid Cloudinary URL(s). Missing references: " + missingDetails);
  }
  return entries;
}

function manifestRowIdentity(entries: ManifestEntry[]): string {
  return JSON.stringify(entries.map(({ migrationId: _migrationId, ...entry }) => entry)
    .sort((a, b) => a.tableName.localeCompare(b.tableName) || a.rowId.localeCompare(b.rowId)));
}

async function loadManifest(): Promise<ApplyManifest> {
  return validateApplyManifest(JSON.parse(await readFile(MANIFEST_FILE, "utf8")) as unknown);
}

async function writeImmutableManifest(manifest: ApplyManifest): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + "\n", { mode: 0o600, flag: "wx" });
}

async function previewDatabase(): Promise<void> {
  const migrationId = makeMigrationId();
  const entries = await buildManifestEntries(migrationId);
  const existing = await readFile(MANIFEST_FILE, "utf8").then((text) => validateApplyManifest(JSON.parse(text) as unknown)).catch((error) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  });
  let manifest: ApplyManifest;
  if (existing) {
    if (manifestRowIdentity(existing.entries) !== manifestRowIdentity(entries)) {
      throw new Error("Database preview differs from the immutable manifest " + existing.checksum + "; refusing to replace it.");
    }
    manifest = existing;
  } else {
    manifest = createApplyManifest(migrationId, entries);
    validateApplyManifest(manifest);
    try {
      await writeImmutableManifest(manifest);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const raced = await loadManifest();
      if (manifestRowIdentity(raced.entries) !== manifestRowIdentity(entries)) throw new Error("A different manifest was created concurrently; preview does not match it.");
      manifest = raced;
    }
  }
  const counts = countManifestActions(manifest);
  const distinctSources = new Set(manifest.entries.filter((entry) => entry.action === "apply").map((entry) => entry.expectedOriginalUrl)).size;
  console.log("Read-only database preview: " + counts.apply + " exact rows eligible across " + distinctSources + " source URLs.");
  console.log("Unexpected missing mappings: 0. Invalid Cloudinary URLs: 0. Rollback metadata: complete for every apply row.");
  console.log("Targets: project_images.image_url, projects.cover_image.");
  console.log("Manifest: " + MANIFEST_FILE + "\nMigration ID: " + manifest.migrationId + "\nManifest SHA-256: " + manifest.checksum);
}

async function rpcJournal<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await databaseSupabase.rpc(name as never, args as never);
  if (error) throw new Error(name + " RPC failed: " + error.message);
  return data as T;
}

async function requirePinnedManifest(expectedChecksum: string | undefined, validateCurrentMapping = true): Promise<ApplyManifest> {
  if (!expectedChecksum || !/^[a-f0-9]{64}$/i.test(expectedChecksum)) {
    throw new Error("Supply the approved manifest checksum with --manifest-checksum=<sha256>");
  }
  const manifest = await loadManifest();
  if (manifest.checksum !== expectedChecksum) throw new Error("The manifest is missing, changed, or does not match the explicitly approved checksum");
  if (validateCurrentMapping) {
    assertManifestMatchesMapping(manifest, (await loadMapping()).entries);
    for (const entry of manifest.entries) {
      if (entry.action === "apply" && (
        entry.expectedOriginalUrl !== getPublicUrl(entry.originalPath) ||
        cloudinaryDeliveryUrlMismatch(entry.expectedCloudinarySecureUrl, required("CLOUDINARY_CLOUD_NAME"), entry.cloudinaryPublicId)
      )) throw new Error("Manifest source or Cloudinary URL does not match its expected mapping for " + entry.originalPath);
    }
  }
  return manifest;
}

type JournalResult = {
  status?: JournalOperationState;
  applyStatus?: JournalOperationState;
  rollbackStatus?: JournalOperationState;
  appliedAt?: string | null;
  rolledBackAt?: string | null;
  reason?: string;
  rowId?: string;
};
async function getJournalRow(manifest: ApplyManifest, entry: ManifestEntry): Promise<JournalResult> {
  return rpcJournal<JournalResult>("cloudinary_image_migration_get_row", {
    p_migration_id: manifest.migrationId, p_manifest_checksum: manifest.checksum,
    p_table_name: entry.tableName, p_row_id: entry.rowId,
  });
}

async function verifyDatabase(expectedChecksum?: string): Promise<void> {
  required("SUPABASE_SERVICE_ROLE_KEY");
  const manifest = await requirePinnedManifest(expectedChecksum, false);
  const runQuery = await databaseSupabase.from("cloudinary_image_migration_runs")
    .select("migration_id,manifest_checksum,manifest_entries").eq("migration_id", manifest.migrationId);
  const runRecords = runQuery.error ? null : (runQuery.data ?? []).map((row) => ({
    migrationId: row.migration_id as string,
    manifestChecksum: row.manifest_checksum as string,
    manifestEntries: row.manifest_entries,
  }));

  const journalQuery = await databaseSupabase.from("cloudinary_image_migration_journal")
    .select("migration_id,manifest_checksum,table_name,primary_key_column,row_id,url_column,expected_original_url,expected_cloudinary_url,original_path,cloudinary_public_id,source_sha256,optimized_sha256,mapping_verification_status,action,apply_status,rollback_status,applied_at")
    .eq("migration_id", manifest.migrationId);
  const journalRecords: VerifyJournalRecord[] | null = journalQuery.error ? null : (journalQuery.data ?? []).map((row) => ({
    migrationId: row.migration_id as string,
    manifestChecksum: row.manifest_checksum as string,
    tableName: row.table_name as string,
    primaryKeyColumn: row.primary_key_column as string,
    rowId: row.row_id as string,
    urlColumn: row.url_column as string,
    expectedOriginalUrl: row.expected_original_url as string,
    expectedCloudinaryUrl: row.expected_cloudinary_url as string,
    originalPath: row.original_path as string,
    cloudinaryPublicId: row.cloudinary_public_id as string,
    sourceSha256: row.source_sha256 as string | null,
    optimizedSha256: row.optimized_sha256 as string | null,
    mappingVerificationStatus: row.mapping_verification_status as string,
    action: row.action as "apply" | "exclude",
    applyStatus: row.apply_status as string,
    rollbackStatus: row.rollback_status as string,
    appliedAt: row.applied_at as string | null,
  }));

  const journalStatuses: VerifyJournalStatus[] = [];
  if (!journalRecords) {
    for (const entry of manifest.entries) {
      try {
        const row = await getJournalRow(manifest, entry);
        journalStatuses.push({ tableName: entry.tableName, rowId: entry.rowId, applyStatus: row.applyStatus,
          rollbackStatus: row.rollbackStatus, appliedAt: row.appliedAt });
      } catch {
        journalStatuses.push({ tableName: entry.tableName, rowId: entry.rowId, missing: true });
      }
    }
  }

  const databaseRows: Array<{ tableName: string; rowId: string; url: string }> = [];
  for (const tableName of ["project_images", "projects"] as const) {
    const entries = manifest.entries.filter((entry) => entry.tableName === tableName);
    const urlColumn = tableName === "project_images" ? "image_url" : "cover_image";
    for (let offset = 0; offset < entries.length; offset += PAGE_SIZE) {
      const ids = entries.slice(offset, offset + PAGE_SIZE).map((entry) => entry.rowId);
      if (ids.length === 0) continue;
      const { data, error } = await databaseSupabase.from(tableName).select("id," + urlColumn).in("id", ids);
      if (error) throw new Error("Read-only verification could not inspect " + tableName + ": " + error.message);
      for (const row of data ?? []) {
        const value = row as unknown as Record<string, unknown>;
        if (typeof value.id === "string" && typeof value[urlColumn] === "string") {
          databaseRows.push({ tableName, rowId: value.id, url: value[urlColumn] as string });
        }
      }
    }
  }

  const report = verifyPostApplyState({ manifest, runRecords, journalRecords, journalStatuses, databaseRows });
  console.log("Read-only post-apply verification:");
  console.log("Manifest rows: " + report.expectedApplyRows + " apply, " + report.expectedExcludedRows + " excluded.");
  console.log("Run record matches manifest/checksum: " + (report.runRecordMatches ? "yes" : "no or inaccessible") +
    (runQuery.error ? " (" + runQuery.error.message + ")" : ""));
  console.log("Journal: " + (report.journalFullyEnumerable ? report.journalRows + " rows enumerated" : "full enumeration unavailable") +
    (journalQuery.error ? " (" + journalQuery.error.message + ")" : ""));
  console.log("Journal statuses: applied " + report.appliedJournalRows + ", excluded " + report.excludedJournalRows +
    ", pending " + report.pendingJournalRows + ", conflicts " + report.conflictedJournalRows + ", failed " + report.failedJournalRows +
    ", needs reconciliation " + report.reconciliationJournalRows + ", rolled back " + report.rolledBackJournalRows + ".");
  console.log("Journal identity: known manifest-row issues " + report.missingJournalRows +
    ", metadata mismatches " + (report.journalFullyEnumerable ? report.journalMetadataMismatches : "unknown") +
    ", unexpected " + (report.unexpectedJournalRows === null ? "unknown" : report.unexpectedJournalRows) +
    ", duplicate identities " + (report.duplicateJournalRows === null ? "unknown" : report.duplicateJournalRows) + ".");
  console.log("Database URLs: " + report.cloudinaryUrlMatches + "/" + report.expectedApplyRows + " expected Cloudinary URLs; " +
    report.excludedUrlMatches + "/" + report.expectedExcludedRows + " excluded source URLs unchanged; mismatched " +
    report.databaseUrlMismatches + ", missing rows " + report.missingDatabaseRows +
    ", unexpected IDs in exact-ID reads " + report.unexpectedManifestIds + ".");
  console.log("Unrelated-row journal coverage: " + (report.journalFullyEnumerable ? "complete; no out-of-manifest journal rows" : "unknown; registry/journal enumeration is denied"));
  console.log("Preview difference: the preview selects rows whose current URL is a Supabase projects-bucket URL. The " +
    report.cloudinaryUrlMatches + " applied row URLs now point to Cloudinary and therefore are omitted from a fresh apply plan; " +
    report.excludedUrlMatches + " excluded row remains on its original Supabase URL.");
  console.log("VERDICT: " + (report.passed ? "PASS" : "FAIL"));
  if (!report.passed) process.exitCode = 1;
}

async function applyDatabase(expectedChecksum?: string): Promise<void> {
  required("SUPABASE_SERVICE_ROLE_KEY");
  const manifest = await requirePinnedManifest(expectedChecksum);
  const legacySkipped = manifest.entries.filter((entry) => entry.action === "exclude");
  if (legacySkipped.length) {
    const details = legacySkipped.map((entry) => `${entry.tableName}.${entry.urlColumn} row ${entry.rowId}: ${entry.expectedOriginalUrl}`).join("; ");
    throw new Error(`Apply refused: the pinned historical manifest contains ${legacySkipped.length} skipped source reference(s). Do not recreate the deleted source. Resolve each current database reference through an approved data change, then create a new manifest. ${details}`);
  }
  await rpcJournal("cloudinary_image_migration_register_manifest", {
    p_migration_id: manifest.migrationId,
    p_manifest_checksum: manifest.checksum,
    p_entries: manifest.entries,
  });
  const result = await executeApplyPass(manifest.entries, {
    validate: async (entry) => {
      const validation = await cloudinaryAssetIsValid(entry.originalPath, entry.cloudinaryPublicId,
        entry.expectedCloudinarySecureUrl, entry.expectedSourceSha256, entry.expectedOptimizedSha256);
      if (!validation.valid) throw new Error(validation.reason ?? "Cloudinary content validation failed");
    },
    markFailed: async (entry, message) => {
      await rpcJournal("cloudinary_image_migration_mark_failed", {
        p_migration_id: manifest.migrationId, p_manifest_checksum: manifest.checksum,
        p_table_name: entry.tableName, p_row_id: entry.rowId, p_message: message,
      });
    },
    apply: async (entry) => {
      const response = await rpcJournal<JournalResult>("cloudinary_image_migration_apply_row", {
        p_migration_id: manifest.migrationId, p_manifest_checksum: manifest.checksum,
        p_table_name: entry.tableName, p_row_id: entry.rowId,
      });
      return response.status ?? "needs_reconciliation";
    },
    inspect: async (entry) => (await getJournalRow(manifest, entry)).applyStatus ?? "needs_reconciliation",
  });
  console.log("Apply pass complete: applied/already applied " + result.applied + ", conflicts " + result.conflicts + ", failed " + result.failed + ", needs reconciliation " + result.needsReconciliation + ". Excluded entries were not sent to apply RPC.");
}

async function rollbackDatabase(expectedChecksum?: string): Promise<void> {
  required("SUPABASE_SERVICE_ROLE_KEY");
  const manifest = await requirePinnedManifest(expectedChecksum, false);
  const result = await executeRollbackPass(manifest.entries, {
    rollback: async (entry) => {
      const response = await rpcJournal<JournalResult>("cloudinary_image_migration_rollback_row", {
        p_migration_id: manifest.migrationId, p_manifest_checksum: manifest.checksum,
        p_table_name: entry.tableName, p_row_id: entry.rowId,
      });
      return response.status ?? "needs_reconciliation";
    },
    inspect: async (entry) => {
      const state = await getJournalRow(manifest, entry);
      if (state.rollbackStatus === "pending" && !state.appliedAt) return "not_applied";
      return state.rollbackStatus ?? "needs_reconciliation";
    },
  });
  console.log("Rollback pass complete: restored " + result.restored + ", conflicts " + result.conflicts + ", not applied " + result.notApplied + ", failed " + result.failed + ", needs reconciliation " + result.needsReconciliation + ". Explicitly excluded entry was never sent to rollback RPC.");
}

async function main(): Promise<void> {
  const [command, ...args] = process.argv.slice(2);
  if (command === "upload") {
    const limitArg = args.find((arg) => arg.startsWith("--limit="));
    const largestArg = args.find((arg) => arg.startsWith("--largest="));
    const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : undefined;
    const largest = largestArg ? Number(largestArg.slice("--largest=".length)) : undefined;
    validateSelectionOptions(limitArg ? limit : undefined, largestArg ? largest : undefined);
    if (limitArg && (!Number.isInteger(limit) || (limit ?? 0) < 1)) throw new Error("--limit must be a positive integer");
    if (largestArg && (!Number.isInteger(largest) || (largest ?? 0) < 1)) throw new Error("--largest must be a positive integer");
    await upload(limit, largest);
  } else if (command === "verify") await verify();
  else if (command === "db:preview") await previewDatabase();
  else if (command === "db:verify") {
    const checksum = args.find((arg) => arg.startsWith("--manifest-checksum="))?.slice("--manifest-checksum=".length);
    await verifyDatabase(checksum);
  }
  else if (command === "db:apply" && args.includes("--confirm")) {
    const checksum = args.find((arg) => arg.startsWith("--manifest-checksum="))?.slice("--manifest-checksum=".length);
    await applyDatabase(checksum);
  } else if (command === "db:rollback" && args.includes("--confirm")) {
    const checksum = args.find((arg) => arg.startsWith("--manifest-checksum="))?.slice("--manifest-checksum=".length);
    await rollbackDatabase(checksum);
  } else throw new Error("Usage: upload [--limit=N | --largest=N] | verify | db:preview | db:verify --manifest-checksum=<sha256> | db:apply --confirm --manifest-checksum=<sha256> | db:rollback --confirm --manifest-checksum=<sha256>");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
