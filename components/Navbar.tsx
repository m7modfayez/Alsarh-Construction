"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
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
      className={`bg-white sticky top-0 z-50 transition-all duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px]">
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
              width={70}
              height={70}
              priority
              className="h-11 w-auto h-auto object-contain"
            />
            {/* <span className="hidden sm:block font-bold text-lg text-[#0c0a09] leading-tight">
              الصرح
              <span className="block text-[10px] font-normal text-[#78716c] tracking-widest uppercase">
                Construction
              </span>
            </span> */}
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-[#57534e] hover:text-[#0f172a] transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg"
            >
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M20.52 3.44C18.9 1.86 16.76 1 14.36 1 7.65 1 2.20 6.5 2.20 13.21c0 2.01.55 3.98 1.58 5.71L2 23l6.3-1.61c1.65.9 3.52 1.38 5.41 1.38 6.71 0 12.15-5.45 12.15-12.15 0-3.24-1.31-6.3-3.74-8.58z" />
              </svg>
              ابدأ مشروعك
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#57534e] hover:bg-[#f5f5f4] transition-colors"
            aria-label="القائمة"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#e7e5e4] bg-white">
          <div className="max-w-7xl mx-auto px-4 py-5 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 rounded-lg text-base font-medium text-[#57534e] hover:bg-[#f5f5f4] hover:text-[#0f172a] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-4 mt-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full px-4 py-3 bg-[#0f172a] text-white font-medium rounded-lg"
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
