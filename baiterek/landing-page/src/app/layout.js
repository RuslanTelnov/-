import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-inter" });

export const metadata = {
  title: "Baiterek Collection | Premium Perfumes",
  description: "Experience the essence of Kazakhstan with our exclusive Baiterek perfume collection: Astana, Almaty, Ulytau, and Qara Altyn.",
};

import CinematicOverlay from "@/components/CinematicOverlay";
import SmoothScroll from "@/components/SmoothScroll";

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-dark-900 text-white min-h-screen overflow-x-hidden relative`}>
        <SmoothScroll>
          <CinematicOverlay />
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
