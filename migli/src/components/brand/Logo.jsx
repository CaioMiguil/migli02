import { motion } from 'framer-motion'

/**
 * MIGLI · Official Logo System
 * ---------------------------------------------------------------
 * Three variants in one component to keep the brand consistent everywhere:
 *   - `mark`     → the fluid 'M' symbol only (square, icon-like)
 *   - `wordmark` → the full word "Migli" in the brand script
 *   - `lockup`   → mark + wordmark side by side (nav, splash, hero)
 *
 * The mark is inline SVG so it can:
 *   - animate (draw-on, glow pulse, fluid flow)
 *   - inherit color via currentColor
 *   - scale crisply at any size
 *
 * The wordmark is the official rendered asset from /public/brand/.
 * For motion variants pass `animated`. For static UI pass nothing.
 */

const MARK_PATH = `M 12 78
       C 12 55, 22 28, 35 28
       C 44 28, 48 42, 50 56
       C 52 42, 56 28, 65 28
       C 78 28, 88 55, 88 78`

export default function Logo({
  variant = 'lockup',
  size = 'md',
  animated = false,
  withTagline = false,
  className = '',
}) {
  const sizes = {
    xs: { mark: 20, word: 60, gap: 8 },
    sm: { mark: 28, word: 88, gap: 10 },
    md: { mark: 40, word: 124, gap: 12 },
    lg: { mark: 56, word: 172, gap: 16 },
    xl: { mark: 96, word: 300, gap: 24 },
    hero: { mark: 140, word: 440, gap: 28 },
  }
  const s = sizes[size] ?? sizes.md

  if (variant === 'mark') {
    return <LogoMark size={s.mark} animated={animated} className={className} />
  }

  if (variant === 'wordmark') {
    return <LogoWordmark width={s.word} animated={animated} className={className} />
  }

  // lockup — defaults to compact (text wordmark next to mark) which works
  // crisply at any size. Pass variant="lockup-photo" for the photoreal
  // wordmark image (best at large sizes: hero, splash, marketing).
  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap: s.gap }}
    >
      <LogoMark size={s.mark} animated={animated} />
      <div className="flex flex-col leading-none">
        <div
          className="font-display font-extrabold tracking-tight gradient-text"
          style={{
            fontSize: s.mark * 0.72,
            letterSpacing: '-0.02em',
          }}
        >
          Migli
        </div>
        {withTagline && (
          <div
            className="mt-1 font-sans uppercase tracking-[0.18em] text-aqua-300/70"
            style={{ fontSize: s.mark * 0.18 }}
          >
            AI-powered real estate
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================
   Photoreal lockup — uses the water-rendered wordmark image
   Best for hero, splash, marketing materials at large sizes.
   ============================================================ */
export function PhotoLockup({ width = 320, animated = false, className = '' }) {
  return <LogoWordmark width={width} animated={animated} className={className} />
}

/* ============================================================
   Fluid 'M' mark — animated SVG
   ============================================================ */
export function LogoMark({ size = 40, animated = false, className = '' }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      initial={animated ? { opacity: 0, scale: 0.9 } : false}
      animate={animated ? { opacity: 1, scale: 1 } : false}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      <defs>
        <linearGradient id={`g-${size}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="50%" stopColor="#00C2FF" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <filter id={`glow-${size}`}>
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Animated wave-draw of the 'M' silhouette */}
      <motion.path
        d={MARK_PATH}
        stroke={`url(#g-${size})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#glow-${size})`}
        initial={animated ? { pathLength: 0, opacity: 0 } : false}
        animate={animated ? { pathLength: 1, opacity: 1 } : false}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      />

      {/* Floating droplet */}
      <motion.circle
        cx="50"
        cy="14"
        r="3.4"
        fill={`url(#g-${size})`}
        filter={`url(#glow-${size})`}
        animate={
          animated
            ? { cy: [14, 11, 14], opacity: [0.9, 1, 0.9] }
            : undefined
        }
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Splash accents */}
      <circle cx="22" cy="22" r="1.2" fill="#7DD3FC" opacity="0.75" />
      <circle cx="78" cy="20" r="0.9" fill="#7DD3FC" opacity="0.65" />
      <circle cx="86" cy="36" r="0.7" fill="#7DD3FC" opacity="0.55" />
    </motion.svg>
  )
}

/* ============================================================
   Wordmark — official rendered asset with optional shimmer
   ============================================================ */
export function LogoWordmark({ width = 124, animated = false, className = '' }) {
  return (
    <motion.div
      className={`relative inline-block ${className}`}
      style={{ width }}
      initial={animated ? { opacity: 0, y: 8 } : false}
      animate={animated ? { opacity: 1, y: 0 } : false}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
    >
      <img
        src="/brand/migli-wordmark.png"
        alt="MIGLI"
        className="block w-full select-none"
        draggable={false}
        style={{
          // The source PNG has a dark background — drop it out cleanly with screen blending
          // so the wordmark glows on top of any UI surface.
          mixBlendMode: 'screen',
        }}
      />
      {animated && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.18) 50%, transparent 70%)',
            mixBlendMode: 'overlay',
          }}
          initial={{ x: '-100%' }}
          animate={{ x: '120%' }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            repeatDelay: 4,
            ease: 'easeInOut',
          }}
        />
      )}
    </motion.div>
  )
}
