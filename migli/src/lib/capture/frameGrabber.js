// MIGLI · Frame Grabber v2
// ---------------------------------------------------------------
// Extrai frames JPEG do <video> num intervalo controlado.
//
// Otimizações vs v1:
//   - Métricas (blur/brightness) calculadas a cada N frames, não em todos
//   - Uma única chamada de getImageData por janela de métrica em vez de duas
//   - Pausa automática quando a aba está oculta (Page Visibility API)
//   - Pausa o timer quando o tab fica em background pra não queimar bateria
//   - Downsample fixo 32x32 pra métricas (independente da resolução do vídeo)

const METRIC_EVERY_N = 3 // estima sharpness/brightness a cada 3 frames
const METRIC_SIZE = 32   // janela central 32x32 para cálculo

/**
 * Cria um grabber atrelado a um elemento <video>.
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
  let metricCounter = 0

  // Últimas métricas conhecidas — reutilizadas entre amostragens
  let lastSharpness = 25
  let lastBrightness = 128

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false })

  // Canvas dedicado pra métricas — bem menor, getImageData barato
  const metricCanvas = document.createElement('canvas')
  metricCanvas.width = METRIC_SIZE
  metricCanvas.height = METRIC_SIZE
  const metricCtx = metricCanvas.getContext('2d', {
    alpha: false,
    willReadFrequently: true, // hint para o browser otimizar getImageData
  })

  async function grabOnce() {
    if (!running) return
    if (!videoEl.videoWidth || !videoEl.videoHeight) {
      droppedCount++
      onStats?.({ frameCount, droppedCount, lastFrameAt })
      return
    }
    // Skip quando aba não visível
    if (document.visibilityState === 'hidden') {
      droppedCount++
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

    // Métricas: só a cada N frames + sempre no 1º frame
    let sharpness = lastSharpness
    let brightness = lastBrightness
    const shouldMeasure = metricCounter % METRIC_EVERY_N === 0
    metricCounter++

    if (shouldMeasure) {
      try {
        // Desenha downsample no canvas pequeno (rápido — o browser cuida do scale)
        metricCtx.drawImage(videoEl, 0, 0, METRIC_SIZE, METRIC_SIZE)
        const data = metricCtx.getImageData(0, 0, METRIC_SIZE, METRIC_SIZE).data
        sharpness = estimateSharpness(data, METRIC_SIZE)
        brightness = estimateBrightness(data)
        lastSharpness = sharpness
        lastBrightness = brightness
      } catch {
        // ignora — usa valores anteriores
      }
    }

    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    )
    if (!blob) {
      droppedCount++
      return
    }

    frameCount++
    lastFrameAt = Date.now()
    onFrame?.({
      index: frameCount,
      blob,
      width: w,
      height: h,
      capturedAt: lastFrameAt,
      sharpness,
      brightness,
      bytes: blob.size,
    })
    onStats?.({ frameCount, droppedCount, lastFrameAt })
  }

  // Listener de visibilidade — pausa quando vai pro background
  const onVisChange = () => {
    if (document.visibilityState === 'hidden' && timer) {
      clearInterval(timer)
      timer = null
    } else if (document.visibilityState === 'visible' && running && !timer) {
      timer = setInterval(grabOnce, intervalMs)
    }
  }
  document.addEventListener('visibilitychange', onVisChange)

  return {
    start() {
      if (running) return
      running = true
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
      document.removeEventListener('visibilitychange', onVisChange)
    },
    getStats() {
      return { frameCount, droppedCount, lastFrameAt }
    },
  }
}

/**
 * Variância de Laplaciano horizontal num downsample 32x32.
 * O canvas pequeno torna a varredura O(1024) — desprezível.
 */
function estimateSharpness(data, size) {
  let sum = 0
  let sumSq = 0
  let count = 0
  // Pula bordas pra evitar wraparound; varre apenas centro
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = (y * size + x) * 4
      const c = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
      const l = (data[idx - 4] + data[idx - 3] + data[idx - 2]) / 3
      const r = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3
      const lap = 2 * c - l - r
      sum += lap
      sumSq += lap * lap
      count++
    }
  }
  if (count === 0) return 0
  const mean = sum / count
  return Math.sqrt(Math.max(0, sumSq / count - mean * mean))
}

function estimateBrightness(data) {
  let sum = 0
  let count = 0
  // amostra cada 4º pixel — já tá em downsample 32x32 = 1024 px
  for (let i = 0; i < data.length; i += 16) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3
    count++
  }
  return count > 0 ? sum / count : 0
}
