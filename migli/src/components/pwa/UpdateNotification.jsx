import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Sparkles, RefreshCw } from 'lucide-react'
import { usePWA } from '@hooks/usePWA'

/**
 * Toast no topo quando há nova versão do app pronta. Auto-dismiss
 * silencioso após 30s se ignorado.
 *
 * Em desenvolvimento (sem build), `needsRefresh` nunca dispara
 * porque o virtual import falha silenciosamente — comportamento
 * desejado para não atrapalhar o dev loop.
 */
export default function UpdateNotification() {
  const { needsRefresh, updateApp } = usePWA()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (needsRefresh) {
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 30000)
      return () => clearTimeout(t)
    }
  }, [needsRefresh])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-1/2 z-[9800] -translate-x-1/2"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 76px)' }}
        >
          <div className="flex items-center gap-3 rounded-full border border-aqua-400/30 bg-ink-900/95 px-5 py-2.5 shadow-glow backdrop-blur-2xl">
            <Sparkles size={14} className="text-aqua-300" />
            <span className="text-xs font-medium text-white/85">
              Nova versão do MIGLI disponível
            </span>
            <button
              onClick={updateApp}
              data-hover
              className="flex items-center gap-1.5 rounded-full bg-aqua-400 px-3 py-1 text-[11px] font-bold tracking-wide text-ink-950 transition-all hover:bg-aqua-300 active:scale-95"
            >
              <RefreshCw size={10} strokeWidth={2.5} />
              Atualizar
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
