import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'

/**
 * Onboarding coach for first-time captures. Walks through 3 tips with
 * cinematic fade transitions. Dismisses after the last tip or on tap.
 */
const TIPS = [
  {
    title: 'Movimente devagar',
    body: 'Caminhe lentamente pelo cômodo. Movimentos suaves geram reconstruções 3D mais precisas.',
  },
  {
    title: 'Cubra todos os ângulos',
    body: 'Filme paredes, cantos e o chão. Quanto mais perspectivas, mais imersivo o tour.',
  },
  {
    title: 'Boa iluminação',
    body: 'Abra cortinas e acenda as luzes. A IA precisa ver os detalhes para renderizar o splat.',
  },
]

export default function OnboardingOverlay({ onComplete }) {
  const [index, setIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  // Auto-advance through tips
  useEffect(() => {
    if (!visible) return
    const t = setTimeout(() => {
      if (index < TIPS.length - 1) setIndex(index + 1)
      else dismiss()
    }, 3200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, visible])

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => onComplete?.(), 400)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
          className="absolute inset-x-0 top-[18%] z-20 flex justify-center px-6"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0, filter: 'blur(8px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -20, opacity: 0, filter: 'blur(8px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="glass-aqua relative max-w-xs rounded-2xl px-6 py-5 text-center"
            >
              <Sparkles size={18} className="mx-auto mb-3 text-aqua-300" />
              <div className="font-display text-base font-bold">
                {TIPS[index].title}
              </div>
              <div className="mt-2 text-xs font-light leading-relaxed text-white/65">
                {TIPS[index].body}
              </div>

              {/* Progress dots */}
              <div className="mt-4 flex justify-center gap-1.5">
                {TIPS.map((_, i) => (
                  <span
                    key={i}
                    className="h-1 rounded-full transition-all duration-500"
                    style={{
                      width: i === index ? 18 : 6,
                      background:
                        i === index ? '#00C2FF' : 'rgba(255,255,255,0.25)',
                    }}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
