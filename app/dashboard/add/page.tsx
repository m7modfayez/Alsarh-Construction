"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "@/components/ResilientImage";
import { Upload, X, ArrowLeft, Save, ArrowUp, ArrowDown } from "lucide-react";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/project-image-validation";

interface UploadedImage {
  file: File;
  previewUrl: string;
  isCover: boolean;
}

export default function AddProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const submittingRef = useRef(false);
  const projectIdRef = useRef<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError(null);
    const unsupported = files.find((file) => !ALLOWED_IMAGE_MIME_TYPES.has(file.type));
    if (unsupported) {
      setError("نوع الصورة غير مدعوم. استخدم JPEG أو PNG أو WebP أو AVIF.");
      e.target.value = "";
      return;
    }
    const tooLarge = files.find((file) => file.size === 0 || file.size > 10 * 1024 * 1024);
    if (tooLarge) {
      setError("يجب ألا يتجاوز حجم الصورة الواحدة 10 ميجابايت.");
      e.target.value = "";
      return;
    }
    if (uploadedImages.length + files.length > 20 ||
        uploadedImages.reduce((sum, image) => sum + image.file.size, 0) + files.reduce((sum, file) => sum + file.size, 0) > 30 * 1024 * 1024) {
      setError("الحد الأقصى 20 صورة وإجمالي 30 ميجابايت للمشروع.");
      e.target.value = "";
      return;
    }

    const shouldSetFirstCover = uploadedImages.length === 0;
    const drafts = files.map((file, index) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      isCover: shouldSetFirstCover && index === 0,
    }));
    setUploadedImages((prev) => [...prev, ...drafts]);
    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    const removedPreview = uploadedImages[index]?.previewUrl;
    if (removedPreview) URL.revokeObjectURL(removedPreview);
    setUploadedImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      // If removing cover image, make first remaining image the cover
      if (prev[index].isCover && newImages.length > 0) {
        newImages[0] = { ...newImages[0], isCover: true };
      }
      return newImages;
    });
  };

  const handleMoveImage = (index: number, offset: number) => {
    setUploadedImages((prev) => {
      const target = index + offset;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSetCover = (index: number) => {
    setUploadedImages((prev) =>
      prev.map((img, i) => ({ ...img, isCover: i === index })),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;

    if (!title.trim() || !location.trim() || !year.trim()) {
      setError("الرجاء ملء جميع الحقول المطلوبة");
      return;
    }

    if (uploadedImages.length === 0) {
      setError("الرجاء رفع صورة واحدة على الأقل");
      return;
    }

    const coverImage = uploadedImages.find((img) => img.isCover);
    if (!coverImage) {
      setError("الرجاء اختيار صورة غلاف");
      return;
    }

    setLoading(true);
    submittingRef.current = true;
    setError(null);

    try {
      projectIdRef.current ??= crypto.randomUUID();
      const formData = new FormData();
      formData.set("projectId", projectIdRef.current);
      formData.set("project", JSON.stringify({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        year: Number(year),
        is_featured: isFeatured,
        scope_of_work: scopeOfWork.trim()
          ? scopeOfWork.trim().split(/[\+,\u2022]/).map((item) => item.trim()).filter(Boolean)
          : [],
      }));
      formData.set("expectedUpdatedAt", "");
      formData.set("images", JSON.stringify(uploadedImages.map((img, index) => ({
        fileIndex: index,
        is_cover: img.isCover,
        image_order: index,
      }))));
      uploadedImages.forEach(({ file }) => formData.append("files", file, file.name));

      const response = await fetch("/api/admin/projects", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "فشل في حفظ المشروع");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في حفظ المشروع");
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">إضافة مشروع جديد</h1>
        <p className="text-gray-600 mt-1">أدخل تفاصيل المشروع الجديد</p>
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

        {/* Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">الصور</h2>

          {/* Upload Button */}
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

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                الصور المرفوعة ({uploadedImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={image.previewUrl}
                        alt={`Uploaded ${index + 1}`}
                        fill
                        unoptimized
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover"
                      />
                    </div>

                    {/* Cover Badge */}
                    {image.isCover && (
                      <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        صورة الغلاف
                      </div>
                    )}

                    {/* Actions */}
                    <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-reverse space-x-2">
                      {!image.isCover && (
                        <button
                          type="button"
                          onClick={() => handleSetCover(index)}
                          className="p-2 bg-white rounded-full hover:bg-gray-100"
                          title="تعيين كصورة غلاف"
                        >
                          <span className="text-xs">📷</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, -1)}
                        disabled={index === 0 || loading}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 disabled:opacity-40"
                        title="تحريك الصورة للأعلى"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveImage(index, 1)}
                        disabled={index === uploadedImages.length - 1 || loading}
                        className="p-2 bg-white rounded-full hover:bg-gray-100 disabled:opacity-40"
                        title="تحريك الصورة للأسفل"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
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

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="ml-2 h-4 w-4" />
                حفظ المشروع
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
