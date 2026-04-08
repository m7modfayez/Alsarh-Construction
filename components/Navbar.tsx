'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ar } from '@/lib/ar-content';

/**
 * Navigation Bar Component
 * Responsive navigation with mobile menu
 */
export default function Navbar() {
  const navLinks = [
    { href: '/', label: ar.home },
    { href: '/projects', label: ar.projects },
    { href: '/#about', label: ar.about },
    { href: '/#contact', label: ar.contact },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="shrink-0 flex items-center hover:opacity-80 transition-opacity">
            <Image
              src="/images/alsarh1.png"
              alt="الصرح"
              width={50}
              height={50}
              priority
              className="h-10 sm:h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-primary transition-colors font-medium text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Projects Link */}
          <div className="md:hidden">
            <Link
              href="/projects"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
            >
              {ar.projects}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
