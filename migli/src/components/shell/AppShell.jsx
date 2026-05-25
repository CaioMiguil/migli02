import { AnimatePresence, motion } from 'framer-motion'

export default function AppShell({ children, tabKey }) {
  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <main className="relative pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={tabKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
