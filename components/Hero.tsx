"use client";

import Image from "next/image";
import { ar } from "@/lib/ar-content";
import { useState, useEffect } from "react";

export default function Hero() {
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const bgImage = isMobile ? "/images/heroBgMob.png" : "/images/heroBgDesktop.png";
  const whatsappHref = `https://wa.me/201066397098?text=${encodeURIComponent(ar.heroCtaPrimaryMessage)}`;

  return (
    <section className="relative w-full h-screen min-h-[700px] flex items-center overflow-hidden bg-[#0c0a09]">
      {/* Background Image */}
      <div className="absolute inset-0">
        {mounted && (
          <Image
            src={bgImage}
            alt="الصرح للإنشاءات"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
            quality={85}
          />
        )}
        {/* Sophisticated overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0c0a09]/90 via-[#0c0a09]/70 to-[#0c0a09]/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-transparent to-transparent" />
      </div>

      {/* Geometric accent - diagonal line */}
      <div className="absolute top-0 right-0 w-1/2 h-full overflow-hidden hidden lg:block">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-l from-white/[0.02] to-transparent transform skew-x-12" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 py-32">
        <div className="max-w-3xl">
       
          {/* Headline - more refined */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.15] mb-6 tracking-tight animate-fade-in-up">
            {ar.heroTitle}
            <span className="block text-[#d97706] mt-2">بجودة لا تُضاهى</span>
          </h1>

          {/* Subtitle - more refined spacing */}
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mb-10 leading-relaxed animate-fade-in-up delay-200">
            {ar.heroSubtitle}
          </p>

          {/* Service pills - cleaner design */}
          <div className="flex flex-wrap gap-3 mb-10 animate-fade-in-up delay-300">
            {[
              { icon: "🏗️", label: "البناء" },
              { icon: "🎨", label: "التشطيب الكامل" },
              { icon: "🔑", label: "من الأرض لتسليم المفتاح" },
            ].map((s) => (
              <span
                key={s.label}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.08] text-white/70 text-sm rounded-lg backdrop-blur-sm hover:bg-white/[0.06] transition-colors"
              >
                <span>{s.icon}</span>
                <span className="font-medium">{s.label}</span>
              </span>
            ))}
          </div>

          {/* CTA Buttons - refined */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-400">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#d97706] hover:bg-[#b45309] text-white font-semibold text-base rounded-xl transition-all duration-300 hover:shadow-xl hover:shadow-[#d97706]/20 hover:-translate-y-0.5"
            >
              <svg
                className="w-5 h-5 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.52 3.44C18.9 1.86 16.76 1 14.36 1 7.65 1 2.20 6.5 2.20 13.21c0 2.01.55 3.98 1.58 5.71L2 23l6.3-1.61c1.65.9 3.52 1.38 5.41 1.38 6.71 0 12.15-5.45 12.15-12.15 0-3.24-1.31-6.3-3.74-8.58z" />
              </svg>
              {ar.heroCtaPrimary}
            </a>
            <a
              href="/projects"
              className="inline-flex items-center justify-center px-8 py-4 bg-white/[0.05] border border-white/20 hover:border-white/40 text-white font-semibold text-base rounded-xl transition-all duration-300 hover:bg-white/[0.1]"
            >
              {ar.heroCtaSecondary}
            </a>
          </div>
        </div>
      </div>

      {/* Bottom indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
        <span className="text-xs text-white/30 font-medium"> scroll</span>
        <div className="w-5 h-8 border border-white/20 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/40 rounded-full animate-pulse" />
        </div>
      </div>
    </section>
  );
}