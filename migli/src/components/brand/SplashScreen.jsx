import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LogoMark, PhotoLockup } from './Logo'

/**
 * Premium splash screen — shown on first paint until the app is ready.
 *
 * Sequence:
 *   0.0s   Backdrop fades in
 *   0.1s   Mark draws on, droplet bobs
 *   0.6s   Photoreal wordmark fades up under the mark
 *   2.2s   Whole splash dissolves with a soft blur
 */
export default function SplashScreen({ duration = 2400 }) {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShow(false), duration)
    return () => clearTimeout(t)
  }, [duration])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(14px)' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-paper-0"
        >
          {/* Atmospheric backdrop */}
          <motion.div
            className="absolute inset-0 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2 }}
          >
            <div
              className="absolute left-1/2 top-1/2 h-[80vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                background:
                  'radial-gradient(circle, rgba(0,194,255,0.18), transparent 65%)',
                filter: 'blur(60px)',
              }}
            />
          </motion.div>

          <div className="relative flex w-full max-w-md flex-col items-center px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <LogoMark size={68} animated />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 w-full"
            >
              <PhotoLockup width={360} animated />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
