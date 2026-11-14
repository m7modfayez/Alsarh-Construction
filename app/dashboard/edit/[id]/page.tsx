"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "@/components/ResilientImage";
import { Upload, X, ArrowLeft, Save, ArrowUp, ArrowDown } from "lucide-react";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/project-image-validation";
import { runWithPendingState } from "@/lib/project-image-pending";
import { supabase } from "@/lib/supabaseClient";

interface ProjectImage {
  id: string;
  image_url: string;
  cloudinary_public_id: string | null;
  image_provider: "supabase" | "cloudinary";
  image_order: number;
  is_cover: boolean;
}

type ImageDraft = {
  kind: "existing";
  id: string;
  image_url: string;
  cloudinary_public_id: string | null;
  image_provider: "supabase" | "cloudinary";
  image_order: number;
  isCover: boolean;
} | {
  kind: "new";
  file: File;
  previewUrl: string;
  isCover: boolean;
};

interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  year: number;
  cover_image: string;
  scope_of_work?: string;
  updated_at: string;
  cover_image_public_id: string | null;
  cover_image_provider: "supabase" | "cloudinary";
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const submittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [year, setYear] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [images, setImages] = useState<ImageDraft[]>([]);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setInitialLoading(true);

      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (projectError) throw projectError;

      const { data: imagesData, error: imagesError } = await supabase
        .from("project_images")
        .select("*")
        .eq("project_id", projectId)
        .order("image_order", { ascending: true });

      if (imagesError) throw imagesError;

      setProject(projectData);
      setTitle(projectData.title);
      setDescription(projectData.description || "");
      setLocation(projectData.location);
      setYear(projectData.year.toString());
      setIsFeatured(Boolean(projectData.is_featured));
      setScopeOfWork(
        Array.isArray(projectData.scope_of_work)
          ? projectData.scope_of_work.join(" + ")
          : projectData.scope_of_work || "",
      );
      setImages((imagesData || []).map((image: ProjectImage) => ({
        kind: "existing" as const,
        id: image.id,
        image_url: image.image_url,
        cloudinary_public_id: image.cloudinary_public_id,
        image_provider: image.image_provider,
        image_order: image.image_order,
        isCover: image.is_cover,
      })));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "فشل في جلب بيانات المشروع",
      );
    } finally {
      setInitialLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    const unsupported = files.find((file) => !ALLOWED_IMAGE_MIME_TYPES.has(file.type));
    const tooLarge = files.find((file) => file.size === 0 || file.size > 10 * 1024 * 1024);
    if (unsupported) setError("نوع الصورة غير مدعوم. استخدم JPEG أو PNG أو WebP أو AVIF.");
    else if (tooLarge) setError("يجب ألا يتجاوز حجم الصورة الواحدة 10 ميجابايت.");
    else if (images.length + files.length > 20 ||
      images.reduce((sum, image) => sum + (image.kind === "new" ? image.file.size : 0), 0) + files.reduce((sum, file) => sum + file.size, 0) > 30 * 1024 * 1024) {
      setError("الحد الأقصى 20 صورة وإجمالي 30 ميجابايت للمشروع.");
    } else {
      const drafts = files.map((file) => ({
        kind: "new" as const,
        file,
        previewUrl: URL.createObjectURL(file),
        isCover: false,
      }));
      setImages((prev) => [...prev, ...drafts]);
    }
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const image = images[index];
    if (image?.kind === "new") URL.revokeObjectURL(image.previewUrl);
    setImages((prev) => {
      const next = prev.filter((_, imageIndex) => imageIndex !== index);
      if (image?.isCover && next.length > 0) next[0] = { ...next[0], isCover: true };
      return next.map((item, imageIndex) => item.kind === "existing"
        ? { ...item, image_order: imageIndex }
        : item);
    });
  };

  const handleSetCover = (index: number) => setImages((prev) => prev.map((image, i) => ({ ...image, isCover: i === index })));

  const handleMoveImage = (index: number, offset: number) => setImages((prev) => {
    const target = index + offset;
    if (target < 0 || target >= prev.length) return prev;
    const next = [...prev];
    [next[index], next[target]] = [next[target], next[index]];
    return next.map((image, i) => image.kind === "existing" ? { ...image, image_order: i } : image);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!title.trim() || !location.trim() || !year.trim()) {
      setError("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    if (images.length === 0) {
      setError("يجب أن يحتوي المشروع على صورة واحدة على الأقل");
      return;
    }

    const hasCover = images.some((img) => img.isCover);
    if (!hasCover) {
      setError("الرجاء اختيار صورة غلاف");
      return;
    }

    submittingRef.current = true;
    setError(null);

    try {
      const result = await runWithPendingState(async () => {
        if (!project) throw new Error("تعذر تحميل بيانات المشروع");
        const formData = new FormData();
        formData.set("projectId", projectId);
        formData.set("expectedUpdatedAt", project.updated_at);
        formData.set("project", JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          year: parseInt(year),
          is_featured: isFeatured,
          scope_of_work: scopeOfWork.trim()
            ? scopeOfWork
                .trim()
                .split(/[\+,\u2022]/)
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
            : [],
        }));
        const files: File[] = [];
        const descriptors = images.map((image, index) => {
          if (image.kind === "existing") {
            return { id: image.id, is_cover: image.isCover, image_order: index };
          }
          const fileIndex = files.length;
          files.push(image.file);
          return { fileIndex, is_cover: image.isCover, image_order: index };
        });
        formData.set("images", JSON.stringify(descriptors));
        files.forEach((file) => formData.append("files", file, file.name));
        const response = await fetch(`/api/admin/projects/${projectId}`, { method: "PUT", body: formData });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "فشل في تحديث المشروع");
        return result;
      }, setLoading);
      if (result.cloudinaryDeletion?.failed) {
        const failures = Array.isArray(result.cloudinaryDeletion.failures)
          ? result.cloudinaryDeletion.failures.join("؛ ")
          : "";
        setError(`تم تحديث المشروع، لكن تعذر تأكيد حذف بعض الصور المُزالة من Cloudinary. أعد تحميل الصفحة قبل إجراء تعديلات أخرى.${failures ? ` ${failures}` : ""}`);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في تحديث المشروع");
    } finally {
      submittingRef.current = false;
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          العودة إلى المشاريع
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة إلى المشاريع
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">تعديل المشروع</h1>
        <p className="text-gray-600 mt-1">تحديث تفاصيل المشروع</p>
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            المعلومات الأساسية
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                عنوان المشروع *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل عنوان المشروع"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الموقع *
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="أدخل موقع المشروع"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                السنة *
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="2000"
                max="2030"
                required
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع العمل
            </label>
            <textarea
              value={scopeOfWork}
              onChange={(e) => setScopeOfWork(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="نوع العمل (مفصول بفواصل)"
            />
          </div>

          <div className="mt-6">
            <label className="inline-flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/50 px-4 py-3 text-sm font-medium text-gray-800">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              <span>مشروع مميز</span>
            </label>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوصف
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="أدخل وصف المشروع"
            />
          </div>
        </div>

        {/* Project Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            صور المشروع
          </h2>

          <div className="mb-6">
            <label className="block">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleImageUpload}
                className="hidden"
                disabled={loading}
              />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600">اضغط لرفع الصور أو اسحب وأفلت</p>
                <p className="text-sm text-gray-500 mt-1">
                  يمكنك رفع عدة صور في نفس الوقت
                </p>
              </div>
            </label>
          </div>

          <p className="text-xs text-gray-500 mb-4">إزالة الصور وترتيبها وتغيير الغلاف تُحفظ مع زر تحديث المشروع.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => {
              const src = image.kind === "existing" ? image.image_url : image.previewUrl;
              return (
                <div key={image.kind === "existing" ? image.id : image.previewUrl} className="relative group">
                  <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <Image src={src} alt={`صورة المشروع ${index + 1}`} fill unoptimized={image.kind === "new"} sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                  </div>
                  {image.isCover && <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">صورة الغلاف</div>}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    {!image.isCover && <button type="button" onClick={() => handleSetCover(index)} disabled={loading} className="p-2 bg-white rounded-full hover:bg-gray-100" title="تعيين كصورة غلاف" aria-label={`تعيين الصورة ${index + 1} كغلاف`}><span>📷</span></button>}
                    <button type="button" onClick={() => handleMoveImage(index, -1)} disabled={loading || index === 0} className="p-2 bg-white rounded-full hover:bg-gray-100 disabled:opacity-40" title="تحريك للأعلى" aria-label={`تحريك الصورة ${index + 1} للأعلى`}><ArrowUp className="h-4 w-4" /></button>
                    <button type="button" onClick={() => handleMoveImage(index, 1)} disabled={loading || index === images.length - 1} className="p-2 bg-white rounded-full hover:bg-gray-100 disabled:opacity-40" title="تحريك للأسفل" aria-label={`تحريك الصورة ${index + 1} للأسفل`}><ArrowDown className="h-4 w-4" /></button>
                    <button type="button" onClick={() => handleRemoveImage(index)} disabled={loading} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600" title="إزالة الصورة" aria-label={`إزالة الصورة ${index + 1}`}><X className="h-4 w-4" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                جاري التحديث...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                تحديث المشروع
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
