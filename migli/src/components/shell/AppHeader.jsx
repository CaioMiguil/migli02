import { motion } from 'framer-motion'
import { LogoMark } from '@components/brand/Logo'

export default function AppHeader({ title, right, transparent = false, children }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-30 ${
        transparent
          ? 'bg-transparent'
          : 'border-b border-white/[0.06] bg-ink-950/75 backdrop-blur-xl'
      }`}
    >
      <div className="flex items-center justify-between px-4 pt-safe pb-3 md:px-6">
        <div className="flex items-center gap-2.5">
          {title ? (
            <div className="font-display text-base font-bold tracking-tight text-white">
              {title}
            </div>
          ) : (
            <>
              <LogoMark size={26} />
              <span className="font-display text-lg font-extrabold tracking-tightest gradient-text-aqua">
                Migli
              </span>
            </>
          )}
        </div>
        {right && <div className="flex items-center gap-2">{right}</div>}
      </div>
      {children}
    </motion.header>
  )
}
