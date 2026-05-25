// MIGLI · Scan Upload Service
// ---------------------------------------------------------------
// Recebe uma sessão de scan (frames + metadados) e:
//
//   1. Cria/atualiza um registro `properties` no Supabase (status='uploading')
//   2. Para cada frame: pede pre-signed URL → PUT na R2
//   3. Quando tudo subiu: atualiza properties.status='processing' + guarda
//      lista de keys R2 no metadata
//   4. Onde houver pipeline GPU real (Fase 4), o worker consome esses
//      frames e marca status='published' + splat_url
//
// Tudo isso reusa a infra de Fase 2 (cloud/r2Adapter já existe pra vídeos).
// Aqui só adicionamos a especialização "scan session = N frames".

import { CLOUD, isCloudConfigured } from './config'
import { getSupabase } from './supabaseClient'
import { createProperty, updateProperty } from './propertyService'

const FRAME_CONCURRENCY = 3 // sobe 3 frames em paralelo

async function authHeaders() {
  const sb = getSupabase()
  if (!sb) return {}
  const { data } = await sb.auth.getSession()
  const token = data?.session?.access_token
  return token ? { authorization: `Bearer ${token}` } : {}
}

/**
 * Inicia uma sessão de upload de scan.
 *
 * @param {Object} session
 * @param {Array<{blob, index, sharpness, brightness, width, height}>} session.frames
 * @param {number} session.durationMs
 * @param {number} session.capturedAt
 * @param {Object} [opts]
 * @param {(stage, progress) => void} [opts.onProgress]
 * @param {string} [opts.propertyName]  Nome do imóvel (default: data + hora)
 * @returns {Promise<{property, propertyId, frameKeys}>}
 */
export async function uploadScanSession(session, opts = {}) {
  const { onProgress, propertyName } = opts
  const frames = session.frames || []
  if (frames.length === 0) {
    throw new Error('Sessão de scan sem frames — nada para enviar.')
  }

  if (!isCloudConfigured()) {
    // Modo demo — apenas simula tempos e retorna mock
    onProgress?.('creating', 0)
    await wait(400)
    onProgress?.('uploading', 0.1)
    for (let i = 0; i < frames.length; i++) {
      await wait(25)
      onProgress?.('uploading', 0.1 + (i / frames.length) * 0.85)
    }
    onProgress?.('finalizing', 0.96)
    await wait(400)
    onProgress?.('done', 1)
    return {
      property: null,
      propertyId: null,
      frameKeys: frames.map((f) => `demo/frame_${f.index}.jpg`),
    }
  }

  // 1. Criar property record
  onProgress?.('creating', 0)
  const name = propertyName || defaultPropertyName(session.capturedAt)
  const property = await createProperty({
    name,
    subtitle: `${frames.length} frames · ${Math.round(session.durationMs / 1000)}s`,
    metadata: {
      capture: {
        frameCount: frames.length,
        durationMs: session.durationMs,
        capturedAt: session.capturedAt,
      },
    },
  })
  await updateProperty(property.id, { status: 'uploading' })

  // 2. Subir frames com concorrência limitada
  const apiBase = CLOUD.uploadApi.baseUrl
  if (!apiBase) {
    throw new Error('VITE_UPLOAD_API_URL não configurado.')
  }

  onProgress?.('uploading', 0.05)
  const frameKeys = await uploadFramesConcurrent(
    frames,
    property.id,
    apiBase,
    (done, total) => onProgress?.('uploading', 0.05 + (done / total) * 0.85),
  )

  // 3. Finalizar — marca como processing e guarda keys
  onProgress?.('finalizing', 0.93)
  await updateProperty(property.id, {
    status: 'processing',
    metadata: {
      ...property.metadata,
      frames: { keys: frameKeys, count: frameKeys.length },
    },
  })

  // 4. Pedir ao backend para enfileirar reconstrução (no-op se não houver
  // pipeline GPU configurado; veja docs/PHASE_4_PIPELINE.md)
  try {
    await fetch(`${apiBase}/scans/${property.id}/process`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(await authHeaders()),
      },
      body: JSON.stringify({ frameCount: frameKeys.length }),
    })
  } catch {
    // Não-fatal — frames já estão no R2, pode reprocessar depois
    // eslint-disable-next-line no-console
    console.warn('[MIGLI] /scans/:id/process não respondeu — frames salvos, pipeline pendente.')
  }

  onProgress?.('done', 1)

  return {
    property,
    propertyId: property.id,
    frameKeys,
  }
}

/* ──────────────────── helpers ──────────────────── */

async function uploadFramesConcurrent(frames, propertyId, apiBase, onTick) {
  const keys = new Array(frames.length)
  let nextIdx = 0
  let completed = 0

  async function worker() {
    while (true) {
      const myIdx = nextIdx++
      if (myIdx >= frames.length) return
      const frame = frames[myIdx]
      try {
        const key = await uploadSingleFrame(frame, propertyId, apiBase)
        keys[myIdx] = key
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn(`[MIGLI] Frame ${frame.index} falhou:`, err)
        keys[myIdx] = null
      }
      completed++
      onTick(completed, frames.length)
    }
  }

  await Promise.all(Array.from({ length: FRAME_CONCURRENCY }, () => worker()))
  return keys.filter(Boolean)
}

async function uploadSingleFrame(frame, propertyId, apiBase) {
  // 1. Presign
  const presignRes = await fetch(`${apiBase}/scans/${propertyId}/frames/presign`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(await authHeaders()),
    },
    body: JSON.stringify({
      index: frame.index,
      contentType: 'image/jpeg',
      size: frame.bytes,
      sharpness: frame.sharpness,
      brightness: frame.brightness,
      width: frame.width,
      height: frame.height,
    }),
  })
  if (!presignRes.ok) {
    throw new Error(`Presign HTTP ${presignRes.status}`)
  }
  const { url, key } = await presignRes.json()

  // 2. PUT na R2
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': 'image/jpeg' },
    body: frame.blob,
  })
  if (!putRes.ok) {
    throw new Error(`R2 PUT HTTP ${putRes.status}`)
  }
  return key
}

function defaultPropertyName(capturedAt) {
  const d = new Date(capturedAt || Date.now())
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `Imóvel ${dd}/${mm} · ${hh}:${min}`
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms))
}
