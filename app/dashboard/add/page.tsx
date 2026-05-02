"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Upload, X, ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface UploadedImage {
  file: File;
  url: string;
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
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const isFirstBatch = uploadedImages.length === 0;

      // ✅ FIX: Upload all files in PARALLEL using Promise.all instead of a sequential
      // for-loop. For 5 images the old code made 5 sequential round-trips (each waiting
      // for the previous to finish). Now all uploads run concurrently.
      const uploadPromises = files.map(async (file, index) => {
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
          // First image of the first batch becomes the cover by default
          isCover: isFirstBatch && index === 0,
        } as UploadedImage;
      });

      const newImages = await Promise.all(uploadPromises);
      setUploadedImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في رفع الصور");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setUploadedImages((prev) => {
      const newImages = prev.filter((_, i) => i !== index);
      // If removing cover image, make first remaining image the cover
      if (prev[index].isCover && newImages.length > 0) {
        newImages[0] = { ...newImages[0], isCover: true };
      }
      return newImages;
    });
  };

  const handleSetCover = (index: number) => {
    setUploadedImages((prev) =>
      prev.map((img, i) => ({ ...img, isCover: i === index })),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    setError(null);

    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          year: parseInt(year),
          cover_image: coverImage.url,
          scope_of_work: scopeOfWork.trim()
            ? scopeOfWork
                .trim()
                .split(/[\+,\u2022]/)
                .map((item) => item.trim())
                .filter((item) => item.length > 0)
            : [],
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Save all images to project_images table
      const imageRecords = uploadedImages.map((img) => ({
        project_id: project.id,
        image_url: img.url,
        is_cover: img.isCover,
      }));

      const { error: imagesError } = await supabase
        .from("project_images")
        .insert(imageRecords);

      if (imagesError) throw imagesError;

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل في حفظ المشروع");
    } finally {
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

        {/* Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">الصور</h2>

          {/* Upload Button */}
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
                        src={image.url}
                        alt={`Uploaded ${index + 1}`}
                        fill
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
