'use client';

/**
 * Full Service Card Component
 * Conversion-focused service card with simplified content and strong CTAs
 * Features: Clean design, minimal text, action-driven, responsive layout
 */
interface FullServiceCardProps {
  icon: string;
  title: string;
  subtitle: string;
  includesList: string;
  ctaText: string;
  message: string;
  isHighlighted?: boolean;
}

export default function FullServiceCard({
  icon,
  title,
  subtitle,
  includesList,
  ctaText,
  message,
  isHighlighted = false,
}: FullServiceCardProps) {
  const encodedMessage = encodeURIComponent(message);
  const whatsappLink = `https://wa.me/201044088731?text=${encodedMessage}`;

  return (
    <article className={`
      h-full bg-white rounded-xl p-5 sm:p-6 border shadow-sm
      ${isHighlighted ? 'ring-2 ring-primary/20 border-primary/30' : 'border-border'}
    `}>
      {/* Icon */}
      <div className="text-4xl sm:text-5xl mb-3">
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
        {title}
      </h3>

      {/* Subtitle */}
      <p className="text-gray-600 leading-relaxed mb-4 line-clamp-2">{subtitle}</p>

      {/* Bullet Points */}
      <div className="mb-6 space-y-2">
        <ul className="space-y-2">
          {includesList.split(' \u2022 ').map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-primary mr-2">-</span>
              <span className="text-sm text-gray-600">{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <a 
        href={whatsappLink} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="group inline-flex items-center justify-center w-full bg-primary text-primary-foreground font-bold py-3 px-4 rounded-lg hover:bg-primary/90 transition-all duration-300 text-center"
      >
        {ctaText}
        <svg
          className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform duration-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </a>
    </article>
  );
}
