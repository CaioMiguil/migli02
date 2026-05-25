import { motion } from 'framer-motion'

/**
 * Floating annotation card overlaid on the 3D viewer.
 * Slowly bobs to feel alive.
 */
export default function FloatingInfoCard({
  eyebrow,
  title,
  caption,
  className = '',
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{
        opacity: 1,
        y: [0, -6, 0],
      }}
      transition={{
        opacity: { duration: 0.8, delay },
        y: { duration: 4, ease: 'easeInOut', repeat: Infinity, delay },
      }}
      className={`glass-aqua absolute min-w-[140px] rounded-2xl px-5 py-4 ${className}`}
    >
      <div className="text-[10px] tracking-widest2 text-aqua-300 mb-1.5">
        {eyebrow}
      </div>
      <div className="font-display text-lg font-bold leading-tight">
        {title}
      </div>
      {caption && (
        <div className="mt-1 text-xs text-white/45">{caption}</div>
      )}
    </motion.div>
  )
}
