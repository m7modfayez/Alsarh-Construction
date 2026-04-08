import { ServiceCardProps } from '@/types';

/**
 * Service Card Component
 * Displays individual service offering with icon, title, and description
 */
export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <article className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 border border-border">
      <div className="text-4xl mb-4" aria-label={service.title}>
        {service.icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-3">{service.title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {service.description}
      </p>
      <div className="mt-4 h-1 w-12 bg-primary rounded-full" aria-hidden="true"></div>
    </article>
  );
}
