import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { X, RotateCcw, Smartphone, Check, AlertTriangle, Compass } from 'lucide-react'
import { useCamera } from '@hooks/useCamera'
import { useScanSession, ScanPhase, MotionHint } from '@hooks/useScanSession'
import { LogoMark } from '@components/brand/Logo'
import PermissionGate from './PermissionGate'
import CoverageRing from './CoverageRing'
import FirstScanCoach from './FirstScanCoach'

/**
 * ScanScreen — experiência cinematográfica de escaneamento.
 *
 * Substitui o antigo CaptureScreen. Em vez de "grave um vídeo + escolha
 * usar/refazer", aqui é uma experiência guiada: o app pede permissão,
 * mostra intro de 2.5s ensinando como segurar o celular, e começa a
 * capturar frames automaticamente enquanto o corretor anda pelo cômodo.
 *
 * Tudo PT-BR. Tudo cinematográfico. Tudo zero-clutter.
 */
export default function ScanScreen({ open, onClose, onComplete }) {
  const camera = useCamera()
  const scan = useScanSession({
    videoRef: camera.videoRef,
    stream: camera.stream,
    targetFrames: 60,
  })

  // Trava scroll do body durante o scan
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  // Inicia câmera ao abrir
  useEffect(() => {
    if (!open) return
    let cancelled = false
    camera.start().catch(() => {})
    return () => {
      cancelled = true
      // Para câmera ao fechar
      camera.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Quando a fase fica DONE, chama onComplete com os frames coletados
  useEffect(() => {
    if (scan.state.phase === ScanPhase.DONE) {
      const frames = scan.getFrames()
      onComplete?.({
        frames,
        durationMs: scan.state.elapsedMs,
        capturedAt: Date.now(),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan.state.phase])

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        key="scan"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed inset-0 z-[9700] h-dscreen w-screen overflow-hidden bg-black"
      >
        {/* Camera live preview (atrás de tudo) */}
        <video
          ref={camera.videoRef}
          playsInline
          autoPlay
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Vinheta sutil para profundidade */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
          }}
        />

        {/* Permission gate */}
        {camera.permission !== 'granted' && (
          <PermissionGate
            permission={camera.permission}
            error={camera.error}
            onRetry={() => camera.start()}
            onClose={onClose}
          />
        )}

        {/* HUD content (só aparece com permissão concedida) */}
        {camera.permission === 'granted' && (
          <ScanHUD scan={scan} camera={camera} onClose={onClose} />
        )}
      </motion.div>
    </AnimatePresence>
  )
}

/* ============================================================
   HUD — overlays cinematográficos por fase
   ============================================================ */
function ScanHUD({ scan, camera, onClose }) {
  const { state, start, finishEarly, cancel, orientationPerm, requestOrientation } = scan
  const phase = state.phase

  const handleClose = () => {
    cancel()
    onClose?.()
  }

  // Inicia o scan dentro do user gesture (necessário pro iOS orientation prompt)
  const handleStart = async () => {
    if (orientationPerm === 'prompt') {
      await requestOrientation()
      // Resultado da permissão é refletido no estado; seguimos com start
      // independente — sem orientação a sessão ainda funciona, só sem motion hints
    }
    start()
  }

  return (
    <>
      {/* Top bar — sempre presente */}
      <div
        className="absolute inset-x-0 top-0 z-30 flex items-start justify-between p-4 md:p-6"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 14px)' }}
      >
        <button
          onClick={handleClose}
          aria-label="Sair"
          data-hover
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/85 backdrop-blur-md transition hover:bg-white/10 active:scale-95"
        >
          <X size={18} strokeWidth={1.6} />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/55 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest3 text-white/70 backdrop-blur-md">
          <LogoMark size={14} />
          {phase === ScanPhase.IDLE && 'Pronto'}
          {phase === ScanPhase.INTRO && 'Preparando'}
          {phase === ScanPhase.SCANNING && 'Escaneando'}
          {phase === ScanPhase.FINALIZING && 'Finalizando'}
          {phase === ScanPhase.DONE && 'Concluído'}
        </div>

        <button
          onClick={() => camera.switchFacing()}
          aria-label="Trocar câmera"
          data-hover
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/85 backdrop-blur-md transition hover:bg-white/10 active:scale-95"
        >
          <RotateCcw size={16} strokeWidth={1.6} />
        </button>
      </div>

      {/* Frame guides cinematográficos */}
      <FrameGuides phase={phase} />

      {/* Conteúdo central / inferior por fase */}
      <AnimatePresence mode="wait">
        {phase === ScanPhase.IDLE && (
          <IdleOverlay key="idle" onStart={handleStart} />
        )}
        {phase === ScanPhase.INTRO && (
          <IntroOverlay key="intro" />
        )}
        {phase === ScanPhase.SCANNING && (
          <ScanningOverlay
            key="scanning"
            state={state}
            onFinishEarly={finishEarly}
          />
        )}
        {phase === ScanPhase.FINALIZING && (
          <FinalizingOverlay key="finalizing" />
        )}
      </AnimatePresence>
    </>
  )
}

/* ============================================================
   Frame guides (cantos cinematográficos)
   ============================================================ */
function FrameGuides({ phase }) {
  const active = phase === ScanPhase.SCANNING
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* 4 cantos */}
      {['tl', 'tr', 'bl', 'br'].map((pos) => (
        <motion.div
          key={pos}
          className="absolute h-9 w-9"
          style={{
            top: pos.startsWith('t') ? 80 : 'auto',
            bottom: pos.startsWith('b') ? 100 : 'auto',
            left: pos.endsWith('l') ? 24 : 'auto',
            right: pos.endsWith('r') ? 24 : 'auto',
            borderLeft: pos.endsWith('l') ? '1.5px solid #00C2FF' : 'none',
            borderRight: pos.endsWith('r') ? '1.5px solid #00C2FF' : 'none',
            borderTop: pos.startsWith('t') ? '1.5px solid #00C2FF' : 'none',
            borderBottom: pos.startsWith('b') ? '1.5px solid #00C2FF' : 'none',
            filter: active ? 'drop-shadow(0 0 8px rgba(0,194,255,0.7))' : 'none',
          }}
          animate={{ opacity: active ? [0.7, 1, 0.7] : 0.4 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}

      {/* Retículo central sutil */}
      <div
        className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          border: '1px solid rgba(0,194,255,0.35)',
          boxShadow: active ? '0 0 12px rgba(0,194,255,0.4)' : 'none',
        }}
      />
    </div>
  )
}

/* ============================================================
   Overlays por fase
   ============================================================ */
function IdleOverlay({ onStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 30 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-x-0 bottom-0 z-30 flex flex-col items-center px-6 pb-8"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 32px)' }}
    >
      <div className="mb-8 max-w-xs text-center">
        <h2 className="font-display text-2xl font-bold tracking-tighter text-white">
          Pronto para escanear
        </h2>
        <p className="mt-2 text-sm font-light leading-relaxed text-white/65">
          Movimente o celular devagar pelo cômodo. A IA cuidará do resto.
        </p>
      </div>

      <button
        onClick={onStart}
        data-hover
        className="group relative flex h-20 w-20 items-center justify-center rounded-full transition-transform active:scale-95"
      >
        <div
          aria-hidden
          className="absolute inset-0 rounded-full border-2 border-aqua-400/40"
        />
        <div
          aria-hidden
          className="absolute inset-1 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(0,194,255,0.5), rgba(0,194,255,0.1))',
            boxShadow: '0 0 30px rgba(0,194,255,0.45)',
          }}
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-aqua-400 transition-all group-hover:scale-105">
          <span className="font-display text-xs font-bold tracking-wider2 text-ink-950">
            INICIAR
          </span>
        </div>
      </button>
    </motion.div>
  )
}

function IntroOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute inset-0 z-30 flex items-center justify-center px-6"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/45 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex max-w-sm flex-col items-center text-center"
      >
        <motion.div
          animate={{ rotateY: [-15, 15, -15] }}
          transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
          className="mb-8"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-aqua-400/30 bg-aqua-400/10">
            <Smartphone size={36} className="text-aqua-300" strokeWidth={1.4} />
          </div>
        </motion.div>

        <div className="eyebrow mb-3">DICA RÁPIDA</div>
        <h3 className="font-display text-2xl font-bold tracking-tighter text-white">
          Segure o celular firme
        </h3>
        <p className="mt-3 text-sm font-light leading-relaxed text-white/65">
          Caminhe devagar pelo cômodo apontando a câmera para cada parede,
          móveis e detalhes.
        </p>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 2.5, ease: 'linear' }}
          className="mt-8 h-[2px] w-full max-w-[200px] rounded-full"
          style={{ background: 'linear-gradient(90deg, #00C2FF, #7DD3FC)' }}
        />
      </motion.div>
    </motion.div>
  )
}

function ScanningOverlay({ state, onFinishEarly }) {
  const pct = Math.round(state.progress * 100)
  const hint = formatHint(state.motionHint)

  return (
    <>
      {/* Pulso de mapeamento — anel que expande do retículo central */}
      <div className="pointer-events-none absolute inset-0 z-15 flex items-center justify-center">
        <motion.div
          className="rounded-full border border-aqua-400/40"
          style={{ width: 80, height: 80 }}
          animate={{
            scale: [1, 2.8, 2.8],
            opacity: [0.7, 0, 0],
          }}
          transition={{ duration: 2.4, ease: 'easeOut', repeat: Infinity }}
        />
      </div>

      {/* CoverageRing — flutuante acima do progress card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2"
        style={{ top: '22%' }}
      >
        <CoverageRing
          coverage={state.coverageMap}
          heading={state.heading}
          size={150}
        />
      </motion.div>

      {/* First-time coach */}
      <FirstScanCoach
        active
        movementDetected={state.coverageRatio > 0.15}
      />

      {/* Bottom HUD */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-x-0 bottom-0 z-30 px-4 pb-6 md:px-8"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}
      >
        {/* Motion hint chip */}
        <div className="mb-4 flex justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={hint.label}
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 rounded-full border bg-black/65 px-4 py-1.5 text-[11px] font-medium backdrop-blur-md"
              style={{
                borderColor: hint.color + '55',
                color: hint.color,
              }}
            >
              <hint.Icon size={12} strokeWidth={2.2} />
              {hint.label}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress card */}
        <div className="mx-auto max-w-md rounded-3xl border border-white/[0.08] bg-black/65 p-5 backdrop-blur-xl">
          {/* Heading */}
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <div className="eyebrow">CAPTURA EM ANDAMENTO</div>
              <div className="mt-0.5 font-display text-lg font-bold tracking-tighter text-white">
                {pct}<span className="text-white/35">%</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-medium uppercase tracking-widest2 text-white/40">
                Frames
              </div>
              <div className="font-mono text-sm font-semibold tabular-nums text-aqua-300">
                {state.framesAccepted} / {state.targetFrames}
              </div>
            </div>
          </div>

          {/* Bar */}
          <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              className="h-full"
              style={{ background: 'linear-gradient(90deg, #00C2FF, #7DD3FC)' }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Métricas secundárias — cobertura agora vive no ring */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <Metric label="Tempo" value={formatTime(state.elapsedMs)} />
            <Metric label="Qualidade" value={qualityLabel(state)} />
          </div>

          {/* Botão finalizar antes */}
          <button
            onClick={onFinishEarly}
            data-hover
            className="mt-5 w-full rounded-full border border-aqua-400/30 bg-aqua-400/10 py-2.5 font-display text-xs font-semibold uppercase tracking-widest2 text-aqua-200 transition-all hover:border-aqua-400 hover:bg-aqua-400/20 active:scale-95"
          >
            Finalizar captura
          </button>
        </div>
      </motion.div>
    </>
  )
}

function FinalizingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="absolute inset-0 z-30 flex items-center justify-center px-6"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
      />
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center text-center"
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl glass-aqua">
          <Check size={26} className="text-aqua-300" strokeWidth={2} />
        </div>
        <div className="eyebrow mb-2">CAPTURA CONCLUÍDA</div>
        <h3 className="font-display text-2xl font-bold tracking-tighter text-white">
          Processando seu imóvel
        </h3>
        <p className="mt-3 max-w-xs text-sm font-light leading-relaxed text-white/55">
          Estamos enviando os dados para reconstrução em 3D.
        </p>
        <motion.div
          animate={{
            rotate: 360,
            transition: { duration: 1.6, ease: 'linear', repeat: Infinity },
          }}
          className="mt-6 h-7 w-7 rounded-full border-2 border-white/15 border-t-aqua-400"
        />
      </motion.div>
    </motion.div>
  )
}

