// MIGLI · Upload Queue Engine
// ---------------------------------------------------------------
// Cloud-agnostic upload queue. Today it simulates progress and emits
// realistic state transitions. Tomorrow it talks to Cloudflare R2 (or any S3-
// compatible storage) without the React layer changing a single line.
//
// Architecture:
//
//     UploadQueue
//        ├── Items (id, file, status, progress, result)
//        └── Adapter (simulator | r2 | s3 | gcs)
//
// The Adapter interface:
//     adapter.upload(item, { onProgress, signal }) → Promise<{ url, key }>
//
// Swapping adapters changes ONE line in App.jsx wiring. The queue contract,
// the React hook, and the UI all stay identical.

import { v4 as uuid } from './uuid'

/**
 * Upload item status machine.
 */
export const UploadStatus = {
  QUEUED: 'queued',
  UPLOADING: 'uploading',
  PROCESSING: 'processing', // server-side splat reconstruction
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELED: 'canceled',
}

/**
 * Server-side processing stages — drives the AI pipeline UI.
 * Mirrors the actual stages a Gaussian Splat pipeline runs:
 *   1. ingest video / frame extraction
 *   2. SfM / pose estimation
 *   3. splat reconstruction
 *   4. compression + delivery
 */
export const ProcessingStage = {
  EXTRACTING_FRAMES: 'extracting_frames',
  ESTIMATING_POSES: 'estimating_poses',
  RECONSTRUCTING: 'reconstructing',
  OPTIMIZING: 'optimizing',
  PUBLISHING: 'publishing',
  DONE: 'done',
}

export const STAGE_LABELS = {
  extracting_frames: 'Extraindo frames do vídeo',
  estimating_poses: 'Mapeando ambiente',
  reconstructing: 'Reconstruindo em 3D',
  optimizing: 'Refinando geometria',
  publishing: 'Publicando seu tour',
  done: 'Pronto ✦',
}

/**
 * Format bytes for display.
 */
export function formatBytes(b) {
  if (b == null) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

/**
 * Create a new upload item shell.
 */
export function createUploadItem(file, meta = {}) {
  return {
    id: uuid(),
    file,
    name: meta.name || file.name || 'Capture',
    type: file.type || 'application/octet-stream',
    size: file.size || 0,
    status: UploadStatus.QUEUED,
    progress: 0,
    stage: null,
    error: null,
    result: null,
    createdAt: Date.now(),
    meta,
  }
}

/**
 * Lightweight pub/sub queue. Not a React state — pass it into useUploadQueue
 * for a React-friendly view.
 */
export class UploadQueue {
  constructor({ adapter, concurrency = 2 } = {}) {
    this.adapter = adapter
    this.concurrency = concurrency
    this.items = []
    this.controllers = new Map() // id → AbortController
    this.listeners = new Set()
  }

  /* ── pub/sub ──────────────────────────────────────────────── */
  subscribe(fn) {
    this.listeners.add(fn)
    fn(this.items)
    return () => this.listeners.delete(fn)
  }
  _emit() {
    // Always emit a new array reference so React detects the change.
    const snapshot = this.items.map((i) => ({ ...i }))
    this.listeners.forEach((fn) => fn(snapshot))
  }
  _patch(id, patch) {
    const item = this.items.find((i) => i.id === id)
    if (!item) return
    Object.assign(item, patch)
    this._emit()
  }

  /* ── queue actions ────────────────────────────────────────── */
  enqueue(files, meta = {}) {
    const arr = Array.isArray(files) ? files : [files]
    const items = arr.map((f) => createUploadItem(f, meta))
    this.items.push(...items)
    this._emit()
    this._drain()
    return items
  }

  cancel(id) {
    const ctrl = this.controllers.get(id)
    if (ctrl) ctrl.abort()
    this._patch(id, { status: UploadStatus.CANCELED })
  }

  remove(id) {
    this.items = this.items.filter((i) => i.id !== id)
    this._emit()
  }

  clear() {
    this.items.forEach((i) => this.cancel(i.id))
    this.items = []
    this._emit()
  }

  /* ── worker ───────────────────────────────────────────────── */
  _activeCount() {
    return this.items.filter(
      (i) =>
        i.status === UploadStatus.UPLOADING ||
        i.status === UploadStatus.PROCESSING,
    ).length
  }

  async _drain() {
    while (this._activeCount() < this.concurrency) {
      const next = this.items.find((i) => i.status === UploadStatus.QUEUED)
      if (!next) return
      this._processItem(next)
    }
  }

  async _processItem(item) {
    const ctrl = new AbortController()
    this.controllers.set(item.id, ctrl)

    try {
      this._patch(item.id, { status: UploadStatus.UPLOADING, progress: 0 })

      const result = await this.adapter.upload(item, {
        signal: ctrl.signal,
        onProgress: (p) => this._patch(item.id, { progress: p }),
      })

      // Server-side processing simulation (or real polling)
      this._patch(item.id, {
        status: UploadStatus.PROCESSING,
        progress: 0,
        result,
      })
      await this.adapter.process(item, {
        signal: ctrl.signal,
        onStage: (stage, progress) =>
          this._patch(item.id, { stage, progress }),
      })

      this._patch(item.id, {
        status: UploadStatus.COMPLETED,
        stage: ProcessingStage.DONE,
        progress: 100,
      })
    } catch (err) {
      if (err.name !== 'AbortError') {
        this._patch(item.id, {
          status: UploadStatus.FAILED,
          error: err.message || 'Upload failed',
        })
      }
    } finally {
      this.controllers.delete(item.id)
      this._drain()
    }
  }
}
