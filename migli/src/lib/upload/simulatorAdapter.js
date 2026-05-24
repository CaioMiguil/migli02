// MIGLI · Simulator Upload Adapter
// ---------------------------------------------------------------
// Drop-in adapter that simulates a real upload + Gaussian Splat reconstruction
// pipeline with realistic timings, jitter, and stage transitions.
//
// Swap for `r2Adapter` (TODO) to ship to production.

import { ProcessingStage } from './uploadQueue'

const SIM_UPLOAD_SPEED_BPS = 2.5 * 1024 * 1024 // 2.5 MB/s simulated bandwidth
const MIN_UPLOAD_MS = 1500
const MAX_UPLOAD_MS = 7000

/**
 * Returns a uniform delay based on file size with caps.
 */
function estimateUploadMs(file) {
  if (!file?.size) return 3000
  const ms = (file.size / SIM_UPLOAD_SPEED_BPS) * 1000
  return Math.min(MAX_UPLOAD_MS, Math.max(MIN_UPLOAD_MS, ms))
}

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      const err = new Error('Aborted')
      err.name = 'AbortError'
      reject(err)
    })
  })
}

async function animateProgress(durationMs, onProgress, signal) {
  const start = performance.now()
  return new Promise((resolve, reject) => {
    let raf
    const tick = () => {
      if (signal?.aborted) {
        cancelAnimationFrame(raf)
        const err = new Error('Aborted')
        err.name = 'AbortError'
        return reject(err)
      }
      const elapsed = performance.now() - start
      const pct = Math.min(100, (elapsed / durationMs) * 100)
      onProgress(pct)
      if (pct >= 100) {
        cancelAnimationFrame(raf)
        resolve()
      } else {
        raf = requestAnimationFrame(tick)
      }
    }
    raf = requestAnimationFrame(tick)
  })
}

export const simulatorAdapter = {
  /**
   * Simulate an upload — emit smooth 0→100 progress over a realistic duration.
   */
  async upload(item, { onProgress, signal }) {
    const dur = estimateUploadMs(item.file)
    await animateProgress(dur, onProgress, signal)
    return {
      // Fake URL & object key — replace with R2 response shape
      url: `migli://uploads/${item.id}`,
      key: `uploads/${item.id}`,
      bytes: item.size,
    }
  },

  /**
   * Simulate the AI splat pipeline. Each stage gets its own progress curve so
   * the UI can show a multi-step processor that feels like real work.
   *
   * Emits both the current stage AND a global progress (0–100 across all
   * stages combined), so the progress bar advances monotonically.
   */
  async process(item, { onStage, signal }) {
    const stages = [
      { stage: ProcessingStage.EXTRACTING_FRAMES, ms: 1600 },
      { stage: ProcessingStage.ESTIMATING_POSES, ms: 2200 },
      { stage: ProcessingStage.RECONSTRUCTING, ms: 2800 },
      { stage: ProcessingStage.OPTIMIZING, ms: 1500 },
      { stage: ProcessingStage.PUBLISHING, ms: 900 },
    ]
    const totalMs = stages.reduce((s, x) => s + x.ms, 0)
    let elapsedMs = 0

    for (const { stage, ms } of stages) {
      const stageStart = elapsedMs
      await animateProgress(
        ms,
        (stagePct) => {
          const globalPct = ((stageStart + (stagePct / 100) * ms) / totalMs) * 100
          onStage(stage, globalPct)
        },
        signal,
      )
      elapsedMs += ms
    }
  },
}

/* -------------------------------------------------------------
 * SHIP-READY TEMPLATE for the real R2 adapter.
 * Uncomment + wire when you stand up the Cloudflare Worker that
 * issues pre-signed PUT URLs.
 * ------------------------------------------------------------- */
/*
export function createR2Adapter({ apiBase }) {
  return {
    async upload(item, { onProgress, signal }) {
      // 1. Ask the API for a pre-signed PUT URL
      const presign = await fetch(`${apiBase}/uploads/presign`, {
        method: 'POST',
        signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: item.name, type: item.type, size: item.size }),
      }).then(r => r.json())

      // 2. PUT the file directly to R2 with progress
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', presign.url)
        xhr.upload.onprogress = (e) => e.lengthComputable && onProgress((e.loaded / e.total) * 100)
        xhr.onload = () => (xhr.status < 400 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)))
        xhr.onerror = () => reject(new Error('Network error'))
        signal?.addEventListener('abort', () => xhr.abort())
        xhr.send(item.file)
      })

      return { url: presign.publicUrl, key: presign.key, bytes: item.size }
    },

    async process(item, { onStage, signal }) {
      // 3. Poll the backend pipeline status every 2s
      while (true) {
        if (signal?.aborted) throw Object.assign(new Error('Aborted'), { name: 'AbortError' })
        const status = await fetch(`${apiBase}/uploads/${item.id}/status`, { signal }).then(r => r.json())
        onStage(status.stage, status.progress)
        if (status.stage === 'done') return
        await new Promise(r => setTimeout(r, 2000))
      }
    },
  }
}
*/
