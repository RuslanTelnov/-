import { Inter } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "BAITEREK — The Spirit of Kazakhstan | Luxury Perfume Collection",
  description:
    "Откройте для себя коллекцию ароматов BAITEREK: Astana, Almaty, Ulytau, Qara Altyn. Произведено в Казахстане с использованием французских парфюмерных компонентов.",
  keywords: "BAITEREK, парфюм, Казахстан, Астана, Алматы, Улытау, Кара Алтын, духи, аромат, The Spirit of Kazakhstan, perfume",
  authors: [{ name: "BAITEREK" }],
  creator: "ТОО Аромат",
  publisher: "BAITEREK",
  metadataBase: new URL("https://landing-page-rus1.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BAITEREK — The Spirit of Kazakhstan",
    description: "Премиальная коллекция ароматов, произведённая в Казахстане. 4 уникальных аромата: Astana, Almaty, Ulytau, Qara Altyn.",
    url: "https://landing-page-rus1.vercel.app",
    siteName: "BAITEREK",
    locale: "ru_KZ",
    type: "website",
    images: [
      {
        url: "/assets/hero_bottle.jpg",
        width: 1200,
        height: 630,
        alt: "BAITEREK Perfume Collection",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BAITEREK — The Spirit of Kazakhstan",
    description: "Премиальная коллекция ароматов, произведённая в Казахстане.",
    images: ["/assets/hero_bottle.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru" className="dark">
      <body
        className={`${inter.variable} font-sans antialiased bg-dark-900 text-white min-h-screen overflow-x-hidden`}
      >
        <Navbar />
        <SmoothScroll>{children}</SmoothScroll>
        <div className="noise-overlay" />
      </body>
    </html>
  );
}
