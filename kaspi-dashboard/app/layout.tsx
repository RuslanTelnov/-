import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Мой склад - Дашборд',
  description: 'Дашборд для анализа данных Мой склад с AI интеграцией',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" className="scroll-smooth">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}

