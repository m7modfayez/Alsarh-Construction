import "server-only";

import { createHash } from "node:crypto";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import {
  cloudinaryPublicId,
  ImageUploadError,
  type UploadedCloudinaryAsset,
} from "@/lib/project-image-lifecycle";

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const WEBP_QUALITY = 80;

export interface CloudinaryUploadInput {
  projectId: string;
  bytes: Buffer;
  contentType: string;
}

function required(name: "CLOUDINARY_CLOUD_NAME" | "CLOUDINARY_API_KEY" | "CLOUDINARY_API_SECRET"): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server environment variable ${name}`);
  return value;
}

function configureCloudinary() {
  cloudinary.config({
    cloud_name: required("CLOUDINARY_CLOUD_NAME"),
    api_key: required("CLOUDINARY_API_KEY"),
    api_secret: required("CLOUDINARY_API_SECRET"),
    secure: true,
  });
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Cloudinary request failed";
  return [process.env.CLOUDINARY_API_SECRET, process.env.CLOUDINARY_API_KEY]
    .filter((secret): secret is string => Boolean(secret))
    .reduce((clean, secret) => clean.split(secret).join("[redacted]"), message);
}

function validDeliveryUrl(url: string, publicId: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || parsed.hostname !== "res.cloudinary.com") return false;
    const prefix = `/${required("CLOUDINARY_CLOUD_NAME")}/image/upload/`;
    if (!parsed.pathname.startsWith(prefix)) return false;
    const path = parsed.pathname.slice(prefix.length).replace(/^v\d+\//, "");
    return path === `${publicId}.webp`;
  } catch {
    return false;
  }
}

async function verifyDelivery(secureUrl: string, expectedHash: string): Promise<boolean> {
  const response = await fetch(secureUrl, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) return false;
  const digest = sha256(Buffer.from(await response.arrayBuffer()));
  return digest === expectedHash;
}

function uploadStream(buffer: Buffer, publicId: string, sourceHash: string, optimizedHash: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        type: "upload",
        format: "webp",
        overwrite: false,
        unique_filename: false,
        context: `source_sha256=${sourceHash}|optimized_sha256=${optimizedHash}|optimizer=webp80-v1`,
      },
      (error: Error | undefined, result: any) => {
        if (error) reject(error);
        else resolve(result);
      },
    );
    stream.end(buffer);
  });
}

function findExistingAsset(publicId: string): Promise<any> {
  return new Promise((resolve, reject) => {
    // Cloudinary SDK 2.11 runtime signature is (public_id, callback, options).
    // The installed Cloudinary 2.11 runtime has the callback before options,
    // while its declaration file exposes options before callback. Keep this
    // call explicitly typed to the runtime signature verified in node_modules.
    (cloudinary.api.resource as unknown as (
      publicId: string,
      callback: (error?: Error, result?: any) => void,
      options: { resource_type: "image"; type: "upload"; context: true },
    ) => unknown)(
      publicId,
      (error, result) => (error ? reject(error) : resolve(result)),
      { resource_type: "image", type: "upload", context: true },
    );
  });
}

function isAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const value = error as { http_code?: number; message?: string };
  return value.http_code === 409 || /already exists|public.?id.*exist/i.test(value.message ?? "");
}

async function optimizeAndIdentify(input: CloudinaryUploadInput) {
  if (!input.bytes.byteLength || input.bytes.byteLength > MAX_SOURCE_BYTES) {
    throw new Error("Image must be between 1 byte and 10 MiB");
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(input.contentType)) {
    throw new Error("Only JPEG, PNG, and WebP images are supported");
  }

  const sourceHash = sha256(input.bytes);
  const image = sharp(input.bytes, { limitInputPixels: 40_000_000 });
  const metadata = await image.metadata();
  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
    throw new Error("Uploaded contents are not a supported image");
  }
  if ((metadata.pages ?? 1) > 1) {
    throw new Error("Animated images are not supported");
  }
  const formatForMime: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
  };
  if (metadata.format !== formatForMime[input.contentType]) {
    throw new Error("Uploaded file content does not match its declared image type");
  }

  const optimized = await image
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  const optimizedHash = sha256(optimized);
  return {
    optimized,
    sourceHash,
    optimizedHash,
    publicId: cloudinaryPublicId(input.projectId, sourceHash),
  };
}

export async function uploadProjectImage(input: CloudinaryUploadInput): Promise<UploadedCloudinaryAsset> {
  configureCloudinary();
  const { optimized, sourceHash, optimizedHash, publicId } = await optimizeAndIdentify(input);
  let asset: any;
  let reused = false;

  try {
    asset = await uploadStream(optimized, publicId, sourceHash, optimizedHash);
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw new ImageUploadError(`Cloudinary upload failed: ${sanitizeError(error)}`);
    }
    try {
      asset = await findExistingAsset(publicId);
      reused = true;
    } catch (lookupError) {
      throw new ImageUploadError(`Existing Cloudinary asset lookup failed: ${sanitizeError(lookupError)}`);
    }
  }

  const uploaded: UploadedCloudinaryAsset = {
    publicId,
    secureUrl: asset?.secure_url ?? "",
    sourceSha256: sourceHash,
    optimizedSha256: optimizedHash,
    optimizedBytes: optimized.byteLength,
  };
  if (
    asset?.public_id !== publicId || asset?.resource_type !== "image" || asset?.type !== "upload" ||
    asset?.format !== "webp" || !validDeliveryUrl(uploaded.secureUrl, publicId)
  ) {
    if (!reused && uploaded.secureUrl) {
      throw new ImageUploadError("Cloudinary upload response failed identity validation", uploaded);
    }
    throw new ImageUploadError("Cloudinary asset identity or secure WebP URL is invalid");
  }

  try {
    if (!(await verifyDelivery(uploaded.secureUrl, optimizedHash))) {
      if (!reused) throw new ImageUploadError("Cloudinary delivery content did not match the optimized image", uploaded);
      throw new ImageUploadError("Existing Cloudinary asset content does not match this upload");
    }
  } catch (error) {
    if (error instanceof ImageUploadError) throw error;
    if (!reused) throw new ImageUploadError(`Cloudinary delivery verification failed: ${sanitizeError(error)}`, uploaded);
    throw new ImageUploadError(`Existing Cloudinary delivery verification failed: ${sanitizeError(error)}`);
  }
  return uploaded;
}

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  configureCloudinary();
  await new Promise<void>((resolve, reject) => {
    // Cloudinary SDK 2.11 runtime signature is (public_id, callback, options).
    (cloudinary.uploader.destroy as unknown as (
      publicId: string,
      callback: (error?: Error, result?: any) => void,
      options: { resource_type: "image"; type: "upload"; invalidate: boolean },
    ) => unknown)(
      publicId,
      (error, result) => {
        if (error) return reject(error);
        if (result?.result === "ok" || result?.result === "not found") return resolve();
        return reject(new Error(`Unexpected Cloudinary delete result: ${result?.result ?? "empty"}`));
      },
      { resource_type: "image", type: "upload", invalidate: true },
    );
  });
}

export function cloudinaryAccountName(): string {
  return required("CLOUDINARY_CLOUD_NAME");
}

export function safeCloudinaryError(error: unknown): string {
  return sanitizeError(error);
}
