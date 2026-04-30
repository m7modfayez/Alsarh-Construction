"use client";

interface FullServiceCardProps {
  icon: string;
  title: string;
  subtitle: string;
  includesList: string;
  ctaText: string;
  message: string;
  isHighlighted?: boolean;
}

const icons = {
  "🏗️": (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 42V24L24 6L42 24V42H30V30H18V42H6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 42V30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M30 42V30" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M24 18V26" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  "🎨": (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" strokeWidth="2"/>
      <path d="M8 16H40" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 16V36" stroke="currentColor" strokeWidth="2"/>
      <circle cx="28" cy="28" r="6" stroke="currentColor" strokeWidth="2"/>
      <path d="M25 28L27.5 30.5L32 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  "✨": (
    <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 4L28 18H42L30 28L34 42L24 34L14 42L18 28L6 18H20L24 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38 8L42 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M36 12L38 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

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

  const items = includesList
    .split(/\s*[•\u2022]\s*/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <article
      className={`
        relative h-full flex flex-col rounded-2xl overflow-hidden transition-all duration-500 group
        ${
          isHighlighted
            ? "bg-[#0f172a] text-white"
            : "bg-white border border-[#e7e5e4]"
        }
      `}
    >
      {/* Background pattern - subtle grid */}
      <div className={`absolute inset-0 opacity-[0.03] ${isHighlighted ? '' : 'bg-[#0c0a09]'}`}>
        <div className="w-full h-full" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}/>
      </div>

      {/* Corner accent */}
      <div className={`absolute top-0 right-0 w-20 h-20 transition-transform duration-500 group-hover:scale-110 ${isHighlighted ? 'bg-[#d97706]/10' : 'bg-[#d97706]/5'}`}>
        <div className={`absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 ${isHighlighted ? 'border-[#d97706]/30' : 'border-[#d97706]/20'} rounded-tr-lg`} />
      </div>

      <div className="relative p-8 flex flex-col h-full z-10">
        {/* Icon with circular background */}
        <div className={`
          w-16 h-16 rounded-2xl flex items-center justify-center mb-6
          ${isHighlighted ? 'bg-[#d97706]/20 text-[#d97706]' : 'bg-[#f5f5f4] text-[#0f172a]'}
        `}>
          {icons[icon as keyof typeof icons] || <span className="text-3xl">{icon}</span>}
        </div>

        {/* Title with accent line */}
        <div className="mb-3">
          <h3 className={`text-2xl font-bold mb-3 ${isHighlighted ? "text-white" : "text-[#0c0a09]"}`}>
            {title}
          </h3>
          <div className={`w-12 h-1 rounded-full ${isHighlighted ? 'bg-[#d97706]' : 'bg-[#d97706]/40'}`} />
        </div>

        {/* Subtitle */}
        <p className={`text-base leading-relaxed mb-6 ${isHighlighted ? "text-white/60" : "text-[#78716c]"}`}>
          {subtitle}
        </p>

        {/* Feature list with custom styling */}
        <ul className="space-y-4 mb-8 flex-1">
          {items.slice(0, 4).map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center mt-0.5 shrink-0
                ${isHighlighted ? 'bg-[#d97706]/20' : 'bg-[#f5f5f4]'}
              `}>
                <svg
                  className={`w-3 h-3 ${isHighlighted ? "text-[#d97706]" : "text-[#d97706]"}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`text-sm leading-relaxed ${isHighlighted ? "text-white/80" : "text-[#57534e]"}`}>
                {item}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            group/btn inline-flex items-center justify-center gap-3 w-full py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300
            ${isHighlighted
              ? "bg-[#d97706] text-white hover:bg-[#b45309] hover:shadow-xl hover:shadow-[#d97706]/20"
              : "bg-[#0f172a] text-white hover:bg-[#1e293b] hover:shadow-xl"
            }
          `}
        >
          <span>{ctaText}</span>
          <svg
            className="w-4 h-4 rtl:rotate-180 transition-transform duration-300 group-hover/btn:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>

      {/* Bottom corner accent */}
      <div className={`absolute bottom-0 left-0 w-16 h-16 ${isHighlighted ? 'bg-[#d97706]/5' : 'bg-[#f5f5f4]'}`}>
        <div className={`absolute bottom-4 left-4 w-6 h-6 border-l-2 border-b-2 ${isHighlighted ? 'border-[#d97706]/20' : 'border-[#e7e5e4]'} rounded-bl-lg`} />
      </div>
    </article>
  );
}