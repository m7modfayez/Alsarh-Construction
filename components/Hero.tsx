"use client";

import Image from "next/image";
import { ar } from "@/lib/ar-content";

export default function Hero() {
  const whatsappHref = `https://wa.me/201044088731?text=${encodeURIComponent(ar.heroCtaPrimaryMessage)}`;

  return (
    <section className="relative w-full min-h-[92vh] flex items-end overflow-hidden bg-[#0F0E0C]">
      {/* Desktop Background */}
      <div className="hidden md:block absolute inset-0">
        <Image
          src="/images/heroBgDesktop.png"
          alt="الصرح للإنشاءات"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={90}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k="
        />
      </div>

      {/* Mobile Background */}
      <div className="md:hidden absolute inset-0">
        <Image
          src="/images/heroBgMob.png"
          alt="الصرح للإنشاءات"
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
          quality={90}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AJQAB/9k="
        />
      </div>

      {/* Layered gradient for dramatic effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E0C] via-[#0F0E0C]/60 to-[#0F0E0C]/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F0E0C]/70 via-transparent to-transparent" />

      {/* Decorative vertical line */}
      <div className="absolute right-12 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-[#C9A84C]/40 to-transparent hidden lg:block" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-32">
        <div className="max-w-3xl">
          {/* Eyebrow label */}
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <div className="w-8 h-px bg-[#C9A84C]" />
            <span className="text-[#C9A84C] text-xs font-semibold tracking-[0.2em] uppercase">
              شركة الصرح للإنشاءات
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-[1.1] mb-6 animate-fade-in-up">
            {ar.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mb-10 leading-relaxed animate-fade-in-up delay-200">
            {ar.heroSubtitle}
          </p>

          {/* Service pills */}
          <div className="flex flex-wrap gap-2 mb-10 animate-fade-in-up delay-300">
            {["البناء من الصفر", "التشطيب الكامل", "تنفيذ متكامل"].map((s) => (
              <span
                key={s}
                className="px-4 py-1.5 border border-white/20 text-white/80 text-sm rounded-full backdrop-blur-sm bg-white/5"
              >
                {s}
              </span>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up delay-400">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#7A1A24] hover:bg-[#5C1019] text-white font-bold text-base rounded-xl transition-all duration-300 hover:shadow-2xl hover:shadow-[#7A1A24]/40 hover:-translate-y-0.5"
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
              className="inline-flex items-center justify-center px-8 py-4 border border-white/30 hover:border-white/60 text-white font-bold text-base rounded-xl transition-all duration-300 hover:bg-white/10 backdrop-blur-sm"
            >
              {ar.heroCtaSecondary}
            </a>
          </div>
        </div>
      </div>

      {/* Bottom stats bar */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 backdrop-blur-sm bg-[#0F0E0C]/60 hidden md:block">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center divide-x divide-white/10 rtl:divide-x-reverse">
            {[
              { num: "+100", label: "مشروع منجز" },
              { num: "+50", label: "عميل راضٍ" },
              { num: "+10", label: "سنوات خبرة" },
            ].map(({ num, label }) => (
              <div key={label} className="flex-1 py-5 px-8 text-center">
                <div className="text-2xl font-black text-white">{num}</div>
                <div className="text-xs text-white/50 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
