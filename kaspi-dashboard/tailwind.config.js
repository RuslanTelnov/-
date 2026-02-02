/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Sci-Fi Palette
        sci: {
          base: '#020617', // Deep dark blue/black
          panel: '#0f172a', // Slightly lighter for panels
          cyan: {
            DEFAULT: '#06b6d4', // Primary Accent
            dim: 'rgba(6, 182, 212, 0.2)',
            glow: 'rgba(6, 182, 212, 0.5)',
          },
          green: {
            DEFAULT: '#10b981', // Secondary Accent
            dim: 'rgba(16, 185, 129, 0.2)',
            glow: 'rgba(16, 185, 129, 0.5)',
          },
          amber: {
            DEFAULT: '#f59e0b', // Warning
            dim: 'rgba(245, 158, 11, 0.2)',
            glow: 'rgba(245, 158, 11, 0.5)',
          },
          red: {
            DEFAULT: '#ef4444', // Danger
            dim: 'rgba(239, 68, 68, 0.2)',
            glow: 'rgba(239, 68, 68, 0.5)',
          },
        },
        fintech: {
          bg: '#0B1121', // Deep Navy / Charcoal
          card: 'rgba(255, 255, 255, 0.03)',
          border: 'rgba(255, 255, 255, 0.05)',
          aqua: '#00F0FF', // Neon Aqua
          green: '#22C55E', // Success Green
          purple: '#8B5CF6', // Chart accents
          text: {
            main: '#F5F7FF',
            muted: '#9BA0B3',
            dim: '#64748B'
          }
        }
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-amber': '0 0 20px rgba(245, 158, 11, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'fintech-card': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'fintech-glow': '0 0 20px rgba(0, 240, 255, 0.15)',
        'fintech-glow-strong': '0 0 30px rgba(0, 240, 255, 0.3)',
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)",
      }
    },
  },
  plugins: [],
}
