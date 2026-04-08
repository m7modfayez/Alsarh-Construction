'use client';

import Hero from '@/components/Hero';
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
      <section id="about" className="py-16 md:py-24 bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                {ar.whoWeAre}
              </h2>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                {ar.aboutDescription1}
              </p>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                {ar.aboutDescription2}
              </p>
              <div className="flex gap-8">
                {statistics.map((stat, index) => (
                  <div key={index}>
                    <div className="text-3xl font-bold text-primary">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg overflow-hidden flex items-center justify-center">
              <p className="text-primary/20 text-6xl font-bold">الصرح</p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {ar.ourServices}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {ar.servicesSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section className="py-16 md:py-24 bg-secondary">
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {ar.ourTeam}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {ar.ourTeamSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {teamMembers.map((member) => (
              <article key={member.id} className="text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-muted overflow-hidden mb-4 shadow-md">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-bold text-foreground text-lg">{member.name}</h3>
                <p className="text-sm text-muted-foreground">{member.title}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 md:py-24 bg-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              {ar.getInTouch}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {ar.contactSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">{ar.contactInformation}</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-foreground mb-2">{ar.email}</h4>
                  <a href="mailto:info@alsarh.com" className="text-primary hover:underline">
                    info@alsarh.com
                  </a>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">{ar.phone}</h4>
                  <a href="tel:+2001044088731" className="text-primary hover:underline">
                    01044088731
                  </a>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">WhatsApp</h4>
                  <a href="https://wa.me/+2001044088731" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-2">
                    <span>💬</span> تواصل عبر WhatsApp
                  </a>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">{ar.address}</h4>
                  <p className="text-muted-foreground mb-3">
                   ‏6اكتوبر محور جمال عبدالناصر عمارات البنك عماره٢٠شقه٢‏
                  </p>
                  <a 
                    href="https://maps.app.goo.gl/wmzUrrBZnPMssx4t7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
                  >
                    <span>📍</span> عرض على Google Maps
                  </a>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">{ar.businessHours}</h4>
                  <p className="text-muted-foreground whitespace-pre-line">
                    الأحد - الخميس: 9:00 صباحاً - 5:00 مساءً<br />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
