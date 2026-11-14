import "server-only";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import type { UploadedCloudinaryAsset } from "@/lib/project-image-validation";

const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
const CLOUDINARY_DELETE_TIMEOUT_MS = 15_000;
const WEBP_QUALITY = 80;
const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export interface CloudinaryUploadInput {
  projectId: string;
  bytes: Buffer;
  contentType: string;
}

export class CloudinaryImageUploadError extends Error {
  constructor(message: string, readonly publicId: string) {
    super(message);
    this.name = "CloudinaryImageUploadError";
  }
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

function sanitizeError(error: unknown): string {
  let message = "Cloudinary request failed";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === "object" && error !== null) {
    const candidate = error as { message?: unknown; error?: { message?: unknown } };
    if (typeof candidate.message === "string") message = candidate.message;
    else if (typeof candidate.error?.message === "string") message = candidate.error.message;
  }
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
    const assetPath = parsed.pathname.slice(prefix.length).replace(/^v\d+\//, "");
    return assetPath === `${publicId}.webp`;
  } catch {
    return false;
  }
}

function uploadStream(buffer: Buffer, publicId: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: "image",
        type: "upload",
        format: "webp",
        overwrite: false,
        unique_filename: false,
      },
      (error, result) => {
        if (error) reject(error);
        else if (result) resolve(result);
        else reject(new Error("Cloudinary returned an empty upload response"));
      },
    );
    stream.end(buffer);
  });
}

async function optimizeImage(input: CloudinaryUploadInput): Promise<Buffer> {
  if (!input.bytes.byteLength || input.bytes.byteLength > MAX_SOURCE_BYTES) {
    throw new Error("Image must be between 1 byte and 10 MiB");
  }
  if (!SUPPORTED_MIME_TYPES.includes(input.contentType)) {
    throw new Error("Only JPEG, PNG, WebP, and AVIF images are supported");
  }

  const image = sharp(input.bytes, { limitInputPixels: 40_000_000 });
  const metadata = await image.metadata();
  const decodedFormat = metadata.format === "heif" && metadata.compression === "av1"
    ? "avif"
    : metadata.format;
  const formatForMime: Record<string, string> = {
    "image/jpeg": "jpeg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  if (!decodedFormat || decodedFormat !== formatForMime[input.contentType]) {
    throw new Error("Uploaded file content does not match its declared image type");
  }
  if ((metadata.pages ?? 1) > 1) {
    throw new Error("Animated images are not supported");
  }

  const optimized = await image
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  if ((await sharp(optimized).metadata()).format !== "webp") {
    throw new Error("Image encoder did not produce a WebP file");
  }
  return optimized;
}

function validateUploadResponse(asset: UploadApiResponse, expectedPrefix: string): UploadedCloudinaryAsset {
  if (
    asset.resource_type !== "image" ||
    asset.type !== "upload" ||
    asset.format !== "webp" ||
    typeof asset.public_id !== "string" ||
    !asset.public_id.startsWith(expectedPrefix) ||
    !validDeliveryUrl(asset.secure_url, asset.public_id)
  ) {
    throw new Error("Cloudinary returned an invalid image identity or secure WebP URL");
  }
  return { publicId: asset.public_id, secureUrl: asset.secure_url };
}

export async function uploadProjectImage(input: CloudinaryUploadInput): Promise<UploadedCloudinaryAsset> {
  configureCloudinary();
  const optimized = await optimizeImage(input);
  const expectedPrefix = `projects/${input.projectId}/`;
  const requestedPublicId = `${expectedPrefix}${randomUUID()}`;
  try {
    const response = await uploadStream(optimized, requestedPublicId);
    return validateUploadResponse(response, expectedPrefix);
  } catch (error) {
    throw new CloudinaryImageUploadError(sanitizeError(error), requestedPublicId);
  }
}

export async function deleteCloudinaryImage(publicId: string): Promise<"deleted" | "not_found"> {
  configureCloudinary();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Cloudinary deletion timed out after ${CLOUDINARY_DELETE_TIMEOUT_MS / 1000} seconds`)),
      CLOUDINARY_DELETE_TIMEOUT_MS,
    );
  });

  try {
    const result = await Promise.race([
      cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
        type: "upload",
        invalidate: true,
      }) as Promise<{ result?: string }>,
      timeout,
    ]);

    if (result.result === "ok") return "deleted";
    if (result.result === "not found") return "not_found";
    throw new Error(`Unexpected Cloudinary delete result: ${result.result ?? "empty"}`);
  } catch (error) {
    throw new Error(sanitizeError(error));
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
