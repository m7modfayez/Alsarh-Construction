import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import './globals.css'

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Al-sarh',
  description: 'حلول معمارية مبتكرة وخدمات بناء مستدامة للمشاريع الحديثة',
  keywords: 'البناء، المعمارية، التصميم، المشاريع',
  authors: [{ name: 'الصرح' }],
  icons: {
    icon: '/images/alsarh1.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: 'https://example.com',
    title: 'الصرح - شركة البناء والتشييد',
    description: 'حلول معمارية مبتكرة وخدمات بناء مستدامة للمشاريع الحديثة',
    siteName: 'الصرح',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ar" dir="rtl" data-scroll-behavior="smooth">
      <body className={`${geist.className} antialiased flex flex-col min-h-screen`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

