import Link from 'next/link';
import { MapPin, Calendar } from 'lucide-react';
import ProjectGallery from '@/components/ProjectGallery';
import ProjectCard from '@/components/ProjectCard';
import { projects } from '@/data';

const CATEGORY_LABELS: Record<string, string> = {
  residential: 'سكني',
  commercial: 'تجاري',
  industrial: 'صناعي',
  government: 'حكومي',
};

interface ProjectDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Project Detail Page
 * Displays detailed information about a specific project
 */
export async function generateStaticParams() {
  return projects.map((project) => ({
    id: project.id,
  }));
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { id } = await params;
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">المشروع غير موجود</h1>
          <p className="text-muted-foreground mb-8">
            المشروع الذي تبحث عنه غير موجود.
          </p>
          <Link
            href="/projects"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            العودة إلى المشاريع
          </Link>
        </div>
      </div>
    );
  }

  const relatedProjects = projects
    .filter((p) => p.category === project.category && p.id !== project.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Hero Section with Main Image */}
      <div className="relative w-full h-96 md:h-[500px] overflow-hidden">
        <img
          src={project.image}
          alt={project.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-6 text-white">
              <div className="flex items-center gap-2">
                <MapPin size={20} />
                <span>{project.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={20} />
                <span>{project.year}</span>
              </div>
              <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full font-medium">
                {CATEGORY_LABELS[project.category]}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Project Details */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
            {/* Description */}
            <div className="lg:col-span-2">
              <h2 className="text-3xl font-bold text-foreground mb-6">نظرة عامة على المشروع</h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {project.description}
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-foreground mb-3 text-lg">أبرز المشروع</h3>
                  <ul className="list-disc list-inside text-muted-foreground space-y-2">
                    <li>تصميم معماري وتخطيط متقدم</li>
                    <li>ممارسات بناء مستدامة وطرق بناء صديقة للبيئة</li>
                    <li>تقنيات بناء متقدمة وتكامل الأنظمة</li>
                    <li>تم التسليم في الموعد المحدد وضمن الميزانية</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Project Info Sidebar */}
            <div className="bg-secondary rounded-lg p-8">
              <h3 className="text-xl font-bold text-foreground mb-6">تفاصيل المشروع</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">اسم المشروع</p>
                  <p className="font-bold text-foreground">{project.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الفئة</p>
                  <p className="font-bold text-foreground">
                    {CATEGORY_LABELS[project.category]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الموقع</p>
                  <p className="font-bold text-foreground">{project.location}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">سنة الإنجاز</p>
                  <p className="font-bold text-foreground">{project.year}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-8">معرض صور المشروع</h2>
            <ProjectGallery images={project.gallery} title={project.title} />
          </div>
        </div>
      </section>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="py-16 md:py-24 bg-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-foreground mb-12">المشاريع ذات الصلة</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedProjects.map((relatedProject) => (
                <ProjectCard key={relatedProject.id} project={relatedProject} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-6">هل أنت مستعد لبدء مشروعك؟</h2>
          <p className="text-lg text-muted-foreground mb-8">
            اتصل بفريقنا اليوم لمناقشة احتياجاتك المعمارية والبناء.
          </p>
          <Link
            href="/#contact"
            className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            تواصل معنا
          </Link>
        </div>
      </section>
    </div>
  );
}
