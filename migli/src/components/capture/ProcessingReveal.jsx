import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Sparkles, ArrowRight, Share2 } from 'lucide-react'
import { LogoMark } from '@components/brand/Logo'
import ImmersiveViewer from '@components/viewer/ImmersiveViewer'
import { getDefaultScene } from '@lib/splatCatalog'
import { uploadScanSession } from '@lib/cloud/scanUploadService'
import ParticleGalaxy from '@components/ui/ParticleGalaxy'

/**
 * ProcessingReveal — fluxo cinematográfico pós-scan.
 *
 *   1. Real: Upload dos frames pra cloud OU IndexedDB local
 *   2. Simulado: 4 fases de "reconstrução" enquanto pipeline GPU não existe
 *   3. Reveal: cross-fade pro tour imersivo
 *
 * Visual: galaxy background, glow azul, glass card central
 */
const RECONSTRUCTION_STAGES = [
  { id: 'analyzing', label: 'Analisando frames', subLabel: 'Avaliando nitidez e luz da captura', duration: 1600 },
  { id: 'mapping', label: 'Mapeando ambiente', subLabel: 'Reconhecendo paredes e detalhes', duration: 2200 },
  { id: 'reconstructing', label: 'Reconstruindo em 3D', subLabel: 'Gerando nuvem de Gaussianas', duration: 2400 },
  { id: 'finalizing', label: 'Publicando seu tour', subLabel: 'Gerando link compartilhável', duration: 1400 },
]

export default function ProcessingReveal({ open, session, onClose }) {
  const [phase, setPhase] = useState('uploading')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('creating')
  const [stageIndex, setStageIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (!open) {
      startedRef.current = false
      return
    }
    setPhase('uploading')
    setUploadProgress(0)
    setUploadStage('creating')
    setStageIndex(0)
    setRevealed(false)
    setError(null)
    setResult(null)
  }, [open])

  useEffect(() => {
    if (!open || !session || startedRef.current) return
    startedRef.current = true

    let cancelled = false
    uploadScanSession(session, {
      onProgress: (stage, progress) => {
        if (cancelled) return
        setUploadStage(stage)
        setUploadProgress(progress)
      },
    })
      .then((r) => {
        if (cancelled) return
        setResult(r)
        setPhase('reconstructing')
        setStageIndex(0)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message || 'Erro no upload')
        setPhase('reconstructing')
      })

    return () => {
      cancelled = true
    }
  }, [open, session])

  useEffect(() => {
    if (phase !== 'reconstructing') return
    const timers = []
    let cumulative = 0
    RECONSTRUCTION_STAGES.forEach((stage, i) => {
      cumulative += stage.duration
      timers.push(
        setTimeout(() => {
          if (i < RECONSTRUCTION_STAGES.length - 1) {
            setStageIndex(i + 1)
          } else {
            setPhase('done')
          }
        }, cumulative),
      )
    })
    return () => timers.forEach(clearTimeout)
  }, [phase])

  if (!open) return null

  return (
    <>
      <AnimatePresence>
        {!revealed && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[9700] flex flex-col items-center justify-center bg-ink-950 px-6 text-center"
          >
            {/* Galaxy background */}
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <ParticleGalaxy density={0.7} rotation={5} />
            </div>

            <ScanLines />

            {/* Brand mark com glow */}
            <div className="relative z-10 mb-9">
              <motion.div
                style={{
                  filter: 'drop-shadow(0 0 32px rgba(0, 194, 255, 0.7))',
                }}
              >
                <LogoMark size={64} animated />
              </motion.div>
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(0,194,255,0.32), transparent 70%)',
                  filter: 'blur(20px)',
                }}
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
              />
            </div>

            <div className="relative z-10 eyebrow mb-3">
              {phase === 'uploading' ? 'ENVIANDO PARA A NUVEM' : 'RECONSTRUÇÃO EM ANDAMENTO'}
            </div>

            <div className="relative z-10 h-24 w-full max-w-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase === 'uploading' ? `up-${uploadStage}` : `rec-${stageIndex}`}
                  initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <h2 className="font-display text-3xl font-extrabold tracking-tightest text-white">
                    {phase === 'done'
                      ? 'Tudo pronto'
                      : phase === 'uploading'
                        ? uploadStageLabel(uploadStage)
                        : RECONSTRUCTION_STAGES[stageIndex].label}
                  </h2>
                  <p className="mt-2 text-sm font-light text-white/60">
                    {phase === 'done'
                      ? 'Seu tour está pronto para ser explorado'
                      : phase === 'uploading'
                        ? uploadStageSub(uploadStage)
                        : RECONSTRUCTION_STAGES[stageIndex].subLabel}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative z-10 mt-4 w-full max-w-xs">
              <div className="h-[3px] overflow-hidden rounded-full bg-white/[0.08]">
                <motion.div
                  className="h-full"
                  style={{
                    background: 'linear-gradient(90deg, #00C2FF, #7DD3FC)',
                    boxShadow: '0 0 12px rgba(0,194,255,0.7)',
                  }}
                  initial={{ width: 0 }}
                  animate={{
                    width: progressForPhase(phase, uploadProgress, stageIndex),
                  }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              <div className="mt-3 flex justify-center gap-1.5">
                {RECONSTRUCTION_STAGES.map((_, i) => (
                  <div
                    key={i}
                    className="h-1 w-1 rounded-full transition-all duration-500"
                    style={{
                      background:
                        phase === 'done' || (phase === 'reconstructing' && i <= stageIndex)
                          ? '#00C2FF'
                          : 'rgba(255,255,255,0.18)',
                      boxShadow:
                        phase === 'done' || (phase === 'reconstructing' && i <= stageIndex)
                          ? '0 0 8px rgba(0,194,255,0.7)'
                          : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="relative z-10 mt-4 max-w-xs rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-200">
                <strong>Atenção:</strong> {error}. Continuando em modo local.
              </div>
            )}

            <AnimatePresence>
              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                  className="relative z-10 mt-10"
                >
                  <button
                    onClick={() => setRevealed(true)}
                    data-hover
                    className="group flex items-center gap-2.5 rounded-full px-7 py-3.5 font-display text-[14px] font-semibold tracking-tight text-white transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #00C2FF 0%, #0E8AC4 100%)',
                      boxShadow: '0 18px 50px rgba(0, 194, 255, 0.45)',
                    }}
                  >
                    <Sparkles size={16} strokeWidth={2.2} />
                    Revelar seu imóvel
                    <ArrowRight
                      size={14}
                      strokeWidth={2.4}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {session && (
              <div
                className="absolute inset-x-0 bottom-0 z-10 flex justify-center text-[10px] tracking-widest3 text-white/35"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
              >
                {session.frames?.length ?? 0} FRAMES ·{' '}
                {Math.round((session.durationMs ?? 0) / 1000)}S DE CAPTURA
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {revealed && (
        <RevealedTour
          property={result?.property}
          onClose={() => {
            setRevealed(false)
            onClose?.()
          }}
        />
      )}
    </>
  )
}

function ScanLines() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          aria-hidden
          className="pointer-events-none absolute inset-y-0 z-[5]"
          style={{
            left: `${20 + i * 30}%`,
            width: 1,
            background:
              'linear-gradient(180deg, transparent, rgba(0,194,255,0.4), transparent)',
          }}
          animate={{ opacity: [0, 0.7, 0], y: ['-15%', '15%', '-15%'] }}
          transition={{
            duration: 5 + i,
            ease: 'easeInOut',
            repeat: Infinity,
            delay: i * 1.2,
          }}
        />
      ))}
    </>
  )
}

