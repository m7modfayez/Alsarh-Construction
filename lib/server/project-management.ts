import "server-only";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isSafeCleanupJob,
  MAX_PROJECT_IMAGE_COUNT,
  persistWithCompensation,
  type UploadedCloudinaryAsset,
  uploadBatchWithCompensation,
  validateImageFiles,
} from "@/lib/project-image-lifecycle";
import {
  cloudinaryAccountName,
  deleteCloudinaryImage,
  safeCloudinaryError,
  uploadProjectImage,
} from "@/lib/cloudinary-project-images";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface ProjectFields {
  title: string;
  description: string;
  location: string;
  year: number;
  is_featured: boolean;
  scope_of_work: string[];
}

interface ClientImageDescriptor {
  id?: string;
  fileIndex?: number;
  is_cover: boolean;
  image_order: number;
}

interface MutationForm {
  projectId: string;
  project: ProjectFields;
  images: ClientImageDescriptor[];
  files: File[];
  expectedUpdatedAt: string | null;
}

function parseProjectFields(value: unknown): ProjectFields {
  if (!value || typeof value !== "object") throw new Error("بيانات المشروع غير صالحة");
  const item = value as Record<string, unknown>;
  if (typeof item.title !== "string" || !item.title.trim() || item.title.trim().length > 255) {
    throw new Error("أدخل عنوان مشروع صالحًا لا يتجاوز 255 حرفًا");
  }
  if (typeof item.location !== "string" || !item.location.trim()) throw new Error("أدخل موقع المشروع");
  const year = Number(item.year);
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new Error("أدخل سنة صالحة للمشروع");
  if (item.description !== undefined && typeof item.description !== "string") throw new Error("وصف المشروع غير صالح");
  if (item.is_featured !== undefined && typeof item.is_featured !== "boolean") throw new Error("حالة المشروع المميز غير صالحة");
  const scope = item.scope_of_work ?? [];
  if (!Array.isArray(scope) || scope.some((entry) => typeof entry !== "string")) throw new Error("نوع العمل غير صالح");
  return {
    title: item.title.trim(),
    description: (item.description as string | undefined)?.trim() ?? "",
    location: item.location.trim(),
    year,
    is_featured: Boolean(item.is_featured),
    scope_of_work: scope.map((entry) => entry.trim()).filter(Boolean),
  };
}

function jsonField(form: FormData, key: string): unknown {
  const raw = form.get(key);
  if (typeof raw !== "string") throw new Error(`الحقل ${key} مفقود`);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`الحقل ${key} ليس بصيغة JSON صحيحة`);
  }
}

async function parseMutationForm(request: Request, editing: boolean): Promise<MutationForm> {
  const form = await request.formData();
  const projectId = form.get("projectId");
  const expectedUpdatedAt = form.get("expectedUpdatedAt");
  if (typeof projectId !== "string" || !UUID_PATTERN.test(projectId)) throw new Error("معرّف المشروع غير صالح");
  if (editing && (typeof expectedUpdatedAt !== "string" || !Number.isFinite(Date.parse(expectedUpdatedAt)))) {
    throw new Error("تعذر التحقق من إصدار المشروع الحالي. أعد تحميل صفحة التعديل.");
  }
  const files = form.getAll("files");
  if (files.some((file) => typeof file === "string" || !(file instanceof File))) throw new Error("ملف صورة غير صالح");
  const imageFiles = files as File[];
  validateImageFiles(imageFiles);

  const project = parseProjectFields(jsonField(form, "project"));
  const imagesValue = jsonField(form, "images");
  if (!Array.isArray(imagesValue) || imagesValue.length < 1 || imagesValue.length > MAX_PROJECT_IMAGE_COUNT) {
    throw new Error(`يجب أن يحتوي المشروع على صورة واحدة إلى ${MAX_PROJECT_IMAGE_COUNT} صورة`);
  }
  const images = imagesValue as ClientImageDescriptor[];
  if (images.some((image) => !image || typeof image !== "object" || typeof image.is_cover !== "boolean" || !Number.isInteger(image.image_order))) {
    throw new Error("ترتيب صور المشروع غير صالح");
  }
  if (new Set(images.map((image) => image.image_order)).size !== images.length ||
      images.some((image) => image.image_order < 0 || image.image_order >= images.length)) {
    throw new Error("ترتيب صور المشروع مكرر أو غير متصل");
  }
  if (images.filter((image) => image.is_cover).length !== 1) throw new Error("اختر صورة غلاف واحدة للمشروع");
  const indices = images.filter((image) => image.fileIndex !== undefined).map((image) => image.fileIndex);
  if (indices.some((index) => !Number.isInteger(index) || (index as number) < 0 || (index as number) >= imageFiles.length) ||
      new Set(indices).size !== indices.length || indices.length !== imageFiles.length) {
    throw new Error("قائمة ملفات الصور لا تطابق الصور المرسلة");
  }
  const existingIds = images.filter((image) => image.id !== undefined).map((image) => image.id as string);
  if (images.some((image) => Boolean(image.id) === (image.fileIndex !== undefined)) ||
      existingIds.some((id) => !UUID_PATTERN.test(id)) || new Set(existingIds).size !== existingIds.length ||
      (!editing && existingIds.length > 0)) {
    throw new Error("مراجع صور المشروع غير صالحة");
  }

  return {
    projectId,
    project,
    images,
    files: imageFiles,
    expectedUpdatedAt: editing ? expectedUpdatedAt as string : null,
  };
}

