import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Calendar, ArrowRight, MessageCircle } from 'lucide-react';
import ProjectGallery from '@/components/ProjectGallery';
import ProjectCard from '@/components/ProjectCard';
import { projects } from '@/data';

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
    .filter((p) => p.id !== project.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Project Details */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-20 mb-24">
            {/* Description */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">نظرة عامة على المشروع</h2>
                <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                  {project.description}
                </p>
              </div>

              <div className="bg-secondary/50 rounded-xl p-6 md:p-8">
                <h3 className="font-bold text-foreground mb-4 text-xl">أبرز ما في المشروع</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    <p className="text-muted-foreground">تصميم معماري وتخطيط متقدم</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    <p className="text-muted-foreground">ممارسات بناء مستدامة</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    <p className="text-muted-foreground">تقنيات بناء متقدمة</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    <p className="text-muted-foreground">تسليم في الموعد المحدد</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Info Sidebar */}
            <div className="bg-gradient-to-br from-secondary/50 to-secondary rounded-2xl p-6 md:p-8 shadow-lg">
              <h3 className="text-xl font-bold text-foreground mb-6">تفاصيل المشروع</h3>
              <div className="space-y-6">
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">اسم المشروع</p>
                  <p className="font-bold text-foreground text-lg">{project.title}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">الموقع</p>
                  <p className="font-bold text-foreground text-lg">{project.location}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">سنة الإنجاز</p>
                  <p className="font-bold text-foreground text-lg">{project.year}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Gallery Section */}
          <div className="mb-20">
            <div className="mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">معرض صور المشروع</h2>
              <p className="text-muted-foreground text-lg">استكشف جمال وتفاصيل المشروع من خلال معرض الصور</p>
            </div>
            <ProjectGallery images={project.gallery} title={project.title} />
          </div>
        </div>
      </section>

       {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">اسأل عن هذا المشروع</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            تواصل معنا اليوم واحصل على استشارة مجانية لمشروعك القادم
          </p>
          <a
            href={`https://wa.me/201044088731?text=${encodeURIComponent(`السلام عليكم، أنا مهتم بمشروع ${project.title} وحابب أعرف تفاصيل أكتر وإمكانية تنفيذ مشروع مشابه.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            اسأل عن هذا المشروع
          </a>
        </div>
      </section>
      
      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="py-12 md:py-20 bg-secondary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">مشاريع أخرى</h2>
              <p className="text-muted-foreground text-lg">استكشف المزيد من مشاريعنا المتميزة</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {relatedProjects.map((relatedProject) => (
                <ProjectCard key={relatedProject.id} project={relatedProject} />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/projects"
                className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors duration-300 shadow-md hover:shadow-lg"
              >
                عرض جميع المشاريع
                <ArrowRight className="w-5 h-5 mr-2" />
              </Link>
            </div>
          </div>
        </section>
      )}

     
    </div>
  );
}
