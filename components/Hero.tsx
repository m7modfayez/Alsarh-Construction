'use client';

import Image from 'next/image';
import { ar } from '@/lib/ar-content';

/**
 * Hero Section Component - Clean & Minimal
 * Production-ready hero with single background, overlay, and content
 */
export default function Hero() {
  return (
    <section className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden">
      
      {/* Desktop Background Image - Visible on screens >= 768px */}
      <div className="hidden md:block absolute inset-0">
        <Image
          src="/images/heroBgDesktop.png"
          alt="Al-Sarh Construction"
          fill
          className="object-cover opacity-50 object-center"
          priority
          sizes="100vw"
          quality={95}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          style={{ objectPosition: 'center center' }}
        />
      </div>

      {/* Mobile Background Image - Visible on screens < 768px */}
      <div className="md:hidden absolute inset-0">
        <Image
          src="/images/heroBgMob.png"
          alt="Al-Sarh Construction"
          fill
          className="object-cover opacity-50 object-center"
          priority
          sizes="100vw"
          quality={95}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          style={{ objectPosition: 'center center' }}
        />
      </div>
      
      {/* Improved Dark Overlay for Better Text Contrast */}
      <div 
        className="absolute inset-0"
        style={{ 
          background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.7) 100%)'
        }}
      />
      
      {/* Content Container */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
          {ar.heroTitle}
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto mb-8 leading-relaxed">
          {ar.heroSubtitle}
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          
          {/* Primary CTA - WhatsApp */}
          <a
            href={`https://wa.me/201044088731?text=${encodeURIComponent(ar.heroCtaPrimaryMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
          >
            {ar.heroCtaPrimary}
          </a>
          
          {/* Secondary CTA - View Projects */}
          <a
            href="/projects#projects"
            className="inline-flex items-center justify-center px-8 py-3 border-2 border-white/30 hover:border-white text-white font-bold rounded-lg transition-all duration-300 hover:bg-white/10 whitespace-nowrap"
          >
            {ar.heroCtaSecondary}
          </a>
          
        </div>
        
      </div>
    </section>
  );
}

