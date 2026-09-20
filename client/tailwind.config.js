/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Typewriter-style monospace for reading and UI; a pixel face for short labels and headings
        sans: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        pixel: ['"Press Start 2P"', 'ui-monospace', 'monospace'],
      },
      colors: {
        brand: {
          50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac', 400: '#4ade80',
          500: '#22c55e', 600: '#16a34a', 700: '#15803d', 800: '#166534', 900: '#14532d', 950: '#052e16',
        },
        surface: {
          0: 'rgb(0 0 0 / <alpha-value>)',
          50: 'rgb(5 5 5 / <alpha-value>)',
          100: 'rgb(10 10 10 / <alpha-value>)',
          200: 'rgb(16 16 16 / <alpha-value>)',
          300: 'rgb(24 24 27 / <alpha-value>)',
          400: 'rgb(31 31 35 / <alpha-value>)',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out both',
        'fade-in-up': 'fadeInUp 0.35s ease-out both',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeInUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