async function enqueueCleanup(admin: SupabaseClient, assets: readonly UploadedCloudinaryAsset[]) {
  if (!assets.length) return;
  const { error } = await admin.rpc("cloudinary_enqueue_orphan_assets", {
    p_assets: assets.map((asset) => ({ public_id: asset.publicId, secure_url: asset.secureUrl })),
  });
  if (error) throw new Error(`Could not register Cloudinary cleanup: ${error.message}`);
}

export interface CleanupResult {
  checked: number;
  deleted: number;
  failed: number;
  failures: string[];
}

export async function processCloudinaryCleanup(admin: SupabaseClient): Promise<CleanupResult> {
  const { data, error } = await admin.rpc("cloudinary_claim_asset_cleanup_jobs", { p_limit: 20 });
  if (error) throw new Error(`Could not claim Cloudinary cleanup jobs: ${error.message}`);
  const jobs = (data ?? []) as Array<{
    id: string;
    cloudinary_public_id: string;
    secure_url: string;
  }>;
  const result: CleanupResult = { checked: jobs.length, deleted: 0, failed: 0, failures: [] };
  const cloudName = cloudinaryAccountName();

  for (const job of jobs) {
    let success = false;
    let message: string | null = null;
    try {
      if (!isSafeCleanupJob(job, cloudName)) throw new Error("Cleanup job identity or Cloudinary URL failed validation");
      await deleteCloudinaryImage(job.cloudinary_public_id);
      success = true;
    } catch (error) {
      message = safeCloudinaryError(error);
    }
    const { error: finishError } = await admin.rpc("cloudinary_finish_asset_cleanup", {
      p_job_id: job.id,
      p_success: success,
      p_error: message,
    });
    if (finishError) {
      result.failed += 1;
      result.failures.push(`${job.cloudinary_public_id}: cleanup result could not be recorded`);
    } else if (success) {
      result.deleted += 1;
    } else {
      result.failed += 1;
      result.failures.push(`${job.cloudinary_public_id}: ${message ?? "Cloudinary cleanup failed"}`);
    }
  }
  return result;
}

function mutationResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

function getFilesInDescriptorOrder(form: MutationForm): File[] {
  return form.images
    .filter((image) => image.fileIndex !== undefined)
    .sort((a, b) => (a.fileIndex as number) - (b.fileIndex as number))
    .map((image) => form.files[image.fileIndex as number]);
}

function makeRpcImageList(form: MutationForm, uploaded: UploadedCloudinaryAsset[]) {
  return form.images.map((image) => {
    if (image.id) {
      return { id: image.id, is_cover: image.is_cover, image_order: image.image_order };
    }
    const asset = uploaded[image.fileIndex as number];
    if (!asset) throw new Error("Uploaded image result is missing");
    return {
      image_url: asset.secureUrl,
      cloudinary_public_id: asset.publicId,
      image_provider: "cloudinary",
      is_cover: image.is_cover,
      image_order: image.image_order,
    };
  });
}

