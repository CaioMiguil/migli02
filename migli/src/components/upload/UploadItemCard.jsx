import { motion } from 'framer-motion'
import { CheckCircle2, X, AlertCircle, FileVideo, Loader2 } from 'lucide-react'
import { UploadStatus, STAGE_LABELS, formatBytes } from '@lib/upload/uploadQueue'

/**
 * One row in the upload panel.
 * Animates through 3 visual states: uploading → processing → done.
 */
export default function UploadItemCard({ item, onCancel, onRemove }) {
  const isActive =
    item.status === UploadStatus.UPLOADING ||
    item.status === UploadStatus.PROCESSING
  const isDone = item.status === UploadStatus.COMPLETED
  const isFailed = item.status === UploadStatus.FAILED

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="glass relative overflow-hidden rounded-2xl p-4"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl glass-aqua">
          {isDone ? (
            <CheckCircle2 size={18} className="text-aqua-300" />
          ) : isFailed ? (
            <AlertCircle size={18} className="text-red-400" />
          ) : (
            <FileVideo size={18} className="text-aqua-300" />
          )}
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate text-sm font-medium text-white/90">
              {item.name}
            </div>
            <button
              onClick={() => (isActive ? onCancel(item.id) : onRemove(item.id))}
              data-hover
              className="text-white/40 transition-colors hover:text-white/80"
              aria-label={isActive ? 'Cancelar' : 'Remover'}
            >
              <X size={14} />
            </button>
          </div>

          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/40">
            <span>{formatBytes(item.size)}</span>
            {item.meta?.durationMs && (
              <>
                <span>·</span>
                <span>{(item.meta.durationMs / 1000).toFixed(1)}s</span>
              </>
            )}
            {item.meta?.source === 'camera' && (
              <>
                <span>·</span>
                <span className="text-aqua-300">capturado</span>
              </>
            )}
          </div>

          {/* Status line */}
          <StatusLine item={item} />

          {/* Progress bar */}
          {(isActive || isDone) && (
            <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/[0.08]">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isDone
                    ? 'linear-gradient(90deg, #00C2FF, #7DD3FC)'
                    : 'linear-gradient(90deg, #00C2FF, #38BDF8)',
                }}
                animate={{ width: `${Math.round(item.progress)}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Subtle scan-line animation while active */}
      {isActive && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(0,194,255,0.6), transparent)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </motion.div>
  )
}

function StatusLine({ item }) {
  if (item.status === UploadStatus.QUEUED) {
    return (
      <div className="mt-1 text-[11px] text-white/45">Na fila…</div>
    )
  }
  if (item.status === UploadStatus.UPLOADING) {
    return (
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-aqua-300">
        <Loader2 size={10} className="animate-spin" />
        Enviando · {Math.round(item.progress)}%
      </div>
    )
  }
  if (item.status === UploadStatus.PROCESSING) {
    return (
      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-aqua-300">
        <Loader2 size={10} className="animate-spin" />
        {STAGE_LABELS[item.stage] || 'Processando'} ·{' '}
        {Math.round(item.progress)}%
      </div>
    )
  }
  if (item.status === UploadStatus.COMPLETED) {
    return (
      <div className="mt-1 text-[11px] text-aqua-300">
        Tour pronto ✦ Toque para abrir
      </div>
    )
  }
  if (item.status === UploadStatus.FAILED) {
    return (
      <div className="mt-1 text-[11px] text-red-400/80">
        {item.error || 'Falha no envio'}
      </div>
    )
  }
  if (item.status === UploadStatus.CANCELED) {
    return <div className="mt-1 text-[11px] text-white/40">Cancelado</div>
  }
  return null
}
