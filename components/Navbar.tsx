"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Phone } from "lucide-react";
import { ar } from "@/lib/ar-content";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: ar.home },
    { href: "/projects", label: ar.projects },
    { href: "/#about", label: ar.about },
    { href: "/#contact", label: ar.contact },
  ];

  const whatsappHref = `https://wa.me/201044088731?text=${encodeURIComponent(ar.heroCtaPrimaryMessage)}`;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-[#E2DDD6]"
          : "bg-white border-b border-[#E2DDD6]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[70px]">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 flex items-center gap-3 group"
            onClick={() => {
              if (window.location.pathname === "/") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            <Image
              src="/images/alsarh1.png"
              alt="الصرح للإنشاءات"
              width={44}
              height={44}
              priority
              className="h-11 w-auto object-contain"
            />
            <span className="hidden sm:block font-bold text-lg text-[#1A1A18] leading-tight">
              الصرح
              <span className="block text-[10px] font-normal text-[#6B6860] tracking-widest uppercase">
                Construction
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-semibold text-[#3A3A38] hover:text-[#7A1A24] transition-colors duration-200 group"
              >
                {link.label}
                <span className="absolute bottom-0 right-4 left-4 h-0.5 bg-[#7A1A24] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right rounded-full" />
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href="tel:01019499997"
              className="flex items-center gap-2 text-sm font-medium text-[#6B6860] hover:text-[#7A1A24] transition-colors"
            >
              <Phone size={15} />
              <span>01019499997</span>
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A1A24] hover:bg-[#5C1019] text-white text-sm font-bold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-[#7A1A24]/20"
            >
              ابدأ مشروعك
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#3A3A38] hover:bg-[#F4F1EC] transition-colors"
            aria-label="القائمة"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2DDD6] bg-white">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 rounded-lg text-base font-semibold text-[#3A3A38] hover:bg-[#F4F1EC] hover:text-[#7A1A24] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 border-t border-[#E2DDD6] mt-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full px-4 py-3 bg-[#7A1A24] text-white font-bold rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                ابدأ مشروعك الآن
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
