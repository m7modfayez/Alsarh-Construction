"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Instagram } from "lucide-react";
import { ar } from "@/lib/ar-content";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappHref = `https://wa.me/201044088731?text=${encodeURIComponent("مرحبًا، أرغب في الاستفسار عن خدماتكم.")}`;

  return (
    <footer className="bg-[#0c0a09] text-white">
      {/* CTA Banner */}
      <div className="bg-[#0f172a] border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              هل أنت مستعد لبدء مشروعك؟
            </h3>
            <p className="text-white/50 text-sm">
              تواصل معنا اليوم للحصول على استشارة مجانية
            </p>
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-2.5 px-7 py-3.5 bg-[#d97706] text-white font-semibold rounded-xl hover:bg-[#b45309] transition-colors duration-200 text-sm"
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M20.52 3.44C18.9 1.86 16.76 1 14.36 1 7.65 1 2.20 6.5 2.20 13.21c0 2.01.55 3.98 1.58 5.71L2 23l6.3-1.61c1.65.9 3.52 1.38 5.41 1.38 6.71 0 12.15-5.45 12.15-12.15 0-3.24-1.31-6.3-3.74-8.58z" />
            </svg>
            تواصل عبر واتساب
          </a>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <Image
                src="/images/alsarh1.png"
                alt="الصرح للإنشاءات"
                width={40}
                height={40}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
              <span className="text-xl font-black">الصرح للإنشاءات</span>
            </div>
            <p className="text-white/55 text-sm leading-relaxed max-w-xs mb-6">
              {ar.companyDescriptionLong}
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=100063493883464"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-[#d97706] transition-colors duration-200"
                aria-label="فيسبوك"
              >
                <Facebook size={16} />
              </a>
              <a
                href="https://www.instagram.com/alsarhconstruction4"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.05] hover:bg-[#d97706] transition-colors duration-200"
                aria-label="إنستغرام"
              >
                <Instagram size={16} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm tracking-widest uppercase text-[#d97706] mb-5">
              روابط سريعة
            </h4>
            <ul className="space-y-3">
              {[
                { href: "/", label: ar.home },
                { href: "/projects", label: ar.projects },
                { href: "/#about", label: ar.about },
                { href: "/#contact", label: ar.contact },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-white/40 hover:text-white transition-colors duration-200 flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-3 h-px bg-[#d97706] transition-all duration-300" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm tracking-widest uppercase text-[#d97706] mb-5">
              تواصل معنا
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="tel:+201019499997"
                  className="flex items-start gap-3 text-sm text-white/40 hover:text-white transition-colors"
                >
                  <Phone size={15} className="mt-0.5 shrink-0 text-[#d97706]" />
                  01019499997
                </a>
              </li>
              <li>
                <a
                  href="mailto:Alsarahconstuction2022@gmail.com"
                  className="flex items-start gap-3 text-sm text-white/40 hover:text-white transition-colors"
                >
                  <Mail size={15} className="mt-0.5 shrink-0 text-[#d97706]" />
                  Alsarahconstuction2022@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://maps.app.goo.gl/wmzUrrBZnPMssx4t7"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-sm text-white/40 hover:text-white transition-colors"
                >
                  <MapPin
                    size={15}
                    className="mt-0.5 shrink-0 text-[#d97706]"
                  />
                  6 أكتوبر، محور جمال عبد الناصر
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/8 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/30">
          <span>© {currentYear} الصرح للإنشاءات. جميع الحقوق محفوظة.</span>
          <span>6 أكتوبر، القاهرة، مصر</span>
        </div>
      </div>
    </footer>
  );
}
