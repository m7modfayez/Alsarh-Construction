'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { ar } from '@/lib/ar-content';

/**
 * Footer Component
 * Contains company information, quick links, contact details, and social media
 */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold mb-4">الصرح</h3>
            <p className="text-sm opacity-90 leading-relaxed">
              {ar.companyDescriptionLong}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-4 text-lg">{ar.quickLinks}</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:opacity-80 transition-opacity">{ar.home}</Link></li>
              <li><Link href="/projects" className="hover:opacity-80 transition-opacity">{ar.projects}</Link></li>
              <li><Link href="/#about" className="hover:opacity-80 transition-opacity">{ar.about}</Link></li>
              <li><Link href="/#contact" className="hover:opacity-80 transition-opacity">{ar.contact}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4 text-lg">{ar.contactUs}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Phone size={16} className="shrink-0" />
                <a href="tel:+2001019499997" className="hover:opacity-80 transition-opacity">
                  01019499997
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0" />
                <a href="mailto:Alsarahconstuction2022@gmail.com" className="hover:opacity-80 transition-opacity">
                  Alsarahconstuction2022@gmail.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="shrink-0 mt-0.5" />
                <a 
                  href="https://maps.app.goo.gl/wmzUrrBZnPMssx4t7" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  6اكتوبر محور جمال عبدالناصر عمارات البنك عماره٢٠شقه٢
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h4 className="font-bold mb-2 text-lg">{ar.followUs}</h4>
            <div className="flex gap-4">
              <a href="https://www.facebook.com/profile.php?id=100063493883464" target='blank' className="hover:opacity-80 transition-opacity" aria-label="Facebook">
                <Facebook size={20} />
              </a>
              <a href="https://www.instagram.com/alsarhconstruction4?fbclid=IwY2xjawRDIsBleHRuA2FlbQIxMABicmlkETFPdnU1NlcwcGZLQmFrSzFPc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHk0weDHgVA-MzNW34ZTqcneVZ36r2JlqXYEs_B3JI-iOIzKfft0sYsHKRf7q_aem_isLI6aLrQ15q2XJJ437pwA" target='blank' className="hover:opacity-80 transition-opacity" aria-label="Instagram">
                <Instagram size={20} />
              </a>
              {/* <a href="#" className="hover:opacity-80 transition-opacity" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a> */}
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/20 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm opacity-75">
            © {currentYear} الصرح. {ar.allRightsReserved}
          </p>
        </div>
      </div>
    </footer>
  );
}
