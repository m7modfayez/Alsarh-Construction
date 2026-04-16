'use client';

import Image from 'next/image';
import Hero from '@/components/Hero';
import FullServiceCard from '@/components/FullServiceCard';
import ServiceCard from '@/components/ServiceCard';
import ProjectCard from '@/components/ProjectCard';
import ContactForm from '@/components/ContactForm';
import { projects, services, statistics, teamMembers } from '@/data';
import { ar } from '@/lib/ar-content';

/**
 * Home Page
 * Main landing page featuring hero, about, services, featured projects, team, and contact sections
 */
export default function Home() {
  const featuredProjects = projects.slice(0, 3);

  return (
    <div className="min-h-screen">
      <Hero />

      {/* About Section */}
      <section id="about" className="py-20 md:py-24 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            
            {/* Heading */}
            <div className="space-y-4">
              <h2 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight">
                {ar.whoWeAre}
              </h2>
              
              {/* Short Intro */}
              {/* <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
                {ar.aboutDescription1.split('.')[0] + '.'}
              </p> */}
            </div>

            {/* Main Paragraph */}
            <div className="space-y-6">
              <p 
                className="text-gray-600 leading-relaxed max-w-xl mx-auto"
                dangerouslySetInnerHTML={{ 
                  __html: ar.aboutDescription1.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 text-lg">$1</strong>') 
                }}
              />
              
              {/* Highlight Sentence */}
              <p className="text-gray-600 leading-relaxed max-w-xl mx-auto font-medium">
                {ar.aboutDescription2}
              </p>
            </div>

            {/* Stats Section */}
            <div className="mt-12">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {statistics.map((stat, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-md p-5 text-center hover:shadow-lg transition-shadow duration-300">
                    <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">
                      {stat.number}
                    </div>
                    <div className="text-sm md:text-base text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {ar.ourServices}
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              {ar.servicesSubtitle}
            </p>
          </div>
          
          {/* Full Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-16">
            {/* Construction Service */}
            <FullServiceCard
              icon="🏗️"
              title={ar.constructionServiceTitle}
              subtitle={ar.constructionServiceSubtitle}
              includesList={ar.constructionServiceIncludesList}
              ctaText="ابدأ مشروعك"
              message={ar.constructionServiceMessage}
            />
            
            {/* Finishing Service */}
            <FullServiceCard
              icon="🎨"
              title={ar.finishingServiceTitle}
              subtitle={ar.finishingServiceSubtitle}
              includesList={ar.finishingServiceIncludesList}
              ctaText="اطلب استشارة"
              message={ar.finishingServiceMessage}
            />
            
            {/* Turnkey Service */}
            <FullServiceCard
              icon="✨"
              title={ar.turnkeyServiceTitle}
              subtitle={ar.turnkeyServiceSubtitle}
              includesList={ar.turnkeyServiceIncludesList}
              ctaText="احصل على عرض سعر"
              message={ar.turnkeyServiceMessage}
              isHighlighted={true}
            />
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section id="projects" className="py-16 md:py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {ar.featuredProjects}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {ar.featuredProjectsSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {featuredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <div className="text-center">
            <a
              href="/projects"
              className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium"
            >
              {ar.viewAllProjects}
            </a>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {ar.ourTeam}
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              {ar.ourTeamSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {teamMembers.map((member) => (
              <article key={member.id} className="text-center">
                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto rounded-full bg-muted overflow-hidden mb-4 shadow-sm">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-medium text-foreground text-sm md:text-base mb-1">{member.name}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{member.title}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 md:py-24 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            
            {/* Strong Headline */}
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              {ar.contactHeadline}
            </h2>
            
            {/* Supporting Text */}
            <p 
              className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto"
              dangerouslySetInnerHTML={{ 
                __html: ar.contactSupportingText.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>') 
              }}
            />

            {/* Single WhatsApp CTA Button */}
            <div className="mt-10">
              <a
                href={`https://wa.me/201044088731?text=${encodeURIComponent('مرحبًا، حابب أبدأ مشروع وعايز مساعدة في البناء أو التشطيب لحد ما يبقى جاهز بالكامل.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-w-[250px]"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.52 3.44C18.9 1.86 16.76 1 14.36 1 7.65 1 2.20 6.5 2.20 13.21c0 2.01.55 3.98 1.58 5.71L2 23l6.3-1.61c1.65.9 3.52 1.38 5.41 1.38 6.71 0 12.15-5.45 12.15-12.15 0-3.24-1.31-6.3-3.74-8.58zm-6.16 18.48c-1.68 0-3.33-.44-4.79-1.26l-.34-.2-3.56.91.93-3.39-.22-.36c-1.00-1.58-1.53-3.39-1.53-5.28 0-5.58 4.53-10.11 10.11-10.11 2.70 0 5.23 1.05 7.14 2.96 1.91 1.91 2.96 4.44 2.96 7.14 0 5.58-4.53 10.11-10.11 10.11zm5.50-7.51c-.30-.15-1.76-.87-2.03-.97-.27-.10-.47-.15-.67.15-.20.30-.77.97-.94 1.17-.17.20-.34.22-.64.07-.30-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.66-2.06-.17-.30-.02-.46.13-.61.13-.13.30-.35.45-.52.15-.17.20-.30.30-.50.10-.20.05-.37-.025-.52-.075-.15-.67-1.62-.92-2.21-.24-.58-.49-.50-.67-.51-.17-.01-.37-.01-.57-.01-.20 0-.52.075-.79.375-.27.30-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.08c.15.20 2.10 3.20 5.08 4.49.71.30 1.26.48 1.69.62.71.23 1.36.20 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.18-1.41-.07-.12-.27-.20-.57-.35z"/>
                </svg>
                {ar.primaryCTA}
              </a>
            </div>

          </div>

          {/* Secondary Contact Info */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-700 mb-6">{ar.contactInfoSecondary}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                
                {/* Phone */}
                <div>
                  <div className="font-medium text-gray-600 mb-1">{ar.phone}</div>
                  <a href="tel:01019499997" className="text-primary hover:text-primary/80 transition-colors">
                    01019499997
                  </a>
                </div>

                {/* Email */}
                <div>
                  <div className="font-medium text-gray-600 mb-1">{ar.email}</div>
                  <a href="mailto:Alsarahconstuction2022@gmail.com" className="text-primary hover:text-primary/80 transition-colors">
                    Alsarahconstuction2022
                  </a>
                </div>

                {/* Address */}
                <div>
                  <div className="font-medium text-gray-600 mb-1">{ar.address}</div>
                  <a 
                    href="https://maps.app.goo.gl/wmzUrrBZnPMssx4t7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    6 October, Gamal Abdel Nasser Axis
                  </a>
                </div>

                {/* Hours */}
                <div>
                  <div className="font-medium text-gray-600 mb-1">{ar.businessHours}</div>
                  <div className="text-gray-500">
                    {ar.businessHoursValue}
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
