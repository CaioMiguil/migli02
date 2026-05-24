// MIGLI · Device Capability Detection
// ---------------------------------------------------------------
// Pure JS — runs once at boot, returns a profile the rendering layer
// uses to pick LOD, resolution, and quality presets.
//
// We err on the side of "good experience" — false negatives (treating
// a fast device as slow) are better than false positives (stuttering
// on a low-end phone).

const isBrowser = typeof window !== 'undefined'

function safeNumber(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

/**
 * Returns a stable device profile useful for adaptive rendering.
 *
 * tier:
 *   'low'    — older phones, mid-range tablets, integrated GPUs
 *   'mid'    — mid-to-high-end phones, most laptops
 *   'high'   — flagship phones, desktops with discrete GPUs
 *
 * Use the tier as the headline signal; consult specific fields when needed.
 */
export function detectDeviceProfile() {
  if (!isBrowser) {
    return { tier: 'mid', isMobile: false, isTouch: false, dpr: 1, cores: 4, memoryGB: 4, hasWebGL2: false }
  }

  const ua = navigator.userAgent || ''
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua)
  const isIOS = /iPhone|iPad|iPod/i.test(ua)
  const isTouch = matchMedia?.('(hover: none) and (pointer: coarse)').matches ?? isMobile

  const dpr = Math.min(window.devicePixelRatio || 1, 3)
  const cores = safeNumber(navigator.hardwareConcurrency, isMobile ? 4 : 8)
  const memoryGB = safeNumber(navigator.deviceMemory, isMobile ? 3 : 8)

  // Saver mode? Respect it.
  const saveData = navigator.connection?.saveData === true
  const effectiveType = navigator.connection?.effectiveType // 'slow-2g'|'2g'|'3g'|'4g'

  // Probe WebGL2 (splats render fine on WebGL1 but WebGL2 is faster)
  let hasWebGL2 = false
  let gpuRenderer = ''
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    hasWebGL2 = !!gl
    const ctx = gl || canvas.getContext('webgl')
    if (ctx) {
      const dbg = ctx.getExtension('WEBGL_debug_renderer_info')
      if (dbg) gpuRenderer = String(ctx.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '')
    }
  } catch {
    /* noop */
  }

  // Heuristic tier
  let tier = 'mid'
  if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || memoryGB <= 2 || cores <= 2) {
    tier = 'low'
  } else if (isMobile && memoryGB < 4) {
    tier = 'low'
  } else if (!isMobile && memoryGB >= 8 && cores >= 8) {
    tier = 'high'
  } else if (isMobile && memoryGB >= 6 && /A1[5-9]|A2\d|M[12]|Snapdragon 8|Tensor G/i.test(gpuRenderer + ua)) {
    tier = 'high'
  }

  return {
    tier,
    isMobile,
    isIOS,
    isTouch,
    dpr,
    cores,
    memoryGB,
    saveData,
    effectiveType,
    hasWebGL2,
    gpuRenderer,
  }
}

/**
 * Render quality presets keyed by tier. Used by the splat viewer to pick
 * canvas resolution, antialiasing, fog, and shadow settings.
 */
export const QUALITY_PRESETS = {
  low: {
    resolutionScale: 0.75,
    maxDpr: 1.5,
    antialias: false,
    shadows: false,
    fog: true,
    splatLod: 'low',
    label: 'Modo econômico',
  },
  mid: {
    resolutionScale: 1.0,
    maxDpr: 2,
    antialias: false,
    shadows: true,
    fog: true,
    splatLod: 'mid',
    label: 'Modo padrão',
  },
  high: {
    resolutionScale: 1.0,
    maxDpr: 2,
    antialias: true,
    shadows: true,
    fog: true,
    splatLod: 'high',
    label: 'Modo alta qualidade',
  },
}

/**
 * Get the quality preset for a given tier, with optional manual override.
 */
export function getQualityPreset(tier, override) {
  if (override && QUALITY_PRESETS[override]) return QUALITY_PRESETS[override]
  return QUALITY_PRESETS[tier] || QUALITY_PRESETS.mid
}
