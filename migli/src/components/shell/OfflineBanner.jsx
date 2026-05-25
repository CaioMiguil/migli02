import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { useOnlineStatus } from '@hooks/useOnlineStatus'

/**
 * Banner discreto exibido no topo quando o app perde conexão.
 * Funcionalidades que não dependem de rede (visualização local, captura
 * local) continuam funcionando.
 */
export default function OfflineBanner() {
  const online = useOnlineStatus()
  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed left-1/2 z-[9800] -translate-x-1/2"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-500/15 backdrop-blur-md px-4 py-2 shadow-elevated">
            <WifiOff size={14} className="text-amber-300" strokeWidth={2} />
            <span className="text-xs font-medium text-amber-100">
              Sem conexão · alguns recursos ficam indisponíveis
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
