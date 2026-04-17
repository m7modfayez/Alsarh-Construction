import ProjectCard from '@/components/ProjectCard';
import { projects } from '@/data';

/**
 * Projects Page
 * Displays all projects in a unified grid
 */
export default function ProjectsPage() {

  return (
    <div className="min-h-screen">
      {/* Projects Section */}
      <section id="projects" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              المشاريع
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              استكشف أحدث إنجازاتنا المعمارية والمشاريع المكتملة
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}
