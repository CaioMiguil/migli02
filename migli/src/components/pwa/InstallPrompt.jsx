import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Download, Share, X, Plus } from 'lucide-react'
import { usePWA } from '@hooks/usePWA'
import { LogoMark } from '@components/brand/Logo'

const DISMISSED_KEY = 'migli.install.dismissed'

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
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)', // acima do tab bar
            }}
          >
            <div
              className="card relative overflow-hidden p-4"
              style={{ boxShadow: '0 14px 40px rgba(15, 23, 42, 0.15)' }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, #0E8AC4, transparent)',
                }}
              />
              <button
                onClick={dismiss}
                aria-label="Fechar"
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-paper-100 hover:text-ink-700"
              >
                <X size={14} />
              </button>

              <div className="flex items-start gap-3 pr-6">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ocean-100">
                  <LogoMark size={22} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-bold tracking-tight text-ink-900">
                    Instale o MIGLI
                  </div>
                  <div className="mt-0.5 text-xs font-light leading-relaxed text-ink-600">
                    {isIOS && !canInstall
                      ? 'Acesso rápido na sua tela inicial.'
                      : 'Acesso rápido pelo seu dispositivo.'}
                  </div>
                  <button
                    onClick={handleInstall}
                    data-hover
                    className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-ocean-500 px-4 py-1.5 text-xs font-semibold text-white transition-all hover:bg-ocean-600 active:scale-95"
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

      <AnimatePresence>
        {iosOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-[9600] flex items-end justify-center bg-ink-900/30 px-4 pb-6 backdrop-blur-xl md:items-center md:pb-0"
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="card relative w-full max-w-sm overflow-hidden p-6"
            >
              <button
                onClick={dismiss}
                aria-label="Fechar"
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-ink-400 hover:bg-paper-100 hover:text-ink-700"
              >
                <X size={16} />
              </button>
              <div className="flex justify-center">
                <LogoMark size={40} animated />
              </div>
              <h3 className="mt-5 text-center font-display text-xl font-extrabold tracking-tighter text-ink-900">
                Instalar no iPhone
              </h3>
              <p className="mt-2 text-center text-xs font-light text-ink-600">
                Dois toques e o MIGLI vira app na sua tela inicial.
              </p>

              <div className="mt-6 space-y-3">
                <Step
                  num="1"
                  icon={Share}
                  text={
                    <>
                      Toque em{' '}
                      <span className="font-semibold text-ocean-700">
                        Compartilhar
                      </span>{' '}
                      na barra inferior do Safari
                    </>
                  }
                />
                <Step
                  num="2"
                  icon={Plus}
                  text={
                    <>
                      Escolha{' '}
                      <span className="font-semibold text-ocean-700">
                        Adicionar à Tela de Início
                      </span>
                    </>
                  }
                />
              </div>

              <button
                onClick={dismiss}
                className="mt-7 w-full rounded-full border border-paper-300 bg-paper-50 py-2.5 text-xs font-medium text-ink-700 transition-colors hover:bg-paper-100"
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
    <div className="flex items-start gap-3 rounded-2xl border border-paper-200 bg-paper-100 px-4 py-3">
      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100 font-display text-xs font-bold text-ocean-700">
        {num}
      </div>
      <div className="flex flex-1 items-center gap-2 text-xs leading-relaxed text-ink-700">
        <Icon size={14} className="flex-shrink-0 text-ink-400" strokeWidth={1.6} />
        <span>{text}</span>
      </div>
    </div>
  )
}

function isDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISSED_KEY))
    if (!at) return false
    return Date.now() - at < 1000 * 60 * 60 * 24 * 30
  } catch {
    return false
  }
}
