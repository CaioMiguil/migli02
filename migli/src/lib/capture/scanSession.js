// MIGLI · Scan Session
// ---------------------------------------------------------------
// Orquestra uma sessão de captura guiada. Combina:
//
//   - Stream da câmera (já criado pelo cameraEngine)
//   - Frame grabber (extrai JPEGs em intervalo)
//   - Sensor de orientação (deviceorientation API)
//   - Heurísticas de motion guidance (rápido/lento/parado)
//   - Máquina de estados de fases (intro → escaneando → finalizando → done)
//
// A camada React consome via `useScanSession()` e renderiza os overlays.

import { createFrameGrabber } from './frameGrabber'

export const ScanPhase = {
  IDLE: 'idle',
  INTRO: 'intro',          // Primeiros 2s: usuário lendo "movimente devagar"
  SCANNING: 'scanning',    // Capturando frames
  FINALIZING: 'finalizing', // Últimos frames + upload kick-off
  DONE: 'done',
}

export const MotionHint = {
  PERFECT: 'perfect',      // Velocidade boa
  TOO_FAST: 'too_fast',    // Está girando muito rápido
  TOO_SLOW: 'too_slow',    // Parado / quase parado
  TOO_DARK: 'too_dark',    // Ambiente muito escuro
  TOO_BLURRY: 'too_blurry', // Frames borrados
  HOLD_STEADY: 'hold_steady',
}

/**
 * Cria uma sessão de scan.
 *
 * @param {Object} opts
 * @param {HTMLVideoElement} opts.videoEl
 * @param {MediaStream}      opts.stream
 * @param {number}           [opts.targetFrames=60] Quantidade alvo de frames
 * @param {number}           [opts.intervalMs=350]
 * @param {(state) => void}  opts.onUpdate           Chamado em cada mudança
 */
