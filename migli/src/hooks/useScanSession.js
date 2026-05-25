import { useCallback, useEffect, useRef, useState } from 'react'
import { createScanSession, ScanPhase, MotionHint } from '@lib/capture/scanSession'

/**
 * useScanSession — wrapper React do scanSession.
 *
 * Espera que o caller forneça um <video> ref e um MediaStream pronto.
 * Quando o usuário aciona start(), começa a máquina de fases. Cada
 * mudança vira novo state imutável que dispara re-render.
 */
export function useScanSession({ videoRef, stream, targetFrames = 80 }) {
  const sessionRef = useRef(null)
  const [state, setState] = useState({
    phase: ScanPhase.IDLE,
    progress: 0,
    framesCaptured: 0,
    framesAccepted: 0,
    framesRejected: 0,
    targetFrames,
    elapsedMs: 0,
    motionHint: MotionHint.HOLD_STEADY,
    coverage: 0,
    lastSharpness: 0,
    lastBrightness: 0,
    orientation: { alpha: 0, beta: 0, gamma: 0 },
    errors: [],
  })

  // (Re)inicializa sessão quando temos video+stream
  useEffect(() => {
    const videoEl = videoRef.current
    if (!videoEl || !stream) return

    const session = createScanSession({
      videoEl,
      stream,
      targetFrames,
      onUpdate: setState,
    })
    sessionRef.current = session

    return () => {
      session.dispose()
      sessionRef.current = null
    }
  }, [videoRef, stream, targetFrames])

  const start = useCallback(() => sessionRef.current?.start(), [])
  const finishEarly = useCallback(() => sessionRef.current?.finishEarly(), [])
  const cancel = useCallback(() => sessionRef.current?.cancel(), [])
  const getFrames = useCallback(() => sessionRef.current?.getFrames() ?? [], [])

  return { state, start, finishEarly, cancel, getFrames }
}

export { ScanPhase, MotionHint }
