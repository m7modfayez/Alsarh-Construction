'use client';

import Image from 'next/image';
import { ar } from '@/lib/ar-content';

/**
 * Hero Section Component - Full-Service Showcase
 * Enhanced with dark overlay, animations, improved CTA, and responsive design
 * Features: Full-service messaging, three-pillar service showcase, prominent CTAs,
 * subtle entrance animations, and optimized readability on all screen sizes
 */
export default function Hero() {
  const services = [
    {
      title: ar.heroServiceOne,
      description: ar.heroServiceOneDesc,
      icon: '🏗️',
    },
    {
      title: ar.heroServiceTwo,
      description: ar.heroServiceTwoDesc,
      icon: '🎨',
    },
    {
      title: ar.heroServiceThree,
      description: ar.heroServiceThreeDesc,
      icon: '✅',
    },
  ];

  return (

    <section className="relative w-full min-h-screen sm:h-screen flex items-center justify-center overflow-hidden bg-black">
  
  {/* Blurred Background */}
  <Image
    src="/images/alsarhCover.jpg"
    alt="background"
    fill
    className="absolute inset-0 z-10 object-cover blur-xl scale-110"
    priority
  />

  {/* Main Image (Fully Visible) */}
  <Image
    src="/images/alsarhCover.jpg"
    alt="الصرح - خدمات البناء الشاملة"
    fill
    className="absolute inset-0 z-20 object-contain"
    priority
  />
      
  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-black/50 z-30" />
  
  {/* Gradient Overlay */}
  <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/50 to-black/60 z-30" />
      
  {/* Content Container */}
  <div className="relative z-40 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12 sm:py-16 lg:py-0">
    
    {/* Main Headline */}
    <div className="animate-fade-in-up mb-6 sm:mb-8">
      <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 text-white text-balance leading-tight tracking-tight">
        {ar.heroTitle}
      </h1>
      <div className="h-1 w-20 bg-accent mx-auto mb-8 rounded-full" />
    </div>
    
    {/* Subheading */}
    <div className="animate-fade-in-up animation-delay-200 mb-10 sm:mb-14">
      <p className="text-xl sm:text-2xl lg:text-3xl text-white/95 max-w-4xl mx-auto text-balance leading-relaxed font-light">
        {ar.heroSubtitle}
      </p>
    </div>
    
    {/* Services */}
    <div className="animate-fade-in-up animation-delay-300 mb-12 sm:mb-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto">
      {services.map((service, index) => (
        <div
          key={index}
          className="group p-4 sm:p-6 rounded-lg border border-white/20 backdrop-blur-sm hover:border-accent/50 hover:bg-white/5 transition-all duration-300"
        >
          <div className="text-4xl sm:text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">
            {service.icon}
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 text-balance">
            {service.title}
          </h3>
          <p className="text-sm sm:text-base text-white/75 text-balance leading-relaxed">
            {service.description}
          </p>
        </div>
      ))}
    </div>
    
    {/* CTA Buttons */}
    <div className="animate-fade-in-up animation-delay-400 flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center">
      
      <a
        href={`https://wa.me/201044088731?text=${encodeURIComponent(ar.heroCtaPrimaryMessage)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center justify-center px-8 sm:px-12 lg:px-16 py-4 sm:py-5 lg:py-6 bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-base sm:text-lg rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 active:scale-95 whitespace-nowrap min-w-max"
      >
        {ar.heroCtaPrimary}
        <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.52 3.44C18.9 1.86 16.76 1 14.36 1 7.65 1 2.20 6.5 2.20 13.21c0 2.01.55 3.98 1.58 5.71L2 23l6.3-1.61c1.65.9 3.52 1.38 5.41 1.38 6.71 0 12.15-5.45 12.15-12.15 0-3.24-1.31-6.3-3.74-8.58zm-6.16 18.48c-1.68 0-3.33-.44-4.79-1.26l-.34-.2-3.56.91.93-3.39-.22-.36c-1.00-1.58-1.53-3.39-1.53-5.28 0-5.58 4.53-10.11 10.11-10.11 2.70 0 5.23 1.05 7.14 2.96 1.91 1.91 2.96 4.44 2.96 7.14 0 5.58-4.53 10.11-10.11 10.11zm5.50-7.51c-.30-.15-1.76-.87-2.03-.97-.27-.10-.47-.15-.67.15-.20.30-.77.97-.94 1.17-.17.20-.34.22-.64.07-.30-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.66-2.06-.17-.30-.02-.46.13-.61.13-.13.30-.35.45-.52.15-.17.20-.30.30-.50.10-.20.05-.37-.025-.52-.075-.15-.67-1.62-.92-2.21-.24-.58-.49-.50-.67-.51-.17-.01-.37-.01-.57-.01-.20 0-.52.075-.79.375-.27.30-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.20 2.10 3.20 5.08 4.49.71.30 1.26.48 1.69.62.71.23 1.36.20 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.18-1.41-.07-.12-.27-.20-.57-.35z"/>
        </svg>
      </a>
      
      <a
        href="/projects#projects"
        className="inline-flex items-center justify-center px-8 sm:px-12 lg:px-16 py-4 sm:py-5 lg:py-6 border-2 border-white/30 hover:border-white text-white font-bold text-base sm:text-lg rounded-lg transition-all duration-300 hover:bg-white/10 backdrop-blur-sm whitespace-nowrap min-w-max"
      >
        {ar.heroCtaSecondary}
        <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
        </svg>
      </a>

    </div>
    
    {/* Scroll Indicator */}
    <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
      <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    </div>

  </div>
</section>

  );
}
