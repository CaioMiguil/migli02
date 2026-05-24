import { AnimatePresence, motion } from 'framer-motion'
import { Mail, X, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { sendMagicLink } from '@lib/cloud/authService'
import { LogoMark } from '@components/brand/Logo'
import Button from '@components/ui/Button'

/**
 * Modal de login por magic link.
 * Três estados: form → sending → sent.
 */
export default function LoginModal({ open, onClose }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('form') // form | sending | sent | error
  const [error, setError] = useState(null)

  const reset = () => {
    setEmail('')
    setState('form')
    setError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Informe um e-mail válido')
      return
    }
    setState('sending')
    setError(null)
    try {
      await sendMagicLink(email)
      setState('sent')
    } catch (err) {
      setError(err.message || 'Não foi possível enviar o link')
      setState('error')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="login-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9700] flex items-center justify-center bg-ink-950/85 px-6 backdrop-blur-xl"
          onClick={() => {
            onClose?.()
            reset()
          }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-glass-border bg-ink-900/95 p-8 backdrop-blur-2xl"
          >
            {/* Top accent line */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(0,194,255,0.5), transparent)',
              }}
            />

            <button
              onClick={() => {
                onClose?.()
                reset()
              }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:bg-white/5 hover:text-white"
              aria-label="Fechar"
              data-hover
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center">
              <LogoMark size={42} animated />

              <AnimatePresence mode="wait">
                {state !== 'sent' ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full"
                  >
                    <h2 className="mt-6 font-display text-2xl font-bold">
                      Entre no MIGLI
                    </h2>
                    <p className="mt-2 text-sm font-light text-white/55">
                      Sem senha. Enviamos um link mágico para o seu e-mail.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
                      <div className="relative">
                        <Mail
                          size={16}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                        />
                        <input
                          type="email"
                          autoFocus
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com.br"
                          disabled={state === 'sending'}
                          className="w-full rounded-full border border-white/10 bg-white/[0.03] px-4 py-3.5 pl-11 text-sm text-white placeholder-white/30 transition-all focus:border-aqua-400 focus:bg-white/[0.05] focus:outline-none disabled:opacity-50"
                        />
                      </div>

                      {error && (
                        <div className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-xs text-red-200/80">
                          {error}
                        </div>
                      )}

                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={state === 'sending'}
                        className="mt-2 w-full"
                      >
                        {state === 'sending' ? (
                          <span className="flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" />
                            Enviando…
                          </span>
                        ) : (
                          'Enviar link mágico'
                        )}
                      </Button>
                    </form>

                    <div className="mt-5 text-[11px] text-white/30">
                      Ao continuar, você concorda com nossos{' '}
                      <span className="text-aqua-300/70">Termos</span> e{' '}
                      <span className="text-aqua-300/70">Privacidade</span>.
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full"
                  >
                    <div className="mt-6 flex justify-center">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl glass-aqua">
                        <CheckCircle2 size={26} className="text-aqua-300" />
                      </div>
                    </div>
                    <h2 className="mt-5 font-display text-2xl font-bold">
                      Link enviado ✦
                    </h2>
                    <p className="mt-3 text-sm font-light leading-relaxed text-white/55">
                      Verifique a caixa de entrada de{' '}
                      <span className="text-white">{email}</span>. O link é
                      válido por 60 minutos.
                    </p>
                    <div className="mt-7 text-[11px] text-white/30">
                      Não recebeu? Olhe a pasta de spam ou{' '}
                      <button
                        onClick={reset}
                        className="text-aqua-300 underline-offset-2 hover:underline"
                      >
                        tente outro e-mail
                      </button>
                      .
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
