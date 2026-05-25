import { motion } from 'framer-motion'
import * as Icons from 'lucide-react'
import { fadeUp } from '@lib/motion'

/**
 * Feature card with hover lift and icon. Icon name = key in lucide-react.
 */
export default function FeatureCard({ icon, title, desc }) {
  const Icon = Icons[icon] || Icons.Sparkles

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.05] bg-white/[0.025] p-8 transition-colors duration-300 hover:border-glass-border"
      data-hover
    >
      {/* Hover glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: 'radial-gradient(circle, rgba(0,194,255,0.15), transparent 70%)' }}
      />

      <div className="relative">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl glass-aqua">
          <Icon size={22} strokeWidth={1.5} className="text-aqua-300" />
        </div>
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <p className="mt-2.5 text-sm font-light leading-relaxed text-white/45">
          {desc}
        </p>
      </div>
    </motion.div>
  )
}
