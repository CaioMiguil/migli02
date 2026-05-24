import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useCamera } from '@hooks/useCamera'
import { useUploadQueue } from '@hooks/useUploadQueue'
import { CameraPermission } from '@lib/capture/cameraEngine'
import CameraPreview from './CameraPreview'
import CaptureControls from './CaptureControls'
import PermissionGate from './PermissionGate'
import OnboardingOverlay from './OnboardingOverlay'
import LogoWatermark from '@components/brand/LogoWatermark'

/**
 * CaptureScreen — the immersive, mobile-first capture surface.
 *
 * Composed of:
 *   - CameraPreview        (the video + framing)
 *   - PermissionGate       (only shown until granted)
 *   - OnboardingOverlay    (first-time tips)
 *   - CaptureControls      (record / switch / close)
 *   - LogoWatermark        (subtle brand presence)
 *
 * On confirm, the recording is pushed into the global UploadQueue and the
 * user is returned to the calling screen.
 */
export default function CaptureScreen({ open, onClose, onCaptured }) {
  const cam = useCamera()
  const queue = useUploadQueue()
  const [recording, setRecording] = useState(null) // { blob, durationMs, mime }
  const [showOnboarding, setShowOnboarding] = useState(true)

  // Auto-start camera when screen opens with permission already granted
  useEffect(() => {
    if (!open) return
    if (cam.permission === CameraPermission.GRANTED) {
      cam.start()
    }
    return () => cam.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, cam.permission])

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const handleRequestPermission = async () => {
    await cam.start()
  }

  const handleToggleRecord = async () => {
    if (cam.isRecording) {
      const result = await cam.stopRecording()
      if (result?.blob) {
        setRecording(result)
      }
    } else {
      cam.startRecording()
      setRecording(null)
    }
  }

  const handleConfirm = () => {
    if (!recording) return
    const file = new File(
      [recording.blob],
      `migli-captura-${Date.now()}.${recording.mime.includes('mp4') ? 'mp4' : 'webm'}`,
      { type: recording.mime },
    )
    const [item] = queue.enqueue([file], {
      name: 'Nova captura',
      durationMs: recording.durationMs,
      source: 'camera',
    })
    onCaptured?.(item)
    handleClose()
  }

  const handleRetake = () => setRecording(null)

  const handleClose = () => {
    cam.stop()
    setRecording(null)
    onClose?.()
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        key="capture"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[9000] h-dscreen bg-black"
      >
        <CameraPreview
          ref={cam.videoRef}
          mirrored={cam.facing === 'user'}
        >
          <LogoWatermark position="top-left" size={24} opacity={0.6} />

          {/* Top status bar */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-end gap-2 px-6 pt-[max(env(safe-area-inset-top),16px)]">
            <CameraStatus facing={cam.facing} />
          </div>

          {/* Onboarding */}
          {showOnboarding &&
            cam.permission === CameraPermission.GRANTED &&
            !cam.isRecording &&
            !recording && (
              <OnboardingOverlay onComplete={() => setShowOnboarding(false)} />
            )}

          {/* Recording preview state — playback the captured clip */}
          {recording && (
            <RecordingReview
              recording={recording}
              onRetake={handleRetake}
            />
          )}

          {/* Controls */}
          <CaptureControls
            isRecording={cam.isRecording}
            duration={cam.duration}
            onToggleRecord={handleToggleRecord}
            onSwitchCamera={cam.switchFacing}
            onClose={handleClose}
            onConfirm={handleConfirm}
            hasRecording={!!recording}
          />

          {/* Permission gate */}
          <PermissionGate
            permission={cam.permission}
            onRequest={handleRequestPermission}
            error={cam.error}
          />
        </CameraPreview>
      </motion.div>
    </AnimatePresence>
  )
}

function CameraStatus({ facing }) {
  return (
    <div className="pointer-events-auto rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] tracking-widest2 text-white/80 backdrop-blur-md">
      {facing === 'environment' ? 'CÂMERA TRASEIRA' : 'CÂMERA FRONTAL'}
    </div>
  )
}

function RecordingReview({ recording, onRetake }) {
  const url = URL.createObjectURL(recording.blob)

  useEffect(() => {
    return () => URL.revokeObjectURL(url)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-10 bg-black"
    >
      <video
        src={url}
        autoPlay
        loop
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-[max(env(safe-area-inset-top),16px)]">
        <div className="rounded-full border border-aqua-400/40 bg-black/60 px-4 py-1.5 text-[11px] tracking-widest2 text-aqua-300 backdrop-blur-md">
          PRÉ-VISUALIZAÇÃO
        </div>
        <button
          onClick={onRetake}
          data-hover
          className="rounded-full border border-white/15 bg-black/60 px-4 py-1.5 text-xs font-medium text-white backdrop-blur-md transition hover:bg-white/10"
        >
          Refazer
        </button>
      </div>
    </motion.div>
  )
}