export function createScanSession({
  videoEl,
  stream,
  targetFrames = 60,
  intervalMs = 350,
  onUpdate,
}) {
  /* ──────────────────── Estado interno ──────────────────── */
  const state = {
    phase: ScanPhase.IDLE,
    progress: 0,           // 0..1
    framesCaptured: 0,
    framesAccepted: 0,
    framesRejected: 0,
    targetFrames,
    elapsedMs: 0,
    motionHint: MotionHint.HOLD_STEADY,
    orientation: { alpha: 0, beta: 0, gamma: 0 },
    coverage: 0,           // 0..1, aproximação de cobertura panorâmica
    coverageMap: new Array(12).fill(false), // bits por segmento de 30°
    heading: 0,            // yaw atual (alpha) em graus
    coverageRatio: 0,      // bits acesos / 12
    lastSharpness: 0,
    lastBrightness: 0,
    errors: [],
  }

  const frames = []          // {index, blob, ...}
  let startedAt = 0
  let lastOrientation = null
  let totalYawDelta = 0      // soma absoluta de rotações
  let phaseTimer = null

  const emit = () => onUpdate?.({ ...state })

  /* ──────────────────── Sensor de orientação ──────────────────── */
  const onOrientation = (e) => {
    state.orientation = { alpha: e.alpha ?? 0, beta: e.beta ?? 0, gamma: e.gamma ?? 0 }
    state.heading = state.orientation.alpha
    // Marca segmento atual como coberto (apenas durante scanning)
    if (state.phase === ScanPhase.SCANNING) {
      const idx = Math.floor(((state.heading + 360) % 360) / 30) % 12
      if (!state.coverageMap[idx]) {
        state.coverageMap = state.coverageMap.slice()
        state.coverageMap[idx] = true
        state.coverageRatio =
          state.coverageMap.filter(Boolean).length / 12
      }
    }
    if (lastOrientation) {
      const dAlpha = Math.abs(diffAngle(e.alpha ?? 0, lastOrientation.alpha))
      totalYawDelta += dAlpha
      // Cobertura "ideal" = 360° de yaw durante a sessão
      state.coverage = Math.min(1, totalYawDelta / 360)

      // Motion hint baseado em velocidade angular
      if (state.phase === ScanPhase.SCANNING) {
        if (dAlpha > 8) state.motionHint = MotionHint.TOO_FAST
        else if (dAlpha < 0.4) state.motionHint = MotionHint.TOO_SLOW
        else state.motionHint = MotionHint.PERFECT
      }
    }
    lastOrientation = { ...state.orientation }
  }

  /* ──────────────────── Frame grabber ──────────────────── */
  // Thresholds ajustados pro novo sampling 32x32:
  //   - brightness < 15 = ambiente realmente escuro (não 28)
  //   - sharpness < 2  = realmente borrado (não 6)
  // Importante: mesmo "rejeitado" o frame ENTRA na sessão. A rejeição
  // só vira hint visual pro usuário melhorar a captura — não bloqueia
  // o progresso. Antes esse filtro travava a barra em 5-10%.
  const grabber = createFrameGrabber(videoEl, {
    intervalMs,
    onFrame: (frame) => {
      state.framesCaptured++
      state.lastSharpness = frame.sharpness
      state.lastBrightness = frame.brightness

      // Hint visual — não bloqueia aceitação
      if (frame.brightness < 15) {
        state.motionHint = MotionHint.TOO_DARK
      } else if (frame.sharpness < 2) {
        state.motionHint = MotionHint.TOO_BLURRY
      } else if (
        state.motionHint === MotionHint.HOLD_STEADY ||
        state.motionHint === MotionHint.TOO_DARK ||
        state.motionHint === MotionHint.TOO_BLURRY
      ) {
        state.motionHint = MotionHint.PERFECT
      }

      // Aceita TODOS os frames — backend de reconstrução filtra depois
      state.framesAccepted++
      frames.push(frame)
      state.progress = Math.min(1, state.framesAccepted / targetFrames)

      state.elapsedMs = Date.now() - startedAt
      emit()

      // Auto-transição para finalizing
      if (state.framesAccepted >= targetFrames && state.phase === ScanPhase.SCANNING) {
        transition(ScanPhase.FINALIZING)
      }
    },
  })

  /* ──────────────────── Máquina de fases ──────────────────── */
  function transition(next) {
    state.phase = next
    emit()

    if (phaseTimer) {
      clearTimeout(phaseTimer)
      phaseTimer = null
    }

    if (next === ScanPhase.INTRO) {
      // 2.5s de intro, depois entra em scanning
      phaseTimer = setTimeout(() => {
        transition(ScanPhase.SCANNING)
        grabber.start()
      }, 2500)
    } else if (next === ScanPhase.FINALIZING) {
      grabber.pause()
      // 1.5s para "finalizando captura" antes de marcar done
      phaseTimer = setTimeout(() => transition(ScanPhase.DONE), 1500)
    } else if (next === ScanPhase.DONE) {
      grabber.stop()
    }
  }

  /* ──────────────────── API pública ──────────────────── */
  return {
    start() {
      if (state.phase !== ScanPhase.IDLE) return
      startedAt = Date.now()
      transition(ScanPhase.INTRO)
    },

    /**
     * Ingere uma leitura de orientação. Chamado pela camada React
     * (useDeviceOrientation) após resolver o gate de permissão iOS.
     */
    ingestOrientation({ alpha, beta, gamma }) {
      onOrientation({ alpha, beta, gamma })
    },

    /** Finaliza antes de atingir target — usuário decide parar */
    finishEarly() {
      if (state.phase === ScanPhase.SCANNING) {
        transition(ScanPhase.FINALIZING)
      }
    },

    /** Aborta sessão sem produzir resultado */
    cancel() {
      grabber.stop()
      if (phaseTimer) clearTimeout(phaseTimer)
      state.phase = ScanPhase.IDLE
      emit()
    },

    /** Retorna frames coletados — usado para envio ao backend */
    getFrames() {
      return frames.slice()
    },

    getState() {
      return { ...state }
    },

    dispose() {
      this.cancel()
      // Não para o stream — quem criou (cameraEngine) é responsável
    },
  }

  // Avoid unused warning for stream parameter
  // eslint-disable-next-line no-unused-vars
  function _useStream() { return stream }
}

function diffAngle(a, b) {
  let d = a - b
  while (d > 180) d -= 360
  while (d < -180) d += 360
  return d
}
