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
          dark: '#0a0f1a',    // Darker for glass effect
          card: 'rgba(30, 41, 59, 0.5)', // Semi-transparent
          darker: '#020617',  // Slate 950
        },
        text: {
          main: '#f8fafc',    // Slate 50
          muted: '#94a3b8',   // Slate 400
        },
        danger: '#ef4444',
        success: '#22c55e',
        warning: '#eab308',   // Yellow 500
        border: 'rgba(255, 255, 255, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s linear infinite',
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
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(99, 102, 241, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
      },
      backdropBlur: {
        xs: '2px',
        '3xl': '64px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), 0 0 1px 0 rgba(255, 255, 255, 0.1) inset',
        'glass-hover': '0 16px 48px rgba(0, 0, 0, 0.4), 0 0 1px 0 rgba(255, 255, 255, 0.2) inset',
        'glow-primary': '0 0 30px rgba(99, 102, 241, 0.3)',
        'glow-success': '0 0 30px rgba(34, 197, 94, 0.3)',
        'glow-danger': '0 0 30px rgba(239, 68, 68, 0.3)',
      },
    },
  },
  plugins: [],
}
