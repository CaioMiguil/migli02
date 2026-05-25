import { AnimatePresence, motion } from 'framer-motion'

/**
 * AppShell — container do app mobile.
 *
 * Layout:
 *   ┌──────────────────┐  ← header (sticky)
 *   │                  │
 *   │   children       │  ← scrollable, padding-bottom para tab bar
 *   │                  │
 *   ├──────────────────┤  ← tab bar (fixed)
 *   │  ⊙  ⊙  ⊙  ⊙  ⊙  │
 *   └──────────────────┘
 *
 * Children recebem `key` para animar transição entre tabs.
 */
export default function AppShell({ children, tabKey }) {
  return (
    <div className="min-h-screen bg-paper-0 text-ink-900">
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
