import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ChevronRight, X, Camera, Wand2, Share2, Eye } from 'lucide-react'
import { LogoMark } from '@components/brand/Logo'
import Button from '@components/ui/Button'

const SEEN_KEY = 'migli.broker.onboarded'

/**
 * Onboarding cinematográfico do corretor — exibido na 1ª visita ao
 * dashboard. Quatro telas em sequência:
 *
 *   1. Bem-vindo (com a marca)
 *   2. Capture: filme com o celular
 *   3. IA reconstrói automaticamente
 *   4. Compartilhe: link premium que vende
 *
 * Cada tela tem ilustração própria, copy curto e botão "Continuar".
 * Salva no localStorage para nunca aparecer de novo (até reset).
 */
export default function BrokerOnboarding({ open, onComplete }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (open) setStep(0)
  }, [open])

  const finish = () => {
    try {
      localStorage.setItem(SEEN_KEY, '1')
    } catch {
      /* noop */
    }
    onComplete?.()
  }

  const next = () => {
    if (step >= STEPS.length - 1) finish()
    else setStep(step + 1)
  }

  if (!open) return null
  const current = STEPS[step]

  return (
    <AnimatePresence>
      <motion.div
        key="ob-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9650] flex items-center justify-center bg-ink-950/95 px-5 backdrop-blur-2xl"
      >
        {/* Atmospheric glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[80vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(0,194,255,0.10), transparent 65%)',
            filter: 'blur(80px)',
          }}
        />

        <button
          onClick={finish}
          aria-label="Pular onboarding"
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <X size={18} />
        </button>

        <div className="relative w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <div className="mb-7 flex justify-center">
                {current.brand ? <LogoMark size={56} animated /> : <StepIllustration icon={current.icon} />}
              </div>

              <h2 className="font-display text-[clamp(28px,5vw,40px)] font-extrabold leading-tight tracking-[-0.02em]">
                {current.title}
              </h2>
              {current.titleAccent && (
                <h2 className="font-display text-[clamp(28px,5vw,40px)] font-extrabold leading-tight tracking-[-0.02em] gradient-text-aqua">
                  {current.titleAccent}
                </h2>
              )}

              <p className="mx-auto mt-5 max-w-xs text-sm font-light leading-relaxed text-white/55">
                {current.body}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="mt-12 flex justify-center gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                aria-label={`Ir para passo ${i + 1}`}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: i === step ? 24 : 6,
                  background: i === step ? '#00C2FF' : 'rgba(255,255,255,0.18)',
                }}
              />
            ))}
          </div>

          {/* CTA */}
          <div className="mt-7 flex flex-col items-center gap-3">
            <Button variant="primary" size="lg" onClick={next} className="min-w-[200px]">
              <span className="inline-flex items-center justify-center gap-1.5">
                {step === STEPS.length - 1 ? 'Vamos começar' : 'Continuar'}
                <ChevronRight size={14} strokeWidth={2.4} />
              </span>
            </Button>
            {step < STEPS.length - 1 && (
              <button
                onClick={finish}
                className="text-[11px] text-white/35 transition-colors hover:text-white/65"
              >
                Pular introdução
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

function StepIllustration({ icon: Icon }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative inline-flex h-20 w-20 items-center justify-center rounded-3xl glass-aqua"
    >
      <div
        aria-hidden
        className="absolute inset-0 rounded-3xl"
        style={{
          background:
            'radial-gradient(circle, rgba(0,194,255,0.15), transparent 70%)',
          filter: 'blur(12px)',
        }}
      />
      <Icon size={32} strokeWidth={1.5} className="relative text-aqua-300" />
    </motion.div>
  )
}

const STEPS = [
  {
    brand: true,
    title: 'Bem-vindo ao',
    titleAccent: 'MIGLI.',
    body: 'A primeira plataforma brasileira que transforma imóveis em experiências cinematográficas em 3D.',
  },
  {
    icon: Camera,
    title: 'Capture com',
    titleAccent: 'o celular.',
    body: 'Filme um vídeo lento do imóvel. Sem equipamento profissional, sem complicação.',
  },
  {
    icon: Wand2,
    title: 'A IA faz',
    titleAccent: 'a mágica.',
    body: 'Nossa IA reconstrói tudo em 3D fotorrealista em minutos. Você fica livre para vender.',
  },
  {
    icon: Share2,
    title: 'Compartilhe',
    titleAccent: 'e impressione.',
    body: 'Cada imóvel ganha um link premium. Seu cliente abre no celular, explora, e se apaixona.',
  },
]

export function hasSeenBrokerOnboarding() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return true
  }
}

// Avoid unused-import lint
void Eye
