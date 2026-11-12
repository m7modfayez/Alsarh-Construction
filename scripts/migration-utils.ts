import { createHash } from "node:crypto";

export type ListedImage = { name: string; metadata?: { size?: number; mimetype?: string } | null; id?: string | null };

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export type CloudinaryResourceExpectation = {
  publicId: string;
  secureUrl: string;
  sourceSha256?: string;
  optimizedSha256?: string;
};

export function cloudinaryUploadContext(sourceSha256: string, optimizedSha256: string): Record<string, string> {
  // Cloudinary's SDK serializes context as a flat key/value map. A nested
  // `{ custom: { ... } }` object becomes `[object Object]` and loses metadata.
  return { source_sha256: sourceSha256, optimized_sha256: optimizedSha256 };
}

export function lookupCloudinaryImageResource<T>(
  api: { resource: (publicId: string, options: { resource_type: "image"; type: "upload" }) => Promise<T> },
  publicId: string,
): Promise<T> {
  // Cloudinary v2's Promise API takes options second and callback third.
  return api.resource(publicId, { resource_type: "image", type: "upload" });
}

export function cloudinaryResourceMismatch(
  expected: CloudinaryResourceExpectation,
  resource: Record<string, any>,
): string | undefined {
  if (resource.public_id !== expected.publicId) return `public_id mismatch (received '${String(resource.public_id ?? "missing")}')`;
  if (resource.secure_url !== expected.secureUrl) return "secure_url does not match the stored URL";
  if (resource.resource_type !== "image") return `resource_type mismatch (received '${String(resource.resource_type ?? "missing")}')`;
  if (resource.type !== "upload") return `type mismatch (received '${String(resource.type ?? "missing")}')`;
  if (resource.format !== "webp") return `format mismatch (received '${String(resource.format ?? "missing")}')`;
  const custom = resource.context?.custom ?? {};
  if (expected.sourceSha256 && custom.source_sha256 !== expected.sourceSha256) return "source_sha256 metadata is missing or does not match";
  if (expected.optimizedSha256 && custom.optimized_sha256 !== expected.optimizedSha256) return "optimized_sha256 metadata is missing or does not match";
  return undefined;
}

export function cloudinaryApiError(error: unknown): { code: string; message: string } {
  const value = error && typeof error === "object" ? error as Record<string, any> : {};
  const nested = value.error && typeof value.error === "object" ? value.error as Record<string, any> : {};
  return {
    code: String(value.http_code ?? nested.http_code ?? value.code ?? nested.code ?? "UNKNOWN"),
    message: String(nested.message ?? value.message ?? error ?? "Unknown Cloudinary API error"),
  };
}

export function supportsMigrationFormat(file: ListedImage): boolean {
  // Restrict input to the known static formats. GIF, WebP, TIFF, HEIC, AVIF,
  // and unknown formats are deliberately skipped rather than flattened.
  return /\.(jpe?g|png)$/i.test(file.name);
}

export function unsupportedFormatReason(file: ListedImage): string {
  const extension = file.name.match(/\.[^.]+$/)?.[0] ?? "(no extension)";
  return /\.gif$/i.test(file.name)
    ? "GIF may be animated; animated or potentially animated formats are not migrated"
    : `Unsupported format '${extension}'; only JPEG and PNG are migrated`;
}

export function animatedImageReason(format: string | undefined, pages: number | undefined): string | undefined {
  return (pages ?? 1) > 1
    ? `Animated or multipage ${format ?? "image"} detected; animation is not flattened or migrated`
    : undefined;
}

export function selectSupportedImages(files: ListedImage[], limit?: number): ListedImage[] {
  const supported = files.filter(supportsMigrationFormat).sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  if (limit !== undefined && supported.length < limit) {
    throw new Error(`Requested ${limit} supported JPEG/PNG images, but only ${supported.length} were found`);
  }
  return limit === undefined ? supported : supported.slice(0, limit);
}

export function selectLargestSupportedImages(
  files: ListedImage[],
  sizesByPath: ReadonlyMap<string, number>,
  count: number,
): ListedImage[] {
  const supported = files.filter(supportsMigrationFormat);
  for (const file of supported) {
    const size = sizesByPath.get(file.name);
    if (typeof size !== "number" || !Number.isSafeInteger(size) || size < 0) {
      throw new Error(`Original file size is unavailable for supported image '${file.name}'`);
    }
  }
  supported.sort((a, b) => {
    const sizeDifference = (sizesByPath.get(b.name) as number) - (sizesByPath.get(a.name) as number);
    return sizeDifference || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);
  });
  if (supported.length < count) {
    throw new Error(`Requested ${count} largest supported JPEG/PNG images, but only ${supported.length} were found`);
  }
  return supported.slice(0, count);
}

export function validateSelectionOptions(limit?: number, largest?: number): void {
  if (limit !== undefined && largest !== undefined) {
    throw new Error("--limit and --largest cannot be used together; choose one upload selection option");
  }
}

export function matchesOptimizedContent(previousSha256: string | undefined, currentSha256: string): boolean {
  return Boolean(previousSha256) && previousSha256 === currentSha256;
}

/** Validate a delivery URL's identity before trusting downloaded bytes as an asset check. */
export function cloudinaryDeliveryUrlMismatch(secureUrl: string, cloudName: string, publicId: string): string | undefined {
  try {
    const url = new URL(secureUrl);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return "URL is not a Cloudinary HTTPS delivery URL";
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.shift() !== cloudName) return "Cloudinary URL cloud name does not match configuration";
    if (segments.shift() !== "image" || segments.shift() !== "upload") return "Cloudinary URL is not an image/upload delivery URL";
    if (/^v\d+$/.test(segments[0] ?? "")) segments.shift();
    const deliveredId = segments.join("/").replace(/\.webp$/i, "");
    if (!secureUrl.toLowerCase().endsWith(".webp") || deliveredId !== publicId) return "Cloudinary URL public_id or WebP format does not match";
    return undefined;
  } catch {
    return "Cloudinary secure_url is malformed";
  }
}

export function deterministicPublicId(objectPath: string, sourceSha256: string, optimizedSha256?: string): string {
  const pathDigest = createHash("sha256").update(objectPath).digest("hex");
  const suffix = optimizedSha256 ? `-${optimizedSha256}` : "";
  return `supabase-projects/${pathDigest}-${sourceSha256}${suffix}`;
}
