// MIGLI · Camera Capture Engine
// ---------------------------------------------------------------
// Production-grade wrapper around the browser MediaDevices + MediaRecorder APIs.
// Built so the React layer never touches raw browser APIs directly.
//
// Responsibilities:
//   - Discover available cameras (front / rear)
//   - Request high-quality video streams with sensible fallbacks
//   - Record video to disk-friendly Blobs
//   - Surface device capabilities (torch, zoom, resolution)
//   - Gracefully handle permission states across iOS / Android / Desktop
//
// Future extension points:
//   - swap MediaRecorder for WebCodecs (lower latency, more control)
//   - stream frames to a worker for on-device feature extraction
//   - feed frames to a WASM splat pre-processor

/**
 * Permission states surfaced to the UI layer.
 */
export const CameraPermission = {
  PROMPT: 'prompt',
  GRANTED: 'granted',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
}

/**
 * Recording states. The UI mirrors these.
 */
export const RecorderState = {
  IDLE: 'idle',
  STARTING: 'starting',
  RECORDING: 'recording',
  PAUSED: 'paused',
  STOPPING: 'stopping',
  ERROR: 'error',
}

/**
 * Check whether camera capture is even possible in this environment.
 * Catches Safari quirks (e.g. non-HTTPS contexts), older Android browsers, etc.
 */
export function isCameraSupported() {
  return Boolean(
    typeof navigator !== 'undefined' &&
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined',
  )
}

/**
 * Query current permission state without prompting the user.
 * Returns one of CameraPermission.
 */
export async function queryCameraPermission() {
  if (!isCameraSupported()) return CameraPermission.UNAVAILABLE
  if (!navigator.permissions?.query) return CameraPermission.PROMPT
  try {
    const status = await navigator.permissions.query({ name: 'camera' })
    return status.state // 'granted' | 'denied' | 'prompt'
  } catch {
    // Some browsers (Firefox) don't support 'camera' as a query name.
    return CameraPermission.PROMPT
  }
}

/**
 * Enumerate available video input devices. Returns [{ deviceId, label, facing }].
 * Labels are only populated AFTER permission has been granted at least once.
 */
export async function listCameras() {
  if (!isCameraSupported()) return []
  const devices = await navigator.mediaDevices.enumerateDevices()
  return devices
    .filter((d) => d.kind === 'videoinput')
    .map((d) => ({
      deviceId: d.deviceId,
      label: d.label || 'Camera',
      facing: guessFacing(d.label),
    }))
}

function guessFacing(label = '') {
  const l = label.toLowerCase()
  if (l.includes('back') || l.includes('rear') || l.includes('environment'))
    return 'environment'
  if (l.includes('front') || l.includes('user') || l.includes('face'))
    return 'user'
  return 'unknown'
}

/**
 * Request a video stream. Prefers the requested facing camera, with sensible
 * resolution + framerate targets. Falls back gracefully if constraints fail.
 *
 * @param {Object} opts
 * @param {'environment' | 'user'} opts.facing
 * @param {string} [opts.deviceId]
 * @param {boolean} [opts.audio=true]
 * @returns {Promise<MediaStream>}
 */
export async function requestCameraStream({
  facing = 'environment',
  deviceId,
  audio = true,
} = {}) {
  if (!isCameraSupported()) {
    throw new Error('Camera API unavailable in this browser.')
  }

  // Tier 1: high-quality 1080p with the requested camera
  const constraintsTiers = [
    {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        facingMode: deviceId ? undefined : { ideal: facing },
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30, max: 60 },
      },
      audio,
    },
    // Tier 2: 720p — broader compatibility
    {
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio,
    },
    // Tier 3: any video
    { video: true, audio },
  ]

  let lastError
  for (const constraints of constraintsTiers) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (err) {
      lastError = err
    }
  }
  throw lastError ?? new Error('Failed to start camera.')
}

/**
 * Stop all tracks on a MediaStream and release the camera.
 */
export function stopStream(stream) {
  if (!stream) return
  stream.getTracks().forEach((t) => {
    try {
      t.stop()
    } catch {
      /* noop */
    }
  })
}

/**
 * Pick the best available MIME type for MediaRecorder.
 * iOS Safari is fussy — order matters.
 */
export function pickRecorderMime() {
  if (typeof MediaRecorder === 'undefined') return ''
  const candidates = [
    'video/mp4;codecs=h264,aac', // iOS Safari
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported?.(m)) return m
  }
  return ''
}

/**
 * Recorder facade — wraps MediaRecorder with a small, stable API.
 *
 * Usage:
 *   const rec = createRecorder(stream, { onDataAvailable, onStop })
 *   rec.start()
 *   rec.stop() // returns Promise<Blob>
 */
export function createRecorder(stream, { mimeType } = {}) {
  const mime = mimeType || pickRecorderMime()
  const chunks = []
  let recorder
  try {
    recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  } catch (err) {
    throw new Error(`MediaRecorder init failed: ${err.message}`)
  }

  recorder.addEventListener('dataavailable', (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data)
  })

  return {
    state: () => recorder.state,
    mime: () => recorder.mimeType,
    start: (timesliceMs = 1000) => recorder.start(timesliceMs),
    pause: () => recorder.pause(),
    resume: () => recorder.resume(),
    /**
     * Stop and resolve to a final Blob. Always call this once.
     */
    stop: () =>
      new Promise((resolve) => {
        recorder.addEventListener(
          'stop',
          () => {
            const blob = new Blob(chunks, { type: mime || 'video/webm' })
            resolve(blob)
          },
          { once: true },
        )
        if (recorder.state !== 'inactive') recorder.stop()
        else resolve(new Blob(chunks, { type: mime || 'video/webm' }))
      }),
  }
}

/**
 * Capture a still frame from a video element. Returns a JPEG Blob.
 * Used for tour thumbnails.
 */
export async function captureFrame(videoEl, { quality = 0.9 } = {}) {
  if (!videoEl || videoEl.readyState < 2) {
    throw new Error('Video not ready for capture.')
  }
  const canvas = document.createElement('canvas')
  canvas.width = videoEl.videoWidth
  canvas.height = videoEl.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoEl, 0, 0)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Snapshot failed'))),
      'image/jpeg',
      quality,
    )
  })
}
