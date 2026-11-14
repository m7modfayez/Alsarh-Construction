import "server-only";

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  CloudinaryImageUploadError,
  deleteCloudinaryImage,
  uploadProjectImage,
} from "@/lib/cloudinary-project-images";
import { deleteUnreferencedCloudinaryAssets } from "@/lib/server/cloudinary-project-cleanup";
import { collectCloudinaryPublicIds } from "@/lib/project-image-cleanup";
import {
  MAX_PROJECT_IMAGE_COUNT,
  type UploadedCloudinaryAsset,
  validateImageFiles,
} from "@/lib/project-image-validation";

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

interface ProjectImageRecord {
  id: string;
  project_id: string;
  image_url: string;
  cloudinary_public_id: string | null;
  image_provider: "supabase" | "cloudinary";
  image_order: number;
  is_cover: boolean;
  created_at: string;
}

interface FinalProjectImage extends Omit<ProjectImageRecord, "id" | "created_at"> {
  id?: string;
  created_at?: string;
}

function mutationResponse(status: number, error: string) {
  return NextResponse.json({ error }, { status });
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
  if (
    new Set(images.map((image) => image.image_order)).size !== images.length ||
    images.some((image) => image.image_order < 0 || image.image_order >= images.length)
  ) {
    throw new Error("ترتيب صور المشروع مكرر أو غير متصل");
  }
  if (images.filter((image) => image.is_cover).length !== 1) throw new Error("اختر صورة غلاف واحدة للمشروع");

  const fileIndexes = images.filter((image) => image.fileIndex !== undefined).map((image) => image.fileIndex as number);
  if (
    fileIndexes.some((index) => !Number.isInteger(index) || index < 0 || index >= imageFiles.length) ||
    new Set(fileIndexes).size !== fileIndexes.length ||
    fileIndexes.length !== imageFiles.length
  ) {
    throw new Error("قائمة ملفات الصور لا تطابق الصور المرسلة");
  }

  const existingIds = images.filter((image) => image.id !== undefined).map((image) => image.id as string);
  if (
    images.some((image) => Boolean(image.id) === (image.fileIndex !== undefined)) ||
    existingIds.some((id) => !UUID_PATTERN.test(id)) ||
    new Set(existingIds).size !== existingIds.length ||
    (!editing && existingIds.length > 0)
  ) {
    throw new Error("مراجع صور المشروع غير صالحة");
  }

  return {
    projectId,
    project,
    images,
    files: imageFiles,
    expectedUpdatedAt: editing ? (expectedUpdatedAt as string) : null,
  };
}

function projectPayload(form: MutationForm, cover: {
  image_url: string;
  cloudinary_public_id: string | null;
  image_provider: "supabase" | "cloudinary";
}) {
  return {
    title: form.project.title,
    description: form.project.description,
    location: form.project.location,
    year: form.project.year,
    is_featured: form.project.is_featured,
    scope_of_work: form.project.scope_of_work,
    cover_image: cover.image_url,
    cover_image_public_id: cover.cloudinary_public_id,
    cover_image_provider: cover.image_provider,
  };
}

