import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, ArrowRight, MessageCircle } from "lucide-react";

import ProjectCard from "@/components/ProjectCard";
import ProjectGallery from "@/components/ProjectGallery";
import { getProject, getRelatedProjects } from "@/lib/data-fetching";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;

  const project = await getProject(id);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8] text-center px-4">
        <div>
          <h1 className="text-3xl font-black text-[#1A1A18] mb-3">
            المشروع غير موجود
          </h1>
          <p className="text-[#6B6860] mb-8">
            المشروع الذي تبحث عنه غير موجود.
          </p>
          <Link
            href="/projects"
            className="inline-block px-7 py-3.5 bg-[#7A1A24] text-white font-bold rounded-xl hover:bg-[#5C1019] transition-colors"
          >
            العودة إلى المشاريع
          </Link>
        </div>
      </div>
    );
  }

  const relatedProjects = await getRelatedProjects(id);

  const galleryImages = [
    ...(project.image ? [project.image] : []),
    ...(project.gallery?.filter(Boolean) ?? []),
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Hero */}
      {project.image && (
        <section className="relative h-[50vh] md:h-[65vh] bg-[#1A1A18] overflow-hidden">
          <Image
            src={project.image}
            alt={project.title}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A18] via-[#1A1A18]/30 to-transparent" />

          {/* Back Button */}
          <div className="absolute top-6 inset-x-0 px-4 sm:px-8">
            <div className="max-w-7xl mx-auto">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
              >
                <ArrowRight size={14} />
                العودة إلى المشاريع
              </Link>
            </div>
          </div>

          {/* Title */}
          <div className="absolute bottom-0 inset-x-0 px-4 sm:px-8 pb-10">
            <div className="max-w-7xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-black text-white mb-4">
                {project.title}
              </h1>

              <div className="flex flex-wrap items-center gap-5 text-white/70 text-sm">
                {project.location && (
                  <span className="flex items-center gap-2">
                    <MapPin size={15} />
                    {project.location}
                  </span>
                )}
                {project.year && (
                  <span className="flex items-center gap-2">
                    <Calendar size={15} />
                    {project.year}
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Main Content */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Description */}
            <div className="lg:col-span-2">
              {!project.image && (
                <h1 className="text-3xl font-black text-[#1A1A18] mb-6">
                  {project.title}
                </h1>
              )}

              {project.description && (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-8 h-px bg-[#7A1A24]" />
                    <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#7A1A24]">
                      نبذة عن المشروع
                    </span>
                  </div>
                  <p className="text-[#6B6860] leading-loose text-lg">
                    {project.description}
                  </p>
                </>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="sticky top-8 bg-white rounded-2xl border border-[#E2DDD6] shadow-sm overflow-hidden">
                <div className="bg-[#7A1A24] px-6 py-4">
                  <h3 className="text-white font-bold">تفاصيل المشروع</h3>
                </div>

                <div className="p-6 space-y-4">
                  {project.location && (
                    <InfoRow label="الموقع" value={project.location} />
                  )}
                  {project.year && (
                    <InfoRow label="السنة" value={project.year.toString()} />
                  )}
                  {project.scope_of_work &&
                    project.scope_of_work.length > 0 && (
                      <div className="pt-2">
                        <p className="text-xs text-[#6B6860] font-semibold uppercase tracking-wide mb-3">
                          نوع العمل
                        </p>
                        <ul className="space-y-2">
                          {project.scope_of_work.map((item, index) => (
                            <li
                              key={index}
                              className="flex items-start gap-2 text-sm text-[#3A3A38]"
                            >
                              <span className="text-[#7A1A24] mt-0.5">•</span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                <div className="px-6 pb-6">
                  <a
                    href={`https://wa.me/201044088731?text=${encodeURIComponent(
                      `السلام عليكم، أنا مهتم بمشروع ${project.title} وأرغب في معرفة المزيد من التفاصيل.`,
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-[#7A1A24] text-white font-bold rounded-xl hover:bg-[#5C1019] transition-colors text-sm"
                  >
                    <MessageCircle size={16} />
                    استفسر عن المشروع
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery — now uses ProjectGallery with click-to-open lightbox + arrow keys */}
          {galleryImages.length > 0 && (
            <section className="mt-24">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-px bg-[#7A1A24]" />
                <h2 className="text-2xl font-black text-[#1A1A18]">
                  معرض صور المشروع
                </h2>
                <span className="text-sm text-[#6B6860] mr-2">
                  ({galleryImages.length} صورة — اضغط على أي صورة لعرضها بالحجم
                  الكامل)
                </span>
              </div>

              <ProjectGallery images={galleryImages} title={project.title} />
            </section>
          )}
        </div>
      </section>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="bg-[#F4F1EC] py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-8 h-px bg-[#7A1A24]" />
              <h2 className="text-2xl font-black text-[#1A1A18]">
                مشاريع أخرى
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProjects.map((item) => (
                <ProjectCard key={item.id} project={item} />
              ))}
            </div>

            <div className="text-center mt-10">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-[#7A1A24] text-[#7A1A24] font-bold rounded-xl hover:bg-[#7A1A24] hover:text-white transition-all duration-300"
              >
                عرض جميع المشاريع
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#E2DDD6] last:border-0">
      <span className="text-xs text-[#6B6860] font-semibold uppercase tracking-wide">
        {label}
      </span>
      <span className="font-bold text-[#1A1A18] text-sm">{value}</span>
    </div>
  );
}
