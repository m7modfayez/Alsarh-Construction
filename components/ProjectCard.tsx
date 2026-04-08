import Link from 'next/link';
import Image from 'next/image';
import { ProjectCardProps } from '@/types';

/**
 * Project Card Component
 * Displays project preview with image, title, category, and description
 */
const CATEGORY_LABELS: Record<string, string> = {
  residential: 'سكني',
  commercial: 'تجاري',
  industrial: 'صناعي',
  government: 'حكومي',
};

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <article className="group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
        <div className="relative h-64 overflow-hidden bg-muted">
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        </div>
        <div className="p-4 bg-white">
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors mb-2">
            {project.title}
          </h3>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-medium bg-accent/10 text-accent px-3 py-1 rounded-full">
              {CATEGORY_LABELS[project.category]}
            </span>
            <span className="text-sm text-muted-foreground">{project.year}</span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
        </div>
      </article>
    </Link>
  );
}
