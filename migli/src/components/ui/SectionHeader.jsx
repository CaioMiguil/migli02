import { motion } from 'framer-motion'
import { staggerContainer, fadeUp } from '@lib/motion'

/**
 * Eyebrow + headline + sub for consistent section openings.
 */
export default function SectionHeader({ eyebrow, title, sub, align = 'left' }) {
  const alignment =
    align === 'center' ? 'items-center text-center' : 'items-start text-left'

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.3 }}
      className={`flex flex-col ${alignment} max-w-2xl ${align === 'center' ? 'mx-auto' : ''}`}
    >
      {eyebrow && (
        <motion.div variants={fadeUp} className="section-label mb-5">
          {eyebrow}
        </motion.div>
      )}
      <motion.h2
        variants={fadeUp}
        className="font-display font-bold leading-[1.05] tracking-tight text-balance text-4xl md:text-5xl lg:text-6xl"
      >
        {title}
      </motion.h2>
      {sub && (
        <motion.p
          variants={fadeUp}
          className="mt-5 text-base md:text-lg font-light leading-relaxed text-white/45 max-w-xl"
        >
          {sub}
        </motion.p>
      )}
    </motion.div>
  )
}
