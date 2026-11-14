export const MAX_PROJECT_IMAGE_COUNT = 20;
export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_BATCH_BYTES = 30 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export interface UploadedCloudinaryAsset {
  publicId: string;
  secureUrl: string;
}

export interface ImageFileLike {
  type: string;
  size: number;
}

export function validateImageFiles(files: readonly ImageFileLike[]): void {
  if (files.length > MAX_PROJECT_IMAGE_COUNT) {
    throw new Error(`يمكن إضافة ${MAX_PROJECT_IMAGE_COUNT} صورة كحد أقصى للمشروع`);
  }

  let batchBytes = 0;
  for (const [index, file] of files.entries()) {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      throw new Error(`نوع الصورة رقم ${index + 1} غير مدعوم. استخدم JPEG أو PNG أو WebP أو AVIF.`);
    }
    if (!Number.isSafeInteger(file.size) || file.size <= 0 || file.size > MAX_IMAGE_FILE_BYTES) {
      throw new Error(`حجم الصورة رقم ${index + 1} غير صالح أو يتجاوز 10 ميجابايت`);
    }
    batchBytes += file.size;
  }
  if (batchBytes > MAX_IMAGE_BATCH_BYTES) {
    throw new Error("إجمالي حجم الصور يتجاوز 30 ميجابايت");
  }
}
