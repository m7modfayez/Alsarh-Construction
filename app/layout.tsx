import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "الصرح للإنشاءات | من أرضك إلى مشروع جاهز",
    template: "%s | الصرح للإنشاءات",
  },
  description:
    "شركة الصرح للإنشاءات — تنفيذ مشروعك من البداية حتى التسليم النهائي، بناءً وتشطيباً وإدارة متكاملة.",
  keywords: [
    "البناء",
    "الإنشاءات",
    "التشطيب",
    "المقاولات",
    "مصر",
    "6 أكتوبر",
    "الصرح",
  ],
  authors: [{ name: "الصرح للإنشاءات" }],
  metadataBase: new URL("https://alsarh.com"),
  icons: {
    icon: "/images/alsarh1.png",
    apple: "/images/alsarh1.png",
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://alsarh.com",
    title: "الصرح للإنشاءات | من أرضك إلى مشروع جاهز",
    description:
      "تنفيذ مشروعك من البداية حتى التسليم النهائي، بناءً وتشطيباً وإدارة متكاملة.",
    siteName: "الصرح للإنشاءات",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body
        className={`${cairo.variable} font-sans antialiased flex flex-col min-h-screen`}
      >
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
