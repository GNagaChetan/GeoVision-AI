/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          midnight: '#08162B',
          navy: '#102A43',
          ocean: '#176B87',
          glacier: '#DDF3FA',
          mist: '#F7FBFD',
          forest: '#2E7D5B',
          terrain: '#78A86B',
          sand: '#D6BE8A',
          slate: '#34465A',
        },
        geo: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          800: '#1e293b',
          900: '#0f172a',
        },
        lulc: {
          vegetation: '#2E7D5B', // Forest green
          water: '#176B87',      // Ocean blue
          builtup: '#e11d48',    // Urban rose
          agriculture: '#78A86B',// Terrain green
          bareland: '#D6BE8A',   // Sand
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'floating': '0 10px 25px -5px rgba(23, 107, 135, 0.08), 0 8px 10px -6px rgba(23, 107, 135, 0.04)',
        'elevated': '0 20px 25px -5px rgba(8, 22, 43, 0.08), 0 8px 10px -6px rgba(8, 22, 43, 0.03)',
      }
    },
  },
  plugins: [],
}