function progressForPhase(phase, uploadProgress, stageIndex) {
  if (phase === 'uploading') return `${Math.round(uploadProgress * 45)}%`
  if (phase === 'reconstructing') {
    const ratio = (stageIndex + 1) / RECONSTRUCTION_STAGES.length
    return `${Math.round(45 + ratio * 55)}%`
  }
  return '100%'
}

function uploadStageLabel(stage) {
  switch (stage) {
    case 'creating': return 'Criando registro'
    case 'uploading': return 'Enviando frames'
    case 'finalizing': return 'Confirmando upload'
    case 'done': return 'Upload concluído'
    default: return 'Preparando…'
  }
}

function uploadStageSub(stage) {
  switch (stage) {
    case 'creating': return 'Reservando espaço seguro'
    case 'uploading': return 'Transferindo cada quadro capturado'
    case 'finalizing': return 'Iniciando reconstrução'
    case 'done': return ''
    default: return ''
  }
}

function RevealedTour({ property, onClose }) {
  const [showHint, setShowHint] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4500)
    return () => clearTimeout(t)
  }, [])

  const scene = property?.splat_url
    ? { splatUrl: property.splat_url }
    : getDefaultScene()

  const propertyMeta = {
    name: property?.name || 'Seu imóvel · MIGLI',
    status: 'Tour imersivo · ao vivo',
    rooms: property?.metadata?.capture
      ? [`${property.metadata.capture.frameCount} frames capturados`]
      : ['Pronto para explorar'],
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[9700]"
    >
      <ImmersiveViewer
        open
        scene={scene}
        propertyMeta={propertyMeta}
        onClose={onClose}
      />

      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.6 }}
            className="pointer-events-none absolute left-1/2 top-1/3 z-[9800] -translate-x-1/2 -translate-y-1/2 px-6 text-center"
          >
            <div className="eyebrow mb-2 text-aqua-200">SEU IMÓVEL</div>
            <h2 className="font-display text-3xl font-extrabold tracking-tightest text-white drop-shadow-2xl">
              Pronto para explorar
            </h2>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-aqua-400/40 bg-black/55 px-3 py-1.5 text-[11px] text-aqua-200 backdrop-blur-md">
              <Share2 size={11} />
              Arraste para começar
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
