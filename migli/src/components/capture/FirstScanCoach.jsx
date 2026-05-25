import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ChevronRight, ChevronLeft, ChevronUp, X } from 'lucide-react'

const SEEN_KEY = 'migli.scan.coachSeen'

const STEPS = [
  {
    Icon: ChevronUp,
    title: 'Aponte pra parede',
    body: 'Comece com a câmera mirando a parede mais distante do cômodo.',
  },
  {
    Icon: ChevronRight,
    title: 'Gire devagar 360°',
    body: 'Mantenha o ritmo lento e contínuo. A IA acompanha o movimento.',
  },
  {
    Icon: ChevronLeft,
    title: 'Cobrir cada canto',
    body: 'Mire um pouco pra cima, pra baixo, e preencha os cantos do cômodo.',
  },
]

/**
 * Coach overlay mostrado na 1ª vez que o usuário inicia um scan.
 * Discreto, não bloqueia interação. Some sozinho após 8s ou no primeiro
 * toque/movimento significativo.
 *
 * Persiste em localStorage — não reaparece pra esse usuário.
 */
export default function FirstScanCoach({ active, movementDetected }) {
  const [step, setStep] = useState(0)
  const [visible, setVisible] = useState(() => {
    try {
      return !localStorage.getItem(SEEN_KEY)
    } catch {
      return true
    }
  })

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* noop */
    }
  }

  // Avança os passos
  useEffect(() => {
    if (!visible || !active) return
    const timer = setTimeout(() => {
      if (step < STEPS.length - 1) {
        setStep(step + 1)
      } else {
        dismiss()
      }
    }, 3500)
    return () => clearTimeout(timer)
  }, [step, visible, active])

  // Some sozinho ao detectar movimento real (yaw delta > 15°)
  useEffect(() => {
    if (visible && active && movementDetected) {
      const t = setTimeout(dismiss, 800)
      return () => clearTimeout(t)
    }
  }, [visible, active, movementDetected])

  if (!visible || !active) return null
  const current = STEPS[step]

  return (
    <AnimatePresence>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 12, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute inset-x-0 top-[55%] z-30 flex flex-col items-center px-6"
      >
        <div className="flex items-center gap-3 rounded-full border border-aqua-400/30 bg-black/65 px-5 py-3 backdrop-blur-md">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-aqua-400/15">
            <current.Icon size={14} strokeWidth={2.4} className="text-aqua-300" />
          </div>
          <div>
            <div className="text-[12px] font-semibold tracking-tight text-white">
              {current.title}
            </div>
            <div className="mt-0.5 text-[10px] font-light text-white/70">
              {current.body}
            </div>
          </div>
        </div>
        {/* Dots */}
        <div className="mt-3 flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full transition-all"
              style={{
                width: i === step ? 16 : 4,
                background: i === step ? '#00C2FF' : 'rgba(255,255,255,0.25)',
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// Suppress unused-import warning for X (kept for future close button)
void X
