import { AnimatePresence, motion } from 'framer-motion'
import { Mail, X, CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { sendMagicLink } from '@lib/cloud/authService'
import { LogoMark } from '@components/brand/Logo'

/**
 * LoginModal — magic-link flow em tema light.
 * Três estados: form → sending → sent.
 */
export default function LoginModal({ open, onClose }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState('form')
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
      setState('form')
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
          className="fixed inset-0 z-[9700] flex items-center justify-center bg-black/55 px-5 backdrop-blur-xl"
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
            className="card relative w-full max-w-md overflow-hidden p-8"
            style={{ boxShadow: '0 24px 80px rgba(15, 23, 42, 0.18)' }}
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
              onClick={() => {
                onClose?.()
                reset()
              }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-ink-800 hover:text-white/75"
              aria-label="Fechar"
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
                    <h2 className="mt-6 font-display text-2xl font-extrabold tracking-tighter text-white">
                      Entre no MIGLI
                    </h2>
                    <p className="mt-2 text-sm font-light text-white/65">
                      Sem senha. Enviamos um link mágico para o seu e-mail.
                    </p>

                    <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
                      <div className="relative">
                        <Mail
                          size={16}
                          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
                        />
                        <input
                          type="email"
                          autoFocus
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com.br"
                          disabled={state === 'sending'}
                          className="w-full rounded-full border border-white/15 bg-ink-900 px-4 py-3.5 pl-11 text-sm text-white placeholder-white/35 transition-all focus:border-aqua-400/60 focus:bg-ink-900 focus:outline-none focus:ring-4 focus:ring-aqua-400/20 disabled:opacity-50"
                        />
                      </div>

                      {error && (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
                          {error}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={state === 'sending'}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 font-display text-sm font-semibold tracking-tight text-white transition-all active:scale-95 disabled:opacity-50"
                        style={{
                          background:
                            'linear-gradient(135deg, #0E8AC4 0%, #0871A6 100%)',
                          boxShadow: '0 8px 24px rgba(14, 138, 196, 0.28)',
                        }}
                      >
                        {state === 'sending' ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Enviando…
                          </>
                        ) : (
                          'Enviar link mágico'
                        )}
                      </button>
                    </form>

                    <div className="mt-5 text-[11px] text-white/40">
                      Ao continuar, você concorda com nossos{' '}
                      <span className="text-aqua-300">Termos</span> e{' '}
                      <span className="text-aqua-300">Privacidade</span>.
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
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-aqua-400/15">
                        <CheckCircle2 size={26} className="text-aqua-300" />
                      </div>
                    </div>
                    <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tighter text-white">
                      Link enviado ✦
                    </h2>
                    <p className="mt-3 text-sm font-light leading-relaxed text-white/65">
                      Verifique a caixa de entrada de{' '}
                      <span className="font-semibold text-white">{email}</span>. O
                      link é válido por 60 minutos.
                    </p>
                    <div className="mt-7 text-[11px] text-white/40">
                      Não recebeu? Olhe a pasta de spam ou{' '}
                      <button
                        onClick={reset}
                        className="font-medium text-aqua-300 underline-offset-2 hover:underline"
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
