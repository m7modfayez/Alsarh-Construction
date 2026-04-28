import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar } from "lucide-react";
import { ProjectCardProps } from "@/types";

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="group block">
      <article className="rounded-xl overflow-hidden bg-white border border-[#E2DDD6] shadow-sm hover:shadow-xl hover:border-[#7A1A24]/20 transition-all duration-300 hover:-translate-y-1">
        {/* Image container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[#EDEAE4]">
          {project.image ? (
            <Image
              src={project.image}
              alt={project.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#EDEAE4]">
              <svg
                className="w-12 h-12 text-[#6B6860]/30"
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

          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0C]/80 via-[#0F0E0C]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Hover CTA */}
          <div className="absolute bottom-0 right-0 left-0 p-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
            <span className="inline-flex items-center gap-1.5 text-white text-sm font-bold">
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
          <h3 className="font-black text-lg text-[#1A1A18] group-hover:text-[#7A1A24] transition-colors duration-300 mb-2 line-clamp-1">
            {project.title}
          </h3>

          {project.description && (
            <p className="text-sm text-[#6B6860] line-clamp-2 mb-4 leading-relaxed">
              {project.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-xs text-[#6B6860]">
            {project.location && (
              <span className="flex items-center gap-1.5">
                <MapPin size={12} className="text-[#7A1A24]" />
                {project.location}
              </span>
            )}
            {project.year && (
              <span className="flex items-center gap-1.5">
                <Calendar size={12} className="text-[#7A1A24]" />
                {project.year}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
