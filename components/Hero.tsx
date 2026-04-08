'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ar } from '@/lib/ar-content';

/**
 * Hero Section Component
 * Displays a prominent hero banner with title, subtitle, and optional CTA button
 */
export default function Hero() {

  return (
    <section className="relative w-full h-80 sm:h-96 md:h-screen flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70 z-0" />
      
      {/* Background Image */}
      <Image
        src="/images/alsarhCover.jpg"
        alt="الصرح"
        fill
        className="absolute inset-0 object-cover z-10 opacity-50"
        priority
      />
      
      {/* Content */}
      <div className="relative mt-15 z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-balance leading-tight">
          {ar.heroTitle}
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto text-balance leading-relaxed">
          {ar.heroSubtitle}
        </p>
        <Link
          href="/projects"
          className="inline-block bg-accent text-accent-foreground px-8 py-3 rounded-lg hover:opacity-90 transition-opacity font-medium"
        >
          {ar.exploreWork}
        </Link>
      </div>
    </section>
  );
}
