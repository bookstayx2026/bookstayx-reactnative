/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dark theme exact hexes from design sheet
        darkBg: '#0D0D0D',
        darkSurface: 'rgba(22, 22, 22, 0.75)',
        darkCard: 'rgba(26, 26, 26, 0.65)',
        darkBorder: 'rgba(94, 94, 94, 0.3)',
        darkMuted: '#5E5E5E',
        darkAccent: '#DAFC08',
        darkAccentHover: '#C4E407',
        darkSecondary: '#547BDE',
        darkText: '#FFFFFF',

        // Light theme exact hexes from design sheet
        lightBg: '#DDDDDD',
        lightSurface: 'rgba(255, 255, 255, 0.85)',
        lightCard: 'rgba(255, 255, 255, 0.90)',
        lightBorder: 'rgba(221, 221, 221, 0.8)',
        lightMuted: '#DDDDDD',
        lightAccent: '#F5ED31',
        lightAccentHover: '#E5DC24',
        lightSecondary: '#FF934F',
        lightText: '#0D0C0B',
      },
      fontFamily: {
        urbanist: ['Urbanist', 'sans-serif'],
        lufga: ['Lufga', 'Outfit', 'Plus Jakarta Sans', 'sans-serif'],
        sans: ['Urbanist', 'Lufga', 'Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-lime': '0 0 20px rgba(218, 252, 8, 0.35)',
        'glow-blue': '0 0 20px rgba(84, 123, 222, 0.35)',
        'glow-yellow': '0 0 20px rgba(245, 237, 49, 0.40)',
        'glow-orange': '0 0 20px rgba(255, 147, 79, 0.35)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.55)',
        'glass-light': '0 8px 30px 0 rgba(0, 0, 0, 0.08)',
      },
      backdropBlur: {
        'xs': '2px',
        '2xl': '24px',
        '3xl': '32px',
      }
    },
  },
  plugins: [],
}
