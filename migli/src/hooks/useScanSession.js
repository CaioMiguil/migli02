import { useCallback, useEffect, useRef, useState } from 'react'
import { createScanSession, ScanPhase, MotionHint } from '@lib/capture/scanSession'
import { useDeviceOrientation } from './useDeviceOrientation'

/**
 * useScanSession — wrapper React do scanSession.
 *
 * Inclui o bridge da orientação do dispositivo: o sensor é gerenciado pelo
 * useDeviceOrientation (que trata o gate de permissão iOS) e cada leitura
 * é injetada na sessão via ingestOrientation.
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
    coverageMap: new Array(12).fill(false),
    coverageRatio: 0,
    heading: 0,
    lastSharpness: 0,
    lastBrightness: 0,
    orientation: { alpha: 0, beta: 0, gamma: 0 },
    errors: [],
  })

  // Sensor de orientação — bridge para a sessão
  const { permission: orientationPerm, request: requestOrientation } =
    useDeviceOrientation({
      onChange: (next) => {
        sessionRef.current?.ingestOrientation(next)
      },
    })

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

  return {
    state,
    start,
    finishEarly,
    cancel,
    getFrames,
    orientationPerm,
    requestOrientation,
  }
}

export { ScanPhase, MotionHint }
