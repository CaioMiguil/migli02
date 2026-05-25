import { motion } from 'framer-motion'
import { LogoMark } from './Logo'

/**
 * Subtle ambient watermark — used as a corner accent on the 3D viewer,
 * capture screens, and immersive panels. Floats gently to feel alive.
 */
export default function LogoWatermark({
  position = 'bottom-right',
  size = 28,
  opacity = 0.35,
}) {
  const positions = {
    'top-left': 'top-5 left-5',
    'top-right': 'top-5 right-5',
    'bottom-left': 'bottom-5 left-5',
    'bottom-right': 'bottom-5 right-5',
  }

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute ${positions[position]}`}
      style={{ opacity }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
    >
      <LogoMark size={size} />
    </motion.div>
  )
}
