/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces principais — off-white system
        paper: {
          0: '#FAFBFD',
          50: '#FFFFFF',
          100: '#F4F7FB',
          200: '#E8EEF5',
          300: '#D6DEE8',
        },

        // Texto + overlays dark (camera/viewer/scan/immersive)
        ink: {
          950: '#060D1A',  // overlay backgrounds (camera, viewer, scan)
          900: '#0B1320',  // títulos
          800: '#1A2333',
          700: '#2C374B',  // corpo
          600: '#475061',
          500: '#6B7280',  // secundário
          400: '#9CA3AF',
          300: '#C9CFD8',  // placeholder
        },

        // Brand principal
        ocean: {
          50: '#EFF8FD',
          100: '#DCEFFA',
          200: '#B3DEF3',
          300: '#7BC5E8',
          400: '#3FA8DA',
          500: '#0E8AC4',
          600: '#0871A6',
          700: '#0A5C83',
          800: '#103D5A',
          900: '#0A1E2F',
        },

        // Accent — preserva tons antigos pra glow nos overlays escuros
        aqua: {
          50: '#E0F8FF',
          100: '#B8EBFF',
          200: '#7DD3FC',
          300: '#38BDF8',
          400: '#00C2FF',
          500: '#0EA5E9',
          600: '#0284C7',
        },

        // Tom transparente que componentes escuros referenciam
        'glass-border': 'rgba(125, 211, 252, 0.16)',
      },

      fontFamily: {
        display: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['Montserrat', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },

      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
        tight: '-0.015em',
        normal2: '-0.005em',
        wider2: '0.08em',
        widest2: '0.14em',
        widest3: '0.22em',
      },

      lineHeight: {
        snug2: '1.15',
        relaxed2: '1.65',
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        card: '0 2px 8px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        elevated: '0 8px 24px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04)',
        glow: '0 0 40px rgba(14, 138, 196, 0.18)',
        'glow-lg': '0 0 80px rgba(14, 138, 196, 0.22)',
        ocean: '0 8px 24px rgba(14, 138, 196, 0.22)',
        'ocean-lg': '0 14px 40px rgba(14, 138, 196, 0.28)',
        'tab-bar': '0 -2px 16px rgba(15, 23, 42, 0.06)',
      },

      animation: {
        'orb-float': 'orbFloat 8s ease-in-out infinite',
        'fade-up': 'fadeUp 0.7s ease both',
        'pulse-glow': 'pulseGlow 2s infinite',
        'pulse-ocean': 'pulseOcean 2.4s ease-in-out infinite',
        'wave': 'wave 6s ease-in-out infinite',
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
          '0%, 100%': { opacity: 1, boxShadow: '0 0 0 0 rgba(14,138,196,0.35)' },
          '50%': { opacity: 0.8, boxShadow: '0 0 0 8px rgba(14,138,196,0)' },
        },
        pulseOcean: {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.85 },
          '50%': { transform: 'scale(1.04)', opacity: 1 },
        },
        wave: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
