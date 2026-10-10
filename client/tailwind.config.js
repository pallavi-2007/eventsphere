/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        plum: {
          50: '#FAF4F9',
          100: '#F5EEF4',
          200: '#EBDDE9',
          300: '#D5B8D2',
          400: '#A66B9F',
          500: '#7B3574',
          DEFAULT: '#5A2A55',
          600: '#5A2A55',
          700: '#482044',
          800: '#381635',
          900: '#260D24',
        },
        cream: {
          50: '#FFFFFF',
          DEFAULT: '#FBF8F4',
          100: '#FBF8F4',
          200: '#F5EFE6',
          300: '#EAE1D4',
          400: '#D4C6B5',
        },
        sunset: {
          peach: '#FF8A65',
          coral: '#FF6B6B',
          pink: '#E75D84',
          purple: '#8B3A75',
          dark: '#5A2A55',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      backgroundImage: {
        'sunset-gradient': 'linear-gradient(135deg, #FF7A59 0%, #E84A78 45%, #8A2D6C 80%, #5A2A55 100%)',
        'sunset-soft': 'linear-gradient(135deg, rgba(255,122,89,0.12) 0%, rgba(232,74,120,0.15) 50%, rgba(90,42,85,0.15) 100%)',
        'plum-gradient': 'linear-gradient(180deg, #5A2A55 0%, #431437 100%)',
      }
    },
  },
  plugins: [],
}
