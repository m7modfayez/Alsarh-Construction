import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar } from "lucide-react";
import { ProjectCardProps } from "@/types";

interface Props extends ProjectCardProps {
  priority?: boolean;
}

// ✅ FIX: Map category values to human-readable Arabic labels
// instead of the hardcoded "تشطيبات فاخرة" that was always displayed regardless of category
const CATEGORY_LABELS: Record<string, string> = {
  residential: "سكني",
  commercial: "تجاري",
  industrial: "صناعي",
  government: "حكومي",
};

// A small base64-encoded placeholder image (1×1 grey pixel, JPEG)
// Used as blur placeholder while the real image loads — dramatically improves
// perceived performance for below-the-fold cards.
const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAwDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAIhAAAQQCAgMBAAAAAAAAAAAAAQIDBAUREiExBhP/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Amk2na7hbKW3Wqimp6iSQRiOdpADy7GBjn2zn7VLXWi3C3VElHX0c9NUxHD4po3Me0+xBGQqKRERERB//2Q==";

export default function ProjectCard({ project, priority = false }: Props) {
  const categoryLabel =
    CATEGORY_LABELS[project.category] ?? "مشروع";

  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <article
        className={`relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 ${
          project.is_featured
            ? "border border-amber-200 ring-1 ring-amber-100"
            : "border border-[#e7e5e4]"
        }`}
      >
        {/* Image container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#f5f5f4]">
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              priority={priority}
              quality={80}
              // ✅ FIX: Added blur placeholder — shows a blurred preview instead of
              // a blank grey box while the real image loads
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              // ✅ FIX: Added will-change-transform — promotes image to its own
              // compositor layer before hover begins, preventing jank during scroll
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out will-change-transform"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#f5f5f4]">
              <svg
                className="w-12 h-12 text-[#a8a29e]/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M3 7h18M3 12h18M3 17h12"
                />
              </svg>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09]/80 via-[#0c0a09]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          {/* ✅ FIX: Category tag now uses actual project category, not a hardcoded string */}
          <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-medium text-[#0c0a09] opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-y-0 translate-y-2">
            {categoryLabel}
          </div>

          {project.is_featured && (
            <div className="absolute top-4 left-4 rounded-full border border-amber-200 bg-amber-50/95 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur-sm">
              مميز
            </div>
          )}

          {/* Hover CTA */}
          <div className="absolute bottom-0 right-0 left-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <span className="inline-flex items-center gap-2 text-white text-sm font-medium">
              عرض المشروع
              <svg
                className="w-4 h-4 rtl:rotate-180"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-lg text-[#0c0a09] group-hover:text-[#d97706] transition-colors duration-300 mb-2 line-clamp-1">
            {project.title}
          </h3>

          {project.description && (
            <p className="text-sm text-[#78716c] line-clamp-2 mb-4 leading-relaxed">
              {project.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-[#a8a29e]">
            {project.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-[#d97706]" />
                <span className="max-w-[120px] truncate">{project.location}</span>
              </span>
            )}
            {project.year && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-[#d97706]" />
                {project.year}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
