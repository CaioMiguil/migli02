// MIGLI · Frame Grabber
// ---------------------------------------------------------------
// Recebe um <video> que já está exibindo um MediaStream e extrai frames
// JPEG/Blob num intervalo controlado. Os frames são entregues para a
// camada de scan que os agrupa numa sessão.
//
// Por que isso e não MediaRecorder?
//   - MediaRecorder grava vídeo contínuo: ótimo para o usuário "ver"
//     que algo está acontecendo, mas péssimo para pipeline de
//     reconstrução (precisa decodificar tudo de novo no backend).
//   - Frame grabber tira fotos espaçadas: exatamente o que COLMAP /
//     Gaussian Splatting precisam como entrada.
//
// Roda em paralelo com MediaRecorder se quiser ambos. Os dois leem do
// mesmo MediaStream sem custo extra de stream.

/**
 * Cria um grabber atrelado a um elemento <video>.
 *
 * @param {HTMLVideoElement} videoEl
 * @param {Object} opts
 * @param {number} [opts.intervalMs=400]  Tempo entre frames (~2.5 fps por padrão)
 * @param {number} [opts.maxWidth=1600]   Largura máxima do frame em px (mantém aspecto)
 * @param {number} [opts.quality=0.85]    Qualidade JPEG 0..1
 * @param {(frame: GrabbedFrame) => void} [opts.onFrame]
 * @param {(stats: GrabStats) => void}    [opts.onStats]
 */
export function createFrameGrabber(videoEl, opts = {}) {
  const {
    intervalMs = 400,
    maxWidth = 1600,
    quality = 0.85,
    onFrame,
    onStats,
  } = opts

  let timer = null
  let frameCount = 0
  let droppedCount = 0
  let lastFrameAt = 0
  let running = false

  // Reusa o mesmo canvas para evitar realocação por frame
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false })

  async function grabOnce() {
    if (!running) return
    if (!videoEl.videoWidth || !videoEl.videoHeight) {
      droppedCount++
      onStats?.({ frameCount, droppedCount, lastFrameAt })
      return
    }

    const vw = videoEl.videoWidth
    const vh = videoEl.videoHeight
    const scale = Math.min(1, maxWidth / vw)
    const w = Math.round(vw * scale)
    const h = Math.round(vh * scale)
    if (canvas.width !== w) canvas.width = w
    if (canvas.height !== h) canvas.height = h

    try {
      ctx.drawImage(videoEl, 0, 0, w, h)
    } catch {
      droppedCount++
      onStats?.({ frameCount, droppedCount, lastFrameAt })
      return
    }

    // Métricas locais antes de blobificar (mais barato)
    const sharpness = estimateSharpness(ctx, w, h)
    const brightness = estimateBrightness(ctx, w, h)

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) {
      droppedCount++
      return
    }

    frameCount++
    lastFrameAt = Date.now()
    const frame = {
      index: frameCount,
      blob,
      width: w,
      height: h,
      capturedAt: lastFrameAt,
      sharpness,
      brightness,
      bytes: blob.size,
    }
    onFrame?.(frame)
    onStats?.({ frameCount, droppedCount, lastFrameAt })
  }

  return {
    start() {
      if (running) return
      running = true
      // Garante um primeiro frame imediato (em vez de esperar intervalMs)
      grabOnce()
      timer = setInterval(grabOnce, intervalMs)
    },
    pause() {
      running = false
      if (timer) clearInterval(timer)
      timer = null
    },
    stop() {
      running = false
      if (timer) clearInterval(timer)
      timer = null
    },
    getStats() {
      return { frameCount, droppedCount, lastFrameAt }
    },
  }
}

/**
 * Estima nitidez via variância de Laplaciano simplificado num downsample.
 * Valor maior = imagem mais nítida. Range tipicamente 0–80 para frames
 * normais. < 8 indica blur sério.
 */
function estimateSharpness(ctx, w, h) {
  // Sample 40x40 region central (rápido e estável)
  const SAMPLE = 40
  const x = Math.max(0, Math.floor(w / 2 - SAMPLE / 2))
  const y = Math.max(0, Math.floor(h / 2 - SAMPLE / 2))
  const data = ctx.getImageData(x, y, SAMPLE, SAMPLE).data

  let sum = 0
  let sumSq = 0
  let count = 0
  for (let i = SAMPLE + 1; i < SAMPLE * SAMPLE - SAMPLE - 1; i++) {
    const idx = i * 4
    if (idx + 4 >= data.length) break
    const center = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
    const left = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3
    const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3
    const lap = 2 * center - left - right
    sum += lap
    sumSq += lap * lap
    count++
  }
  if (count === 0) return 0
  const mean = sum / count
  return Math.sqrt(sumSq / count - mean * mean)
}

/**
 * Estima brilho médio (0..255) num downsample da imagem.
 * < 35 = ambiente muito escuro, > 230 = estourado.
 */
function estimateBrightness(ctx, w, h) {
  const SAMPLE = 24
  const x = Math.max(0, Math.floor(w / 2 - SAMPLE / 2))
  const y = Math.max(0, Math.floor(h / 2 - SAMPLE / 2))
  const data = ctx.getImageData(x, y, SAMPLE, SAMPLE).data
  let sum = 0
  let count = 0
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3
    count++
  }
  return count > 0 ? sum / count : 0
}
