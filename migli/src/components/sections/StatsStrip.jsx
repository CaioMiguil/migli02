import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'
import { STATS } from '@lib/constants'
import { useCountUp } from '@hooks/useCountUp'
import { fadeUp, staggerContainer } from '@lib/motion'

function StatItem({ value, suffix, label, active }) {
  const v = useCountUp(value, { active, duration: 1600 })
  return (
    <motion.div variants={fadeUp} className="text-center">
      <div className="font-display font-bold text-3xl md:text-4xl gradient-text">
        {v.toLocaleString('pt-BR')}
        {suffix}
      </div>
      <div className="mt-1.5 text-xs tracking-wider2 text-white/40">{label}</div>
    </motion.div>
  )
}

export default function StatsStrip() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })

  return (
    <section
      ref={ref}
      className="border-y border-glass-border glass-aqua px-6 py-7 md:py-8"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate={inView ? 'show' : 'hidden'}
        className="mx-auto flex max-w-5xl flex-wrap justify-center gap-10 md:gap-20"
      >
        {STATS.map((s) => (
          <StatItem
            key={s.label}
            value={s.value}
            suffix={s.suffix}
            label={s.label.toUpperCase()}
            active={inView}
          />
        ))}
      </motion.div>
    </section>
  )
}
