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