/* ============================================================
   Helpers visuais
   ============================================================ */
function Metric({ label, value }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-widest2 text-white/40">
        {label}
      </div>
      <div className="mt-0.5 font-display text-sm font-semibold tabular-nums text-white/85">
        {value}
      </div>
    </div>
  )
}

function formatTime(ms) {
  const s = Math.floor(ms / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

function qualityLabel(state) {
  if (state.framesAccepted < 5) return '—'
  const ratio = state.framesAccepted / Math.max(1, state.framesCaptured)
  if (ratio > 0.85) return 'Ótima'
  if (ratio > 0.65) return 'Boa'
  return 'Regular'
}

const HINTS = {
  [MotionHint.PERFECT]: {
    label: 'Continue assim',
    color: '#22d3ee',
    Icon: Check,
  },
  [MotionHint.TOO_FAST]: {
    label: 'Movimente mais devagar',
    color: '#fbbf24',
    Icon: AlertTriangle,
  },
  [MotionHint.TOO_SLOW]: {
    label: 'Continue se movendo',
    color: '#fbbf24',
    Icon: AlertTriangle,
  },
  [MotionHint.TOO_DARK]: {
    label: 'Ambiente muito escuro',
    color: '#f87171',
    Icon: AlertTriangle,
  },
  [MotionHint.TOO_BLURRY]: {
    label: 'Segure mais firme',
    color: '#f87171',
    Icon: AlertTriangle,
  },
  [MotionHint.HOLD_STEADY]: {
    label: 'Segure firme',
    color: '#7dd3fc',
    Icon: Smartphone,
  },
}
function formatHint(motion) {
  return HINTS[motion] || HINTS[MotionHint.HOLD_STEADY]
}
