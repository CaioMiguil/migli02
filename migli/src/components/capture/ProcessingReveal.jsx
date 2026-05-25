import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Sparkles, ArrowRight, Share2 } from 'lucide-react'
import { LogoMark } from '@components/brand/Logo'
import ImmersiveViewer from '@components/viewer/ImmersiveViewer'
import { getDefaultScene } from '@lib/splatCatalog'
import { uploadScanSession } from '@lib/cloud/scanUploadService'

/**
 * ProcessingReveal — fluxo unificado pós-scan:
 *
 *   1. Real: Upload dos frames para R2 + criação do property no Supabase
 *      (driven por scanUploadService, com progresso real)
 *   2. Simulado: 3 fases de "reconstrução em 3D" enquanto pipeline GPU
 *      não existe (timers, UX premium). Quando Fase 4 estiver pronta,
 *      essas fases viram polling do status real.
 *   3. Reveal: cross-fade pro tour imersivo
 *
 * UX externa idêntica nos dois modos (com/sem cloud).
 */
const RECONSTRUCTION_STAGES = [
  { id: 'analyzing', label: 'Analisando frames', subLabel: 'Verificando qualidade da captura', duration: 1600 },
  { id: 'mapping', label: 'Mapeando ambiente', subLabel: 'Reconhecendo paredes e detalhes', duration: 2200 },
  { id: 'reconstructing', label: 'Reconstruindo em 3D', subLabel: 'Gerando nuvem de Gaussianas', duration: 2400 },
  { id: 'finalizing', label: 'Publicando seu tour', subLabel: 'Gerando link compartilhável', duration: 1400 },
]

export default function ProcessingReveal({ open, session, onClose }) {
  const [phase, setPhase] = useState('uploading') // uploading | reconstructing | done
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('creating')
  const [stageIndex, setStageIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const startedRef = useRef(false)

  // Reset on each open
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

  // Kick off real upload
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
        // Continue to reconstruction simulation anyway — demo flow
        setPhase('reconstructing')
      })

    return () => {
      cancelled = true
    }
  }, [open, session])

  // Drive simulated reconstruction stages
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
            className="fixed inset-0 z-[9700] flex flex-col items-center justify-center bg-paper-0 px-6 text-center"
          >
            <ProcessingBackdrop />

            {/* Brand mark */}
            <div className="relative mb-9">
              <LogoMark size={56} animated />
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'radial-gradient(circle, rgba(14,138,196,0.32), transparent 70%)',
                  filter: 'blur(20px)',
                }}
                animate={{ opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 2.4, ease: 'easeInOut', repeat: Infinity }}
              />
            </div>

            <div className="eyebrow mb-3">
              {phase === 'uploading' ? 'ENVIANDO PARA A NUVEM' : 'RECONSTRUÇÃO EM ANDAMENTO'}
            </div>

            {/* Stage label */}
            <div className="relative h-24 w-full max-w-md">
              <AnimatePresence mode="wait">
                <motion.div
                  key={phase === 'uploading' ? `up-${uploadStage}` : `rec-${stageIndex}`}
                  initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0 flex flex-col items-center justify-center"
                >
                  <h2 className="font-display text-3xl font-extrabold tracking-tightest text-ink-900">
                    {phase === 'done'
                      ? 'Tudo pronto'
                      : phase === 'uploading'
                        ? uploadStageLabel(uploadStage)
                        : RECONSTRUCTION_STAGES[stageIndex].label}
                  </h2>
                  <p className="mt-2 text-sm font-light text-ink-600">
                    {phase === 'done'
                      ? 'Seu tour está pronto para ser explorado'
                      : phase === 'uploading'
                        ? uploadStageSub(uploadStage)
                        : RECONSTRUCTION_STAGES[stageIndex].subLabel}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress */}
            <div className="mt-4 w-full max-w-xs">
              <div className="h-[3px] overflow-hidden rounded-full bg-paper-200">
                <motion.div
                  className="h-full"
                  style={{
                    background: 'linear-gradient(90deg, #0E8AC4, #3FA8DA)',
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
                    className="h-1 w-1 rounded-full transition-colors duration-500"
                    style={{
                      background:
                        phase === 'done' || (phase === 'reconstructing' && i <= stageIndex)
                          ? '#0E8AC4'
                          : '#D6DEE8',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 max-w-xs rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                <strong>Atenção:</strong> {error}. Continuando em modo demo.
              </div>
            )}

            {/* Done CTA */}
            <AnimatePresence>
              {phase === 'done' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                  className="mt-10"
                >
                  <button
                    onClick={() => setRevealed(true)}
                    data-hover
                    className="group flex items-center gap-2.5 rounded-full px-7 py-3.5 font-display text-[14px] font-semibold tracking-tight text-white transition-all active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, #0E8AC4 0%, #0871A6 100%)',
                      boxShadow: '0 14px 40px rgba(14, 138, 196, 0.36)',
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

            {/* Footer meta */}
            {session && (
              <div
                className="absolute inset-x-0 bottom-0 flex justify-center text-[10px] tracking-widest3 text-ink-400"
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
    case 'creating':
      return 'Criando registro'
    case 'uploading':
      return 'Enviando frames'
    case 'finalizing':
      return 'Confirmando upload'
    case 'done':
      return 'Upload concluído'
    default:
      return 'Preparando…'
  }
}

function uploadStageSub(stage) {
  switch (stage) {
    case 'creating':
      return 'Reservando espaço no servidor'
    case 'uploading':
      return 'Transferindo os dados da captura'
    case 'finalizing':
      return 'Iniciando reconstrução'
    case 'done':
      return ''
    default:
      return ''
  }
}

/* ============================================================
   Reveal
   ============================================================ */
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

function ProcessingBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(220,239,250,0.6), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(179,222,243,0.4), transparent 50%)',
        }}
      />
      {/* Linhas verticais de scan */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          aria-hidden
          className="pointer-events-none absolute inset-y-0"
          style={{
            left: `${20 + i * 30}%`,
            width: 1,
            background:
              'linear-gradient(180deg, transparent, rgba(14,138,196,0.18), transparent)',
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
