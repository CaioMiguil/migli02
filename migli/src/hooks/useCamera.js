import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CameraPermission,
  RecorderState,
  createRecorder,
  isCameraSupported,
  listCameras,
  queryCameraPermission,
  requestCameraStream,
  stopStream,
  captureFrame,
} from '@lib/capture/cameraEngine'

/**
 * useCamera — top-level React hook that manages the entire capture lifecycle.
 *
 * This is the only API the UI needs to talk to. All browser-level concerns
 * (permissions, MediaStream, MediaRecorder, device enumeration) are hidden.
 *
 * Returned API:
 *   permission       'prompt' | 'granted' | 'denied' | 'unavailable'
 *   recorderState    'idle' | 'starting' | 'recording' | ...
 *   cameras          [{ deviceId, label, facing }]
 *   activeCamera     deviceId currently in use
 *   facing           'environment' | 'user'
 *   error            Error | null
 *   videoRef         attach to your <video> tag
 *   start()          request camera + attach stream
 *   stop()           release camera
 *   switchFacing()   toggle front / rear
 *   startRecording()
 *   stopRecording()  → Promise<{ blob, durationMs, mime }>
 *   takeSnapshot()   → Promise<Blob>
 *   duration         live milliseconds of current recording
 */
export function useCamera() {
  const [permission, setPermission] = useState(CameraPermission.PROMPT)
  const [recorderState, setRecorderState] = useState(RecorderState.IDLE)
  const [cameras, setCameras] = useState([])
  const [activeCamera, setActiveCamera] = useState(null)
  const [facing, setFacing] = useState('environment')
  const [error, setError] = useState(null)
  const [duration, setDuration] = useState(0)
  // O stream em si vira state para que componentes que precisam do
  // MediaStream (ex: scanSession) se atualizem quando ele troca.
  const [stream, setStream] = useState(null)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const startedAtRef = useRef(0)
  const tickRef = useRef(0)

  // Initial permission probe
  useEffect(() => {
    if (!isCameraSupported()) {
      setPermission(CameraPermission.UNAVAILABLE)
      return
    }
    queryCameraPermission().then(setPermission)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream(streamRef.current)
      cancelAnimationFrame(tickRef.current)
    }
  }, [])

  /**
   * Acquire camera and attach to the video element.
   */
  const start = useCallback(
    async (opts = {}) => {
      setError(null)
      try {
        // Release any existing stream first
        stopStream(streamRef.current)

        const stream = await requestCameraStream({
          facing: opts.facing ?? facing,
          deviceId: opts.deviceId ?? activeCamera ?? undefined,
          audio: opts.audio ?? true,
        })
        streamRef.current = stream
        setStream(stream)

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          // iOS needs these attributes set programmatically
          videoRef.current.setAttribute('playsinline', 'true')
          videoRef.current.setAttribute('autoplay', 'true')
          videoRef.current.muted = true
          await videoRef.current.play().catch(() => {})
        }

        setPermission(CameraPermission.GRANTED)

        // Refresh device list now that labels are populated
        const list = await listCameras()
        setCameras(list)
        const track = stream.getVideoTracks()[0]
        const settings = track?.getSettings?.() ?? {}
        if (settings.deviceId) setActiveCamera(settings.deviceId)
      } catch (err) {
        setError(err)
        if (err.name === 'NotAllowedError') {
          setPermission(CameraPermission.DENIED)
        } else if (err.name === 'NotFoundError') {
          setPermission(CameraPermission.UNAVAILABLE)
        }
      }
    },
    [facing, activeCamera],
  )

  /**
   * Release the camera completely.
   */
  const stop = useCallback(() => {
    stopStream(streamRef.current)
    streamRef.current = null
    setStream(null)
    if (videoRef.current) videoRef.current.srcObject = null
    setRecorderState(RecorderState.IDLE)
    setDuration(0)
  }, [])

  /**
   * Toggle between front and rear cameras.
   */
  const switchFacing = useCallback(async () => {
    const next = facing === 'environment' ? 'user' : 'environment'
    setFacing(next)
    await start({ facing: next, deviceId: null })
  }, [facing, start])

  /**
   * Begin recording the current stream.
   */
  const startRecording = useCallback(() => {
    if (!streamRef.current) {
      setError(new Error('Camera not started.'))
      return
    }
    try {
      setRecorderState(RecorderState.STARTING)
      const rec = createRecorder(streamRef.current)
      recorderRef.current = rec
      rec.start(1000) // emit chunks every 1s
      startedAtRef.current = performance.now()
      setDuration(0)
      setRecorderState(RecorderState.RECORDING)

      // Duration ticker
      const tick = () => {
        setDuration(performance.now() - startedAtRef.current)
        tickRef.current = requestAnimationFrame(tick)
      }
      tickRef.current = requestAnimationFrame(tick)
    } catch (err) {
      setError(err)
      setRecorderState(RecorderState.ERROR)
    }
  }, [])

  /**
   * Stop recording and return the final blob.
   */
  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return null
    setRecorderState(RecorderState.STOPPING)
    cancelAnimationFrame(tickRef.current)
    const blob = await recorderRef.current.stop()
    const result = {
      blob,
      durationMs: performance.now() - startedAtRef.current,
      mime: blob.type,
    }
    recorderRef.current = null
    setRecorderState(RecorderState.IDLE)
    setDuration(0)
    return result
  }, [])

  /**
   * Capture a still frame as a JPEG Blob.
   */
  const takeSnapshot = useCallback(
    async (quality = 0.9) => {
      if (!videoRef.current) throw new Error('Camera not started.')
      return captureFrame(videoRef.current, { quality })
    },
    [],
  )

  return {
    // state
    permission,
    recorderState,
    cameras,
    activeCamera,
    facing,
    error,
    duration,
    stream,
    isRecording: recorderState === RecorderState.RECORDING,

    // refs
    videoRef,

    // actions
    start,
    stop,
    switchFacing,
    startRecording,
    stopRecording,
    takeSnapshot,
  }
}
