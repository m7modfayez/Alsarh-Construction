import ProjectCard from "@/components/ProjectCard";
import Pagination from "@/components/Pagination";
import { getPaginatedProjects } from "@/lib/data-fetching";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "مشاريعنا | شركة الهندسة المعمارية",
  description:
    "استكشف أحدث مشاريعنا المعمارية والإنشائية، من التصميم إلى التنفيذ بأعلى معايير الجودة والاحترافية.",
};

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function ProjectsPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page ?? "1", 10);
  const { projects, totalCount, pageSize, totalPages } = await getPaginatedProjects(page);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header Section */}
      <section className="bg-[#1A1A18] py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-px bg-[#C9A84C]" />
            <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#C9A84C]">
              أعمالنا
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
            مشاريعنا
          </h1>

          <p className="text-white/60 text-lg md:text-xl max-w-2xl leading-relaxed">
            استكشف أحدث إنجازاتنا المعمارية والمشاريع المكتملة التي تعكس الجودة،
            الإبداع، والدقة في التنفيذ.
          </p>
        </div>
      </section>

      {/* Projects Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {projects.length === 0 ? (
            <div className="text-center py-24">
              <h2 className="text-2xl font-bold text-[#1A1A18] mb-3">
                لا توجد مشاريع حالياً
              </h2>
              <p className="text-[#6B6860]">
                سيتم إضافة المشاريع الجديدة قريباً
              </p>
            </div>
          ) : (
            <>
              {/* Results Count */}
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-bold text-[#1A1A18]">
                  جميع المشاريع
                </h2>

                <span className="text-sm text-[#6B6860] font-medium">
                  {totalCount} مشروع
                </span>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-16">
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    baseUrl="/projects"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
