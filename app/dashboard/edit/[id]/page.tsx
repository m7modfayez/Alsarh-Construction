"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Upload, X, ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface ProjectImage {
  id?: string;
  image_url: string;
  is_cover: boolean;
}

interface UploadedImage {
  file: File;
  url: string;
  isCover: boolean;
  isNew: boolean;
}

interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  year: number;
  cover_image: string;
  scope_of_work?: string;
}

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [year, setYear] = useState("");
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [existingImages, setExistingImages] = useState<ProjectImage[]>([]);
  const [newImages, setNewImages] = useState<UploadedImage[]>([]);

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
        .eq("project_id", projectId);

      if (imagesError) throw imagesError;

      setProject(projectData);
      setTitle(projectData.title);
      setDescription(projectData.description || "");
      setLocation(projectData.location);
      setYear(projectData.year.toString());
      setScopeOfWork(
        Array.isArray(projectData.scope_of_work)
          ? projectData.scope_of_work.join(" + ")
          : projectData.scope_of_work || "",
      );
      setExistingImages(imagesData || []);
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

    setLoading(true);
    setError(null);

    try {
      // ✅ FIX: Upload all files in PARALLEL instead of a sequential for-loop.
      // For multiple images, this is significantly faster.
      const uploadPromises = files.map(async (file) => {
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from("projects")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("projects").getPublicUrl(fileName);

        return {
          file,
          url: publicUrl,
          isCover: false,
          isNew: true,
        } as UploadedImage;
      });

      const uploadedNewImages = await Promise.all(uploadPromises);
      setNewImages((prev) => [...prev, ...uploadedNewImages]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في رفع الصور");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveExistingImage = async (image: ProjectImage) => {
    if (!confirm("هل أنت متأكد من حذف هذه الصورة؟")) return;

    try {
      if (image.id) {
        const { error } = await supabase
          .from("project_images")
          .delete()
          .eq("id", image.id);
        if (error) throw error;
      }

      const filePath = image.image_url.split("/").pop();
      if (filePath) {
        await supabase.storage.from("projects").remove([filePath]);
      }

      setExistingImages((prev) =>
        prev.filter((img) => img.image_url !== image.image_url),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في حذف الصورة");
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSetCover = (imageUrl: string, isNew: boolean) => {
    if (isNew) {
      setExistingImages((prev) =>
        prev.map((img) => ({ ...img, is_cover: false })),
      );
      setNewImages((prev) =>
        prev.map((img) => ({ ...img, isCover: img.url === imageUrl })),
      );
    } else {
      setExistingImages((prev) =>
        prev.map((img) => ({ ...img, is_cover: img.image_url === imageUrl })),
      );
      setNewImages((prev) => prev.map((img) => ({ ...img, isCover: false })));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !location.trim() || !year.trim()) {
      setError("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    const allImages = [...existingImages, ...newImages];
    if (allImages.length === 0) {
      setError("يجب أن يحتوي المشروع على صورة واحدة على الأقل");
      return;
    }

    const hasCover =
      existingImages.some((img) => img.is_cover) ||
      newImages.some((img) => img.isCover);
    if (!hasCover) {
      setError("الرجاء اختيار صورة غلاف");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coverImage =
        existingImages.find((img) => img.is_cover)?.image_url ||
        newImages.find((img) => img.isCover)?.url ||
        project?.cover_image;

      const updateData: any = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        year: parseInt(year),
        scope_of_work: scopeOfWork.trim()
          ? scopeOfWork
              .trim()
              .split(/[\+,\u2022]/)
              .map((item) => item.trim())
              .filter((item) => item.length > 0)
          : [],
      };

      if (coverImage) {
        updateData.cover_image = coverImage;
      }

      const { error: updateError } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", projectId);

      if (updateError)
        throw new Error(updateError.message || "Failed to update project");

      // Add new images to database
      if (newImages.length > 0) {
        const imageRecords = newImages.map((img) => ({
          project_id: projectId,
          image_url: img.url,
          is_cover: img.isCover,
        }));

        const { error: imagesError } = await supabase
          .from("project_images")
          .insert(imageRecords);

        if (imagesError) throw imagesError;
      }

      // Update existing images cover status
      const coverImageUrl = newImages.find((img) => img.isCover)?.url;
      if (coverImageUrl) {
        await supabase
          .from("project_images")
          .update({ is_cover: false })
          .eq("project_id", projectId)
          .neq("image_url", coverImageUrl);
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في تحديث المشروع");
    } finally {
      setLoading(false);
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
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

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              الصور الحالية
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {existingImages.map((image) => (
                <div key={image.image_url} className="relative group">
                  <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={image.image_url}
                      alt="Project image"
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover"
                    />
                  </div>

                  {image.is_cover && (
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      صورة الغلاف
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-reverse space-x-2">
                    {!image.is_cover && (
                      <button
                        type="button"
                        onClick={() => handleSetCover(image.image_url, false)}
                        className="p-2 bg-white rounded-full hover:bg-gray-100"
                        title="تعيين كصورة غلاف"
                      >
                        <span className="text-xs">📷</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(image)}
                      className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      title="حذف الصورة"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images Upload */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            إضافة صور جديدة
          </h2>

          <div className="mb-6">
            <label className="block">
              <input
                type="file"
                multiple
                accept="image/*"
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

          {newImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                الصور الجديدة ({newImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {newImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={`New uploaded ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                      />
                    </div>

                    {image.isCover && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        صورة الغلاف
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-reverse space-x-2">
                      {!image.isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(image.url, true)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100"
                          title="تعيين كصورة غلاف"
                        >
                          <span className="text-xs">📷</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImage(index)}
                        className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                        title="حذف الصورة"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