function revalidateProject(projectId: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/edit/${projectId}`);
}

export async function saveProjectMutation(
  request: Request,
  admin: SupabaseClient,
  editing: boolean,
  expectedProjectId?: string,
): Promise<NextResponse> {
  let form: MutationForm | undefined;
  let uploaded: UploadedCloudinaryAsset[] = [];
  let cleanupMayBeNeeded = false;
  try {
    form = await parseMutationForm(request, editing);
    if (expectedProjectId && form.projectId !== expectedProjectId) throw new Error("معرّف المشروع لا يطابق عنوان الطلب");
    const orderedFiles = getFilesInDescriptorOrder(form);
    validateImageFiles(orderedFiles);
    const assets = await uploadBatchWithCompensation(
      orderedFiles,
      async (file) => uploadProjectImage({
        projectId: form!.projectId,
        bytes: Buffer.from(await file.arrayBuffer()),
        contentType: file.type,
      }),
      (created) => enqueueCleanup(admin, created),
    );
    cleanupMayBeNeeded = assets.length > 0;
    // File-index references are unique, so reorder the results back to their
    // original FormData index before building the transactional RPC payload.
    uploaded = [];
    const byFileIndex = new Map<number, UploadedCloudinaryAsset>();
    form.images
      .filter((image) => image.fileIndex !== undefined)
      .sort((a, b) => (a.fileIndex as number) - (b.fileIndex as number))
      .forEach((image, index) => {
      byFileIndex.set(image.fileIndex as number, assets[index]);
      });
    uploaded = form.files.map((_, index) => byFileIndex.get(index) as UploadedCloudinaryAsset);

    const imageRows = makeRpcImageList(form, uploaded);
    const { data, error } = await persistWithCompensation(assets, async () => {
      const result = await admin.rpc("cloudinary_save_project", {
        p_project_id: form!.projectId,
        p_expected_updated_at: form!.expectedUpdatedAt,
        p_project: form!.project,
        p_images: imageRows,
      });
      if (result.error) throw new Error(result.error.message);
      return result.data;
    }, (created) => enqueueCleanup(admin, created));

    const cleanup = await processCloudinaryCleanup(admin).catch((error) => ({
      checked: 0, deleted: 0, failed: 1,
      failures: [error instanceof Error ? error.message : "تعذر تنفيذ تنظيف Cloudinary"],
    }));
    revalidateProject(form.projectId);
    return NextResponse.json({ ok: true, data, cleanup });
  } catch (error) {
    if (cleanupMayBeNeeded || (error instanceof Error && error.name === "ImageBatchError")) {
      await processCloudinaryCleanup(admin).catch(() => undefined);
    }
    return mutationResponse(400, error instanceof Error ? error.message : "تعذر حفظ المشروع");
  }
}

export async function deleteProjectMutation(projectId: string, admin: SupabaseClient): Promise<NextResponse> {
  if (!UUID_PATTERN.test(projectId)) return mutationResponse(400, "معرّف المشروع غير صالح");
  const { data, error } = await admin.rpc("cloudinary_delete_project", { p_project_id: projectId });
  if (error) return mutationResponse(409, `تعذر حذف المشروع: ${error.message}`);
  if (!(data as { deleted?: boolean } | null)?.deleted) return mutationResponse(404, "المشروع غير موجود");

  const cleanup = await processCloudinaryCleanup(admin).catch((cleanupError) => ({
    checked: 0, deleted: 0, failed: 1,
    failures: [cleanupError instanceof Error ? cleanupError.message : "تعذر تنفيذ تنظيف Cloudinary"],
  }));
  revalidateProject(projectId);
  return NextResponse.json({ ok: true, projectDeleted: true, cleanup });
}

export async function retryCloudinaryCleanup(admin: SupabaseClient): Promise<NextResponse> {
  try {
    return NextResponse.json({ ok: true, cleanup: await processCloudinaryCleanup(admin) });
  } catch (error) {
    return mutationResponse(503, error instanceof Error ? error.message : "تعذر إعادة محاولة تنظيف Cloudinary");
  }
}

export async function cloudinaryCleanupStatus(admin: SupabaseClient): Promise<NextResponse> {
  const { count, error } = await admin
    .from("cloudinary_asset_cleanup_jobs")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "failed", "processing"]);
  if (error) return mutationResponse(503, "تعذر قراءة حالة تنظيف صور Cloudinary");
  return NextResponse.json({ pending: count ?? 0 });
}

export function projectMutationError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "تعذر تنفيذ العملية";
  const status = message.startsWith("Missing server environment variable") ? 503 : 400;
  return mutationResponse(status, message);
}