async function compensateUploadedAssets(
  admin: SupabaseClient,
  assets: readonly UploadedCloudinaryAsset[],
  additionalPublicIds: readonly string[] = [],
): Promise<string[]> {
  const failures: string[] = [];
  const publicIds = [...new Set([...assets.map((asset) => asset.publicId), ...additionalPublicIds])];
  for (const publicId of publicIds) {
    const [{ data: imageReferences, error: imageError }, { data: coverReferences, error: coverError }] = await Promise.all([
      admin.from("project_images").select("id").eq("cloudinary_public_id", publicId).limit(1),
      admin.from("projects").select("id").eq("cover_image_public_id", publicId).limit(1),
    ]);
    if (imageError || coverError) {
      const message = imageError?.message ?? coverError?.message ?? "تعذر التحقق من مراجع الصورة";
      failures.push(`${publicId}: ${message}`);
      console.error("Could not verify Cloudinary upload compensation references:", publicId, message);
      continue;
    }
    if ((imageReferences?.length ?? 0) > 0 || (coverReferences?.length ?? 0) > 0) {
      const message = "ما زالت الصورة مرتبطة ببيانات مشروع؛ تُركت دون حذف";
      failures.push(`${publicId}: ${message}`);
      console.error("Cloudinary upload compensation skipped for a referenced asset:", publicId);
      continue;
    }
    try {
      await deleteCloudinaryImage(publicId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "فشل حذف الصورة من Cloudinary";
      failures.push(`${publicId}: ${message}`);
      console.error("Cloudinary upload compensation failed:", publicId, message);
    }
  }
  return failures;
}

function revalidateProject(projectId: string) {
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/edit/${projectId}`);
}

async function loadProjectImages(admin: SupabaseClient, projectId: string) {
  const { data, error } = await admin
    .from("project_images")
    .select("id, project_id, image_url, cloudinary_public_id, image_provider, image_order, is_cover, created_at")
    .eq("project_id", projectId)
    .order("image_order", { ascending: true });
  if (error) throw new Error(`تعذر قراءة صور المشروع: ${error.message}`);
  return (data ?? []) as ProjectImageRecord[];
}

export async function saveProjectMutation(
  request: Request,
  admin: SupabaseClient,
  editing: boolean,
  expectedProjectId?: string,
): Promise<NextResponse> {
  let uploadedAssets: UploadedCloudinaryAsset[] = [];
  const failedUploadIds: string[] = [];
  let form: MutationForm | undefined;
  let projectCreated = false;
  let oldImages: ProjectImageRecord[] = [];
  let newPublicIds: string[] = [];
  let removedImages: ProjectImageRecord[] = [];
  let imageRowsChanged = false;

  try {
    form = await parseMutationForm(request, editing);
    if (expectedProjectId && form.projectId !== expectedProjectId) {
      throw new Error("معرّف المشروع لا يطابق عنوان الطلب");
    }
    validateImageFiles(form.files);

    let existingProject: Record<string, unknown> | null = null;
    if (editing) {
      const { data, error } = await admin.from("projects").select("*").eq("id", form.projectId).maybeSingle();
      if (error) throw new Error(`تعذر قراءة المشروع: ${error.message}`);
      if (!data) throw new Error("المشروع الحالي غير موجود");
      existingProject = data as Record<string, unknown>;
      if (new Date(existingProject.updated_at as string).getTime() !== new Date(form.expectedUpdatedAt as string).getTime()) {
        throw new Error("تم تحديث المشروع منذ آخر مرة. أعد تحميل الصفحة ثم حاول مرة أخرى.");
      }
      oldImages = await loadProjectImages(admin, form.projectId);
      const currentIds = new Set(oldImages.map((image) => image.id as string));
      if (form.images.some((image) => image.id && !currentIds.has(image.id))) {
        throw new Error("إحدى الصور المحددة لا تنتمي إلى هذا المشروع");
      }
    } else {
      const { data, error } = await admin.from("projects").select("id").eq("id", form.projectId).maybeSingle();
      if (error) throw new Error(`تعذر التحقق من معرّف المشروع: ${error.message}`);
      if (data) throw new Error("يوجد مشروع بهذا المعرّف بالفعل. حدّث الصفحة ثم حاول مرة أخرى.");
    }

    const uploadedByIndex = new Map<number, UploadedCloudinaryAsset>();
    const fileImages = form.images
      .filter((image) => image.fileIndex !== undefined)
      .sort((a, b) => (a.fileIndex as number) - (b.fileIndex as number));
    for (const image of fileImages) {
      const file = form.files[image.fileIndex as number];
      let asset: UploadedCloudinaryAsset;
      try {
        asset = await uploadProjectImage({
          projectId: form.projectId,
          bytes: Buffer.from(await file.arrayBuffer()),
          contentType: file.type,
        });
      } catch (error) {
        if (error instanceof CloudinaryImageUploadError) failedUploadIds.push(error.publicId);
        throw error;
      }
      uploadedAssets.push(asset);
      uploadedByIndex.set(image.fileIndex as number, asset);
    }

    const oldImagesById = new Map(oldImages.map((image) => [image.id as string, image]));
    const finalImages: FinalProjectImage[] = form.images.map((image) => {
      if (image.fileIndex !== undefined) {
        const asset = uploadedByIndex.get(image.fileIndex);
        if (!asset) throw new Error("نتيجة رفع الصورة غير موجودة");
        return {
          project_id: form!.projectId,
          image_url: asset.secureUrl,
          cloudinary_public_id: asset.publicId,
          image_provider: "cloudinary" as const,
          image_order: image.image_order,
          is_cover: image.is_cover,
        };
      }

      const old = oldImagesById.get(image.id as string);
      if (!old) throw new Error("لم يتم العثور على صورة المشروع الحالية");
      return {
        id: old.id,
        project_id: form!.projectId,
        image_url: old.image_url,
        cloudinary_public_id: old.cloudinary_public_id,
        image_provider: old.image_provider,
        image_order: image.image_order,
        is_cover: image.is_cover,
        created_at: old.created_at,
      };
    });

    const cover = finalImages.find((image) => image.is_cover);
    if (!cover || typeof cover.image_url !== "string" || !cover.image_url) {
      throw new Error("تعذر تحديد صورة الغلاف");
    }
    const payload = projectPayload(form, {
      image_url: cover.image_url,
      cloudinary_public_id: cover.cloudinary_public_id,
      image_provider: cover.image_provider,
    });

    if (!editing) {
      const { error: insertProjectError } = await admin
        .from("projects")
        .insert({ id: form.projectId, ...payload });
      if (insertProjectError) throw new Error(`تعذر حفظ المشروع: ${insertProjectError.message}`);
      projectCreated = true;

      const rows = finalImages.map(({ id: _id, created_at: _createdAt, ...row }) => row);
      const { error: insertImagesError } = await admin.from("project_images").insert(rows);
      if (insertImagesError) throw new Error(`تعذر حفظ صور المشروع: ${insertImagesError.message}`);
    } else {
      const keptIds = new Set(form.images.filter((image) => image.id).map((image) => image.id as string));
      removedImages = oldImages.filter((image) => !keptIds.has(image.id as string));
      newPublicIds = uploadedAssets.map((asset) => asset.publicId);

      const retainedRows = finalImages.filter((image) => image.id);
      if (retainedRows.length > 0) {
        const { error } = await admin.from("project_images").upsert(retainedRows, { onConflict: "id" });
        if (error) throw new Error(`تعذر تحديث صور المشروع: ${error.message}`);
        imageRowsChanged = true;
      }

      const newRows = finalImages
        .filter((image) => !image.id)
        .map(({ id: _id, created_at: _createdAt, ...row }) => row);
      if (newRows.length > 0) {
        const { error } = await admin.from("project_images").insert(newRows);
        if (error) throw new Error(`تعذر إضافة صور المشروع: ${error.message}`);
        imageRowsChanged = true;
      }

      const removedIds = removedImages.map((image) => image.id as string);
      if (removedIds.length > 0) {
        const { error } = await admin.from("project_images").delete().in("id", removedIds);
        if (error) throw new Error(`تعذر إزالة صور المشروع: ${error.message}`);
        imageRowsChanged = true;
      }

      const { data: updatedProject, error: updateProjectError } = await admin
        .from("projects")
        .update(payload)
        .eq("id", form.projectId)
        .eq("updated_at", form.expectedUpdatedAt as string)
        .select("id")
        .maybeSingle();
      if (updateProjectError) throw new Error(`تعذر حفظ المشروع: ${updateProjectError.message}`);
      if (!updatedProject) throw new Error("تم تعديل المشروع في نافذة أخرى. أعد تحميل الصفحة ثم حاول مرة أخرى.");
      if (!existingProject) throw new Error("تعذر تحميل بيانات المشروع الحالية");

      const removedPublicIds = removedImages
        .map((image) => image.cloudinary_public_id)
        .filter((publicId): publicId is string => Boolean(publicId));
      const cloudinaryDeletion = await deleteUnreferencedCloudinaryAssets(admin, removedPublicIds);
      revalidateProject(form.projectId);
      return NextResponse.json({ ok: true, cloudinaryDeletion });
    }

    revalidateProject(form.projectId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const originalMessage = error instanceof Error ? error.message : "تعذر حفظ المشروع";
    const recoveryErrors: string[] = [];

    if (projectCreated && form) {
      const { error: rollbackError } = await admin.from("projects").delete().eq("id", form.projectId);
      if (rollbackError) {
        recoveryErrors.push(`تعذر التراجع عن إنشاء المشروع: ${rollbackError.message}`);
        console.error("Project creation rollback failed:", rollbackError.message);
      }
    }

    if (editing && imageRowsChanged && form) {
      if (newPublicIds.length > 0) {
        const { error: removeNewRowsError } = await admin
          .from("project_images")
          .delete()
          .eq("project_id", form.projectId)
          .in("cloudinary_public_id", newPublicIds);
        if (removeNewRowsError) recoveryErrors.push(`تعذر التراجع عن الصور الجديدة: ${removeNewRowsError.message}`);
      }
      if (oldImages.length > 0) {
        const { error: restoreImagesError } = await admin.from("project_images").upsert(oldImages, { onConflict: "id" });
        if (restoreImagesError) recoveryErrors.push(`تعذر استعادة قائمة الصور السابقة: ${restoreImagesError.message}`);
      }
    }

    const cleanupFailures = await compensateUploadedAssets(admin, uploadedAssets, failedUploadIds);
    if (recoveryErrors.length || cleanupFailures.length) {
      return mutationResponse(
        500,
        `${originalMessage}. ${[...recoveryErrors, ...cleanupFailures.map((failure) => `تعذر تنظيف صورة مرفوعة: ${failure}`)].join("; ")}`,
      );
    }
    return mutationResponse(400, originalMessage);
  }
}

export async function deleteProjectMutation(projectId: string, admin: SupabaseClient): Promise<NextResponse> {
  if (!UUID_PATTERN.test(projectId)) return mutationResponse(400, "معرّف المشروع غير صالح");

  const { data: project, error: projectReadError } = await admin
    .from("projects")
    .select("id, cover_image_public_id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectReadError) return mutationResponse(409, `تعذر قراءة المشروع: ${projectReadError.message}`);
  if (!project) return mutationResponse(404, "المشروع غير موجود");

  const { data: images, error: imageReadError } = await admin
    .from("project_images")
    .select("cloudinary_public_id")
    .eq("project_id", projectId);
  if (imageReadError) return mutationResponse(409, `تعذر قراءة صور المشروع: ${imageReadError.message}`);

  const publicIds = collectCloudinaryPublicIds(
    project.cover_image_public_id,
    (images ?? []).map((image) => image.cloudinary_public_id),
  );

  const { data: imagesToDelete, error: imageDeleteError } = await admin
    .from("project_images")
    .delete()
    .eq("project_id", projectId)
    .select("id, project_id, image_url, cloudinary_public_id, image_provider, image_order, is_cover, created_at");
  if (imageDeleteError) return mutationResponse(409, `تعذر حذف صور المشروع: ${imageDeleteError.message}`);

  const { error: deleteProjectError } = await admin.from("projects").delete().eq("id", projectId);
  if (deleteProjectError) {
    if (imagesToDelete?.length) {
      const { error: restoreImagesError } = await admin.from("project_images").insert(imagesToDelete);
      if (restoreImagesError) {
        console.error("Could not restore project gallery after project deletion failed:", restoreImagesError.message);
        return mutationResponse(500, `تعذر حذف المشروع، كما تعذر استعادة صوره: ${restoreImagesError.message}`);
      }
    }
    return mutationResponse(409, `تعذر حذف المشروع: ${deleteProjectError.message}`);
  }

  const cloudinaryDeletion = await deleteUnreferencedCloudinaryAssets(admin, publicIds);
  revalidateProject(projectId);
  return NextResponse.json({
    ok: true,
    projectDeleted: true,
    cloudinaryDeletion,
  });
}

export function projectMutationError(error: unknown): NextResponse {
  const message = error instanceof Error ? error.message : "تعذر تنفيذ العملية";
  const status = message.startsWith("Missing server environment variable") ? 503 : 400;
  return mutationResponse(status, message);
}
