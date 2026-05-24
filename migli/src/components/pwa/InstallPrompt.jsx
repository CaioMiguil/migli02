import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Download, Share, X, Plus } from 'lucide-react'
import { usePWA } from '@hooks/usePWA'
import { LogoMark } from '@components/brand/Logo'

const DISMISSED_KEY = 'migli.install.dismissed'

/**
 * Faixa de instalação discreta, mobile-first.
 *
 * Aparece bottom-anchored 8s após o primeiro paint, se:
 *   - PWA é instalável (Android/desktop), OU
 *   - usuário está em iOS Safari não-standalone
 *
 * Some por 30 dias se o usuário fechar.
 */
export default function InstallPrompt() {
  const { canInstall, installed, isIOS, install } = usePWA()
  const [show, setShow] = useState(false)
  const [iosOpen, setIosOpen] = useState(false)

  useEffect(() => {
    if (installed) return
    if (isDismissed()) return
    if (!canInstall && !isIOS) return
    const t = setTimeout(() => setShow(true), 8000)
    return () => clearTimeout(t)
  }, [canInstall, isIOS, installed])

  const dismiss = () => {
    setShow(false)
    setIosOpen(false)
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    } catch {
      /* noop */
    }
  }

  const handleInstall = async () => {
    if (isIOS && !canInstall) {
      setIosOpen(true)
      return
    }
    const r = await install()
    if (r.ok || r.outcome === 'dismissed') setShow(false)
  }

  if (installed) return null

  return (
    <>
      <AnimatePresence>
        {show && !iosOpen && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-3 z-[8500] md:inset-x-auto md:right-5 md:max-w-sm"
            style={{
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
            }}
          >
            <div className="relative overflow-hidden rounded-2xl border border-glass-border bg-ink-900/95 p-4 shadow-glow backdrop-blur-2xl">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(0,194,255,0.5), transparent)',
                }}
              />
              <button
                onClick={dismiss}
                aria-label="Fechar"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white"
              >
                <X size={14} />
              </button>

              <div className="flex items-start gap-3 pr-6">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl glass-aqua">
                  <LogoMark size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-bold">
                    Instale o MIGLI
                  </div>
                  <div className="mt-0.5 text-xs font-light leading-relaxed text-white/55">
                    {isIOS && !canInstall
                      ? 'Acesso rápido na sua tela inicial, modo tela cheia.'
                      : 'Tenha acesso rápido pelo seu dispositivo, sem abrir o navegador.'}
                  </div>
                  <button
                    onClick={handleInstall}
                    data-hover
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-aqua-400 px-4 py-1.5 text-xs font-bold tracking-wide text-ink-950 transition-all hover:bg-aqua-300 active:scale-95"
                  >
                    <Download size={12} strokeWidth={2.2} />
                    Instalar agora
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de instrução iOS */}
      <AnimatePresence>
        {iosOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-[9600] flex items-end justify-center bg-ink-950/85 px-4 pb-6 backdrop-blur-xl md:items-center md:pb-0"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-glass-border bg-ink-900/95 p-6 backdrop-blur-2xl"
            >
              <button
                onClick={dismiss}
                aria-label="Fechar"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/5 hover:text-white"
              >
                <X size={16} />
              </button>
              <div className="flex justify-center">
                <LogoMark size={40} animated />
              </div>
              <h3 className="mt-5 text-center font-display text-xl font-bold">
                Instalar no iPhone
              </h3>
              <p className="mt-2 text-center text-xs font-light text-white/55">
                Dois toques e o MIGLI vira app na sua tela inicial.
              </p>

              <div className="mt-6 space-y-3">
                <Step
                  num="1"
                  icon={Share}
                  text={
                    <>
                      Toque em <span className="text-aqua-300">Compartilhar</span> na barra inferior do Safari
                    </>
                  }
                />
                <Step
                  num="2"
                  icon={Plus}
                  text={
                    <>
                      Escolha{' '}
                      <span className="text-aqua-300">Adicionar à Tela de Início</span>
                    </>
                  }
                />
              </div>

              <button
                onClick={dismiss}
                className="mt-7 w-full rounded-full border border-white/10 bg-white/[0.04] py-2.5 text-xs font-medium text-white/65 transition-colors hover:bg-white/[0.07]"
              >
                Entendi
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Step({ num, icon: Icon, text }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-aqua-400/15 font-display text-xs font-bold text-aqua-300">
        {num}
      </div>
      <div className="flex flex-1 items-center gap-2 text-xs leading-relaxed text-white/80">
        <Icon size={14} className="flex-shrink-0 text-white/45" strokeWidth={1.6} />
        <span>{text}</span>
      </div>
    </div>
  )
}

function isDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY))
    if (!at) return false
    // 30 days
    return Date.now() - at < 1000 * 60 * 60 * 24 * 30
  } catch {
    return false
  }
}
