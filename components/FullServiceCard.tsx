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
        relative h-full flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1
        ${
          isHighlighted
            ? "bg-[#7A1A24] text-white shadow-2xl shadow-[#7A1A24]/30 ring-2 ring-[#C9A84C]/40"
            : "bg-white border border-[#E2DDD6] shadow-sm hover:shadow-xl hover:border-[#7A1A24]/30"
        }
      `}
    >
      {/* Highlighted badge */}
      {isHighlighted && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1 bg-[#C9A84C] text-[#1A1A18] text-xs font-bold rounded-full">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          الأكثر طلبًا
        </div>
      )}

      <div className="p-7 flex flex-col h-full">
        {/* Icon */}
        <div className={`text-4xl mb-5 ${isHighlighted ? "opacity-90" : ""}`}>
          {icon}
        </div>

        {/* Title */}
        <h3
          className={`text-xl font-black mb-2 ${isHighlighted ? "text-white" : "text-[#1A1A18]"}`}
        >
          {title}
        </h3>

        {/* Subtitle */}
        <p
          className={`text-sm leading-relaxed mb-5 ${isHighlighted ? "text-white/75" : "text-[#6B6860]"}`}
        >
          {subtitle}
        </p>

        {/* Divider */}
        <div
          className={`w-10 h-0.5 mb-5 rounded-full ${isHighlighted ? "bg-[#C9A84C]/60" : "bg-[#7A1A24]/30"}`}
        />

        {/* Feature list */}
        <ul className="space-y-2.5 mb-7 flex-1">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2.5 text-sm">
              <svg
                className={`w-4 h-4 mt-0.5 shrink-0 ${isHighlighted ? "text-[#C9A84C]" : "text-[#7A1A24]"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span
                className={isHighlighted ? "text-white/85" : "text-[#3A3A38]"}
              >
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
            inline-flex items-center justify-center gap-2 w-full py-3.5 px-5 rounded-xl font-bold text-sm transition-all duration-300
            ${
              isHighlighted
                ? "bg-white text-[#7A1A24] hover:bg-[#F4F1EC] hover:shadow-lg"
                : "bg-[#7A1A24] text-white hover:bg-[#5C1019] hover:shadow-lg hover:shadow-[#7A1A24]/25"
            }
          `}
        >
          {ctaText}
          <svg
            className="w-4 h-4 rtl:rotate-180"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </a>
      </div>
    </article>
  );
}
