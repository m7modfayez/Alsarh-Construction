import Link from 'next/link';
import Image from 'next/image';
import { ProjectCardProps } from '@/types';

/**
 * Project Card Component
 * Displays project preview with image, title, and optional description
 */
export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`}>
      <article className="group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white">
        <div className="relative h-64 md:h-72 overflow-hidden bg-muted">
          <Image
            src={project.image}
            alt={project.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <h3 className="font-bold text-lg md:text-xl mb-1">{project.title}</h3>
              {project.description && (
                <p className="text-sm text-white/90 line-clamp-2">{project.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
            {project.title}
          </h3>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {project.description}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
