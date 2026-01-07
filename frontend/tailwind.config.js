/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1', // Indigo 500
          hover: '#4f46e5',   // Indigo 600
          light: '#818cf8',   // Indigo 400
        },
        bg: {
          dark: '#0f172a',    // Slate 900
          card: '#1e293b',    // Slate 800
          darker: '#020617',  // Slate 950
        },
        text: {
          main: '#f8fafc',    // Slate 50
          muted: '#94a3b8',   // Slate 400
        },
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#eab308',   // Yellow 500
        border: '#334155',    // Slate 700
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
            '0%': { transform: 'translateX(100%)' },
            '100%': { transform: 'translateX(0)' },
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-pattern': "url('/pattern.svg')", // Placeholder if we had one
      }
    },
  },
  plugins: [],
}
