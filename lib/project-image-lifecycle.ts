export const MAX_PROJECT_IMAGE_COUNT = 20;
export const MAX_IMAGE_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_BATCH_BYTES = 30 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export interface UploadedCloudinaryAsset {
  publicId: string;
  secureUrl: string;
  sourceSha256: string;
  optimizedSha256: string;
  optimizedBytes: number;
}

export interface ImageFileLike {
  type: string;
  size: number;
}

export class ImageBatchError extends Error {
  constructor(
    message: string,
    readonly cleanupError?: unknown,
  ) {
    super(message);
    this.name = "ImageBatchError";
  }
}

export class ImageUploadError extends Error {
  constructor(
    message: string,
    readonly uploadedAsset?: UploadedCloudinaryAsset,
  ) {
    super(message);
    this.name = "ImageUploadError";
  }
}

export function validateImageFiles(files: readonly ImageFileLike[]): void {
  if (files.length > MAX_PROJECT_IMAGE_COUNT) {
    throw new Error(`يمكن إضافة ${MAX_PROJECT_IMAGE_COUNT} صورة كحد أقصى للمشروع`);
  }

  let batchBytes = 0;
  for (const [index, file] of files.entries()) {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.type)) {
      throw new Error(`نوع الصورة رقم ${index + 1} غير مدعوم. استخدم JPEG أو PNG أو WebP.`);
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

export function cloudinaryPublicId(projectId: string, sourceSha256: string): string {
  if (!/^[0-9a-f-]{36}$/i.test(projectId) || !/^[a-f0-9]{64}$/i.test(sourceSha256)) {
    throw new Error("Invalid deterministic Cloudinary asset identity");
  }
  return `projects/${projectId}/${sourceSha256.toLowerCase()}`;
}

export function isSafeCloudinaryPublicId(value: string): boolean {
  return /^(projects\/[0-9a-f-]{36}\/[a-f0-9]{64}|supabase-projects\/[a-zA-Z0-9_-]+)$/i.test(value);
}

export async function uploadBatchWithCompensation<TFile, TAsset extends UploadedCloudinaryAsset>(
  files: readonly TFile[],
  upload: (file: TFile, index: number) => Promise<TAsset>,
  enqueueCleanup: (assets: readonly TAsset[]) => Promise<void>,
  concurrency = 3,
): Promise<TAsset[]> {
  const assets: TAsset[] = [];
  const failures: unknown[] = [];
  let nextIndex = 0;

  const worker = async () => {
    while (true) {
      const index = nextIndex++;
      if (index >= files.length) return;
      try {
        assets[index] = await upload(files[index], index);
      } catch (error) {
        if (error instanceof ImageUploadError && error.uploadedAsset) {
          assets[index] = error.uploadedAsset as TAsset;
        }
        failures.push(error);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), files.length) }, worker),
  );

  if (failures.length) {
    const uploadedAssets = assets.filter((asset): asset is TAsset => Boolean(asset));
    let cleanupError: unknown;
    if (uploadedAssets.length) {
      try {
        await enqueueCleanup(uploadedAssets);
      } catch (error) {
        cleanupError = error;
      }
    }
    const message = failures
      .map((error) => (error instanceof Error ? error.message : "تعذر رفع إحدى الصور"))
      .join("; ");
    throw new ImageBatchError(
      cleanupError
        ? `${message}. تعذر تسجيل تنظيف الصور المرفوعة؛ يلزم فحص قائمة التنظيف.`
        : message,
      cleanupError,
    );
  }

  return assets;
}

export async function persistWithCompensation<T, TAsset extends UploadedCloudinaryAsset>(
  assets: readonly TAsset[],
  persist: () => Promise<T>,
  enqueueCleanup: (assets: readonly TAsset[]) => Promise<void>,
): Promise<T> {
  try {
    return await persist();
  } catch (error) {
    if (assets.length) {
      try {
        await enqueueCleanup(assets);
      } catch (cleanupError) {
        throw new ImageBatchError(
          `حُفظت الصور على Cloudinary لكن تعذر حفظ بيانات المشروع أو تسجيل تنظيف الصور: ${error instanceof Error ? error.message : "فشل حفظ المشروع"}`,
          cleanupError,
        );
      }
    }
    throw error;
  }
}

export interface CleanupJobLike {
  id: string;
  cloudinary_public_id: string;
  secure_url: string;
}

export function isSafeCleanupJob(
  job: CleanupJobLike,
  cloudName: string,
): boolean {
  if (!isSafeCloudinaryPublicId(job.cloudinary_public_id)) return false;
  try {
    const url = new URL(job.secure_url);
    if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return false;
    const prefix = `/${cloudName}/image/upload/`;
    if (!url.pathname.startsWith(prefix)) return false;
    let assetPath = url.pathname.slice(prefix.length);
    assetPath = assetPath.replace(/^v\d+\//, "");
    return assetPath === `${job.cloudinary_public_id}.webp`;
  } catch {
    return false;
  }
}
