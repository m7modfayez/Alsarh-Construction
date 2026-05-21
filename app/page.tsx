import Hero from "@/components/Hero";
import FullServiceCard from "@/components/FullServiceCard";
import ProjectCard from "@/components/ProjectCard";
import { statistics } from "@/data";
import { ar } from "@/lib/ar-content";
import { getFeaturedProjects } from "@/lib/data-fetching";

// Revalidate every 5 minutes — new projects appear without a full redeploy
export const revalidate = 300;

export default async function Home() {
  const featuredProjects = await getFeaturedProjects();

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <Hero />

      {/* ── ABOUT ── */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="section-divider" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#d97706]">
                  من نحن
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0c0a09] leading-tight mb-6">
                {ar.whoWeAre}
              </h2>
              <p
                className="text-[#78716c] leading-relaxed mb-4"
                dangerouslySetInnerHTML={{
                  __html: ar.aboutDescription1.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="font-bold text-[#0c0a09]">$1</strong>',
                  ),
                }}
              />
              <p className="text-[#78716c] leading-relaxed mb-8">
                {ar.aboutDescription2}
              </p>
              <a
                href={`https://wa.me/201066397098?text=${encodeURIComponent(ar.heroCtaPrimaryMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#0f172a] text-white font-semibold rounded-xl hover:bg-[#1e293b] transition-all duration-300 hover:shadow-xl"
              >
                ابدأ محادثة معنا
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

            <div className="grid grid-cols-2 gap-4">
              {statistics.map((stat, i) => (
                <div
                  key={i}
                  className="bg-[#f5f5f4] border border-[#e7e5e4] rounded-2xl p-7 hover:border-[#d97706]/30 hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-4xl font-bold text-[#0f172a] mb-2">
                    {stat.number}
                  </div>
                  <div className="text-sm text-[#78716c] font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-28 bg-[#fafaf9] relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="w-full h-full" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #0c0a09 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}/>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-5">
              <div className="section-divider" />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#d97706]">
                ما نقدمه
              </span>
              <div className="section-divider" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0c0a09] mb-5 tracking-tight">
              {ar.ourServices}
            </h2>
            <p className="text-[#78716c] max-w-2xl mx-auto text-lg leading-relaxed">
              {ar.servicesSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FullServiceCard
              icon="🏗️"
              title={ar.constructionServiceTitle}
              subtitle={ar.constructionServiceSubtitle}
              includesList={ar.constructionServiceIncludesList}
              ctaText="ابدأ مشروعك"
              message={ar.constructionServiceMessage}
            />
            <FullServiceCard
              icon="🎨"
              title={ar.finishingServiceTitle}
              subtitle={ar.finishingServiceSubtitle}
              includesList={ar.finishingServiceIncludesList}
              ctaText="اطلب استشارة"
              message={ar.finishingServiceMessage}
            />
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

      {/* ── FEATURED PROJECTS ── */}
      <section id="projects" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="section-divider" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#d97706]">
                  أعمالنا
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0c0a09]">
                {ar.featuredProjects}
              </h2>
            </div>
            <a
              href="/projects"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-[#d97706] hover:gap-3 transition-all duration-200"
            >
              {ar.viewAllProjects}
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

          {featuredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[#6B6860]">
              لا توجد مشاريع حتى الآن
            </div>
          )}

          <div className="sm:hidden text-center mt-8">
            <a
              href="/projects"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-[#0f172a] text-[#0f172a] font-medium rounded-xl hover:bg-[#0f172a] hover:text-white transition-all duration-300"
            >
              {ar.viewAllProjects}
            </a>
          </div>
        </div>
      </section>

      {/* ── WHY US ── */}
      <section className="py-24 bg-[#0c0a09] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="section-divider-light" />
                <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#d97706]">
                  لماذا الصرح
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-6">
                شريكك الموثوق من أول خطوة لحد ما تستلم مشروعك
              </h2>
              <p className="text-white/50 leading-relaxed">
                نلتزم بأعلى معايير الجودة والدقة في التنفيذ، مع ضمان التسليم في
                الوقت المتفق عليه وضمن الميزانية المحددة.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "🏆",
                  title: "جودة مضمونة",
                  desc: "أعلى معايير التنفيذ في كل مرحلة من مراحل المشروع",
                },
                {
                  icon: "⏱️",
                  title: "التزام بالمواعيد",
                  desc: "تسليم مشروعك في الوقت المتفق عليه دون تأخير",
                },
                {
                  icon: "💡",
                  title: "حلول متكاملة",
                  desc: "من التخطيط والتصميم حتى التشطيب والتسليم النهائي",
                },
                {
                  icon: "🤝",
                  title: "شفافية كاملة",
                  desc: "تواصل مستمر وتقارير دورية طوال تنفيذ مشروعك",
                },
              ].map(({ icon, title, desc }) => (
                <div
                  key={title}
                  className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:bg-white/[0.06] hover:border-white/[0.1] transition-colors duration-300"
                >
                  <div className="text-2xl mb-3">{icon}</div>
                  <h4 className="font-semibold text-white mb-1.5">{title}</h4>
                  <p className="text-sm text-white/40 leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-24 bg-[#f5f5f4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-[#e7e5e4] overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="bg-[#0f172a] p-10 md:p-14 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="section-divider-light" />
                  <span className="text-xs font-semibold tracking-[0.2em] uppercase text-[#d97706]">
                    تواصل معنا
                  </span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
                  {ar.contactHeadline}
                </h2>
                <p
                  className="text-white/50 leading-relaxed mb-10"
                  dangerouslySetInnerHTML={{
                    __html: ar.contactSupportingText.replace(
                      /\*\*(.*?)\*\*/g,
                      '<strong class="text-white font-semibold">$1</strong>',
                    ),
                  }}
                />
                <a
                  href={`https://wa.me/201066397098?text=${encodeURIComponent("مرحبًا، حابب أبدأ مشروع وعايز مساعدة في البناء أو التشطيب لحد ما يبقى جاهز بالكامل.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start inline-flex items-center gap-3 px-8 py-4 bg-[#d97706] text-white font-semibold rounded-xl hover:bg-[#b45309] transition-all duration-300 hover:shadow-xl text-base"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20.52 3.44C18.9 1.86 16.76 1 14.36 1 7.65 1 2.20 6.5 2.20 13.21c0 2.01.55 3.98 1.58 5.71L2 23l6.3-1.61c1.65.9 3.52 1.38 5.41 1.38 6.71 0 12.15-5.45 12.15-12.15 0-3.24-1.31-6.3-3.74-8.58z" />
                  </svg>
                  {ar.primaryCTA}
                </a>
              </div>

              <div className="p-10 md:p-14 flex flex-col justify-center gap-6">
                <h3 className="text-lg font-bold text-[#0c0a09] mb-2">
                  {ar.contactInfoSecondary}
                </h3>
                {[
                  {
                    label: ar.phone,
                    value: "01019499997",
                    href: "tel:01019499997",
                  },
                  {
                    label: ar.email,
                    value: "Alsarahconstuction2022@gmail.com",
                    href: "mailto:Alsarahconstuction2022@gmail.com",
                  },
                  {
                    label: ar.address,
                    value: "6 أكتوبر، محور جمال عبد الناصر",
                    href: "https://maps.app.goo.gl/wmzUrrBZnPMssx4t7",
                  },
                  {
                    label: ar.businessHours,
                    value: ar.businessHoursValue,
                    href: null,
                  },
                ].map(({ label, value, href }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1 border-b border-[#e7e5e4] pb-5 last:border-0 last:pb-0"
                  >
                    <span className="text-xs font-semibold text-[#d97706] uppercase tracking-wider">
                      {label}
                    </span>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="text-sm font-medium text-[#0c0a09] hover:text-[#d97706] transition-colors"
                      >
                        {value}
                      </a>
                    ) : (
                      <span className="text-sm text-[#78716c]">{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
