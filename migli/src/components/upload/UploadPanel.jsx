import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Layers } from 'lucide-react'
import { useState } from 'react'
import { useUploadQueue } from '@hooks/useUploadQueue'
import { UploadStatus } from '@lib/upload/uploadQueue'
import UploadItemCard from './UploadItemCard'

/**
 * Floating upload panel — sticks to the bottom-right of the viewport whenever
 * there are active uploads. Collapses to a minimized pill.
 *
 * Hidden when the queue is empty.
 */
export default function UploadPanel() {
  const { items, cancel, remove } = useUploadQueue()
  const [collapsed, setCollapsed] = useState(false)

  if (items.length === 0) return null

  const active = items.filter(
    (i) =>
      i.status === UploadStatus.UPLOADING ||
      i.status === UploadStatus.PROCESSING ||
      i.status === UploadStatus.QUEUED,
  ).length
  const done = items.filter((i) => i.status === UploadStatus.COMPLETED).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed bottom-5 right-5 z-[8000] w-[min(380px,calc(100vw-40px))]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="overflow-hidden rounded-2xl border border-glass-border bg-ink-900/95 shadow-glow backdrop-blur-2xl">
        {/* Header */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          data-hover
          className="flex w-full items-center justify-between border-b border-white/[0.04] px-4 py-3 text-left transition-colors hover:bg-white/[0.02]"
        >
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-7 w-7 items-center justify-center rounded-lg glass-aqua">
              <Layers size={13} className="text-aqua-300" />
              {active > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-1 -top-1 h-2 w-2 animate-pulse-glow rounded-full bg-aqua-400"
                />
              )}
            </div>
            <div>
              <div className="text-sm font-semibold text-white/90">
                {active > 0
                  ? `Processando ${active} tour${active > 1 ? 's' : ''}`
                  : `${done} tour${done > 1 ? 's' : ''} prontos`}
              </div>
              <div className="text-[10px] tracking-wider2 text-white/35">
                MIGLI · FILA DE PROCESSAMENTO
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronDown size={16} className="text-white/40" />
          </motion.div>
        </button>

        {/* Items */}
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto p-3">
                <AnimatePresence>
                  {items.map((item) => (
                    <UploadItemCard
                      key={item.id}
                      item={item}
                      onCancel={cancel}
                      onRemove={remove}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
