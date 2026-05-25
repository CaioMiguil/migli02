/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        /* Ink — fundo escuro profundo (Structure.run / Vision Pro)
           ink.950 fundo principal (preto azulado)
           ink.900 cards primários
           ink.800 cards elevados
           ink.700 borders
        */
        ink: {
          950: '#04060C',
          925: '#070B14',
          900: '#0A0F1A',
          850: '#0E1422',
          800: '#131B2C',
          700: '#1C2538',
          600: '#2C374B',
          500: '#475061',
          400: '#6B7280',
          300: '#9CA3AF',
          200: '#C9CFD8',
          100: '#E8EEF5',
        },

        /* Ocean — azul oceânico vivo (Structure.run blue) */
        ocean: {
          50: '#EBF8FF',
          100: '#C8E9FA',
          200: '#92D3F5',
          300: '#5BBCEF',
          400: '#2BA5E8',
          500: '#0E8AC4',
          600: '#0871A6',
          700: '#0A5C83',
          800: '#103D5A',
          900: '#0A1E2F',
        },

        /* Aqua — accent vibrante (glow das partículas) */
        aqua: {
          50: '#E0F8FF',
          100: '#B8EBFF',
          200: '#7DD3FC',
          300: '#38BDF8',
          400: '#00C2FF',
          500: '#0EA5E9',
          600: '#0284C7',
        },

        'glass-border': 'rgba(125, 211, 252, 0.12)',
      },

      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      letterSpacing: {
        tightest: '-0.045em',
        tighter: '-0.025em',
        tight: '-0.015em',
        normal2: '-0.005em',
        wider2: '0.08em',
        widest2: '0.14em',
        widest3: '0.22em',
        widest4: '0.32em',
      },

      lineHeight: {
        snug2: '1.1',
        relaxed2: '1.65',
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.4)',
        card: '0 4px 16px rgba(0,0,0,0.3), 0 1px 4px rgba(0,0,0,0.2)',
        elevated: '0 14px 40px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.25)',
        glow: '0 0 40px rgba(0, 194, 255, 0.28)',
        'glow-lg': '0 0 80px rgba(0, 194, 255, 0.38)',
        ocean: '0 12px 32px rgba(14, 138, 196, 0.32)',
        'ocean-lg': '0 18px 48px rgba(14, 138, 196, 0.42)',
        aqua: '0 12px 32px rgba(0, 194, 255, 0.35)',
        'aqua-lg': '0 20px 56px rgba(0, 194, 255, 0.48)',
        'tab-bar': '0 -2px 24px rgba(0,0,0,0.5)',
      },

      animation: {
        'orb-float': 'orbFloat 8s ease-in-out infinite',
        'fade-up': 'fadeUp 0.7s ease both',
        'pulse-glow': 'pulseGlow 2s infinite',
        'pulse-ocean': 'pulseOcean 2.4s ease-in-out infinite',
        'wave': 'wave 6s ease-in-out infinite',
        'spin-slow': 'spin 12s linear infinite',
        'drift': 'drift 14s ease-in-out infinite',
      },
      keyframes: {
        orbFloat: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-30px) scale(1.05)' },
        },
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 0 0 rgba(0,194,255,0.4)' },
          '50%': { opacity: 0.8, boxShadow: '0 0 0 12px rgba(0,194,255,0)' },
        },
        pulseOcean: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.85 },
          '50%': { transform: 'scale(1.04)', opacity: 1 },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '33%': { transform: 'translate(20px, -30px)' },
          '66%': { transform: 'translate(-20px, 30px)' },
        },
      },

      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}
