/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Deep ocean navy palette
        ink: {
          950: '#060D1A',
          900: '#081120',
          800: '#0A1628',
          700: '#0F1F3D',
          600: '#152A4D',
        },
        // Aqua / cyan brand range
        aqua: {
          50: '#E0F7FF',
          100: '#B8EBFF',
          200: '#7DD3FC',
          300: '#38BDF8',
          400: '#00C2FF',
          500: '#0EA5E9',
          600: '#0284C7',
        },
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.04)',
          aqua: 'rgba(0, 194, 255, 0.07)',
          border: 'rgba(0, 194, 255, 0.12)',
          borderSoft: 'rgba(255, 255, 255, 0.06)',
        },
      },
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      letterSpacing: {
        wider2: '0.08em',
        widest2: '0.14em',
      },
      animation: {
        'orb-float': 'orbFloat 8s ease-in-out infinite',
        'fade-up': 'fadeUp 0.8s ease both',
        'pulse-glow': 'pulseGlow 2s infinite',
        'scroll-pulse': 'scrollPulse 2s infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        orbFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-30px) scale(1.05)' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(30px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': {
            opacity: 1,
            boxShadow: '0 0 0 0 rgba(0, 194, 255, 0.4)',
          },
          '50%': {
            opacity: 0.7,
            boxShadow: '0 0 0 6px rgba(0, 194, 255, 0)',
          },
        },
        scrollPulse: {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 1 },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        xs: '4px',
      },
      boxShadow: {
        glow: '0 0 40px rgba(0, 194, 255, 0.25)',
        'glow-lg': '0 0 80px rgba(0, 194, 255, 0.35)',
      },
    },
  },
  plugins: [],
}
