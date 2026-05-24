import { motion } from 'framer-motion'
import { Circle, FlipHorizontal, X, Pause, Check } from 'lucide-react'

/**
 * Bottom HUD: record button + secondary actions.
 * Mobile-first: thumb-reachable, generous tap targets.
 */
export default function CaptureControls({
  isRecording,
  duration,
  onToggleRecord,
  onSwitchCamera,
  onClose,
  onConfirm,
  hasRecording,
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 pb-[max(env(safe-area-inset-bottom),20px)] pt-6">
      <div className="mx-auto flex max-w-md items-center justify-between px-8">
        {/* Left: Close */}
        <ControlButton
          onClick={onClose}
          aria-label="Fechar"
          disabled={isRecording}
          className={isRecording ? 'opacity-30' : ''}
        >
          <X size={20} strokeWidth={1.6} />
        </ControlButton>

        {/* Center: Record */}
        <RecordButton isRecording={isRecording} onClick={onToggleRecord} />

        {/* Right: Switch camera OR confirm */}
        {hasRecording && !isRecording ? (
          <ControlButton
            onClick={onConfirm}
            aria-label="Usar gravação"
            className="bg-aqua-400 text-ink-950 border-aqua-400"
          >
            <Check size={20} strokeWidth={2.4} />
          </ControlButton>
        ) : (
          <ControlButton
            onClick={onSwitchCamera}
            aria-label="Trocar câmera"
            disabled={isRecording}
            className={isRecording ? 'opacity-30' : ''}
          >
            <FlipHorizontal size={18} strokeWidth={1.6} />
          </ControlButton>
        )}
      </div>

      {/* Live duration pill */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full"
        >
          <DurationPill ms={duration} />
        </motion.div>
      )}
    </div>
  )
}

function ControlButton({ children, className = '', ...props }) {
  return (
    <button
      type="button"
      data-hover
      className={`flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white backdrop-blur-md transition-all duration-200 hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function RecordButton({ isRecording, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-hover
      whileTap={{ scale: 0.92 }}
      className="relative flex h-20 w-20 items-center justify-center rounded-full bg-transparent"
      aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
    >
      {/* Outer ring */}
      <span className="absolute inset-0 rounded-full border-[3px] border-white/85" />
      {/* Inner — animated to square when recording */}
      <motion.span
        layout
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="block bg-red-500"
        style={{
          width: isRecording ? '32%' : '78%',
          height: isRecording ? '32%' : '78%',
          borderRadius: isRecording ? 6 : '50%',
        }}
      />
      {/* Pulse halo while recording */}
      {isRecording && (
        <motion.span
          className="absolute inset-0 rounded-full"
          style={{ border: '2px solid rgba(239, 68, 68, 0.45)' }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      )}
    </motion.button>
  )
}

function DurationPill({ ms }) {
  const total = Math.floor(ms / 1000)
  const mm = String(Math.floor(total / 60)).padStart(2, '0')
  const ss = String(total % 60).padStart(2, '0')
  return (
    <div className="flex items-center gap-2 rounded-full border border-red-500/30 bg-black/60 px-4 py-1.5 backdrop-blur-md">
      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
      <span className="font-mono text-sm font-medium tabular-nums tracking-wider text-white">
        {mm}:{ss}
      </span>
    </div>
  )
}

// Static import to satisfy linter — Circle and Pause kept for future
void Circle
void Pause
