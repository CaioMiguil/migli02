// MIGLI · Scan Upload Service
// ---------------------------------------------------------------
// Recebe uma sessão de scan e a transforma num registro de propriedade
// real (com frames persistidos).
//
// Cloud configurado → cria no Supabase + sobe frames pra R2
// Cloud não configurado → cria localmente (IndexedDB) com frames offline
//
// Em AMBOS os casos: ao final, a Biblioteca recebe um novo card.
// É essa garantia que mata o feeling "fake" do app.

import { CLOUD, isCloudConfigured } from './config'
import { getSupabase } from './supabaseClient'
import { createProperty, updateProperty } from './propertyService'
import { localStoreFrame } from './localStore'

const FRAME_CONCURRENCY = 3

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
 * @returns {Promise<{property, propertyId, frameKeys}>}
 */
export async function uploadScanSession(session, opts = {}) {
  const { onProgress, propertyName } = opts
  const frames = session.frames || []
  if (frames.length === 0) {
    throw new Error('Sessão de scan sem frames — nada para enviar.')
  }

  const name = propertyName || defaultPropertyName(session.capturedAt)
  const baseMeta = {
    capture: {
      frameCount: frames.length,
      durationMs: session.durationMs,
      capturedAt: session.capturedAt,
    },
  }

  /* ───── 1. Criar property (sempre) ───── */
  onProgress?.('creating', 0)
  const property = await createProperty({
    name,
    subtitle: `${frames.length} frames · ${Math.round(session.durationMs / 1000)}s`,
    status: 'uploading',
    metadata: baseMeta,
  })

  /* ───── 2. Gerar thumbnail do 1º frame "bom" ───── */
  onProgress?.('creating', 0.06)
  try {
    const thumbBlob = await pickThumbBlob(frames)
    if (thumbBlob) {
      const thumbUrl = await blobToDataUrl(thumbBlob)
      await updateProperty(property.id, { thumb_url: thumbUrl })
      property.thumb_url = thumbUrl
    }
  } catch {
    /* sem thumb tudo bem */
  }

  /* ───── 3a. Cloud configurado → upload R2 ───── */
  if (isCloudConfigured() && CLOUD.uploadApi.baseUrl) {
    onProgress?.('uploading', 0.1)
    let frameKeys = []
    try {
      frameKeys = await uploadFramesConcurrent(
        frames,
        property.id,
        CLOUD.uploadApi.baseUrl,
        (done, total) =>
          onProgress?.('uploading', 0.1 + (done / total) * 0.78),
      )

      onProgress?.('finalizing', 0.9)
      await updateProperty(property.id, {
        status: 'processing',
        metadata: {
          ...baseMeta,
          frames: { keys: frameKeys, count: frameKeys.length },
        },
      })

      // Enfileira processing — no-op se Worker não tem pipeline ainda
      try {
        await fetch(`${CLOUD.uploadApi.baseUrl}/scans/${property.id}/process`, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            ...(await authHeaders()),
          },
          body: JSON.stringify({ frameCount: frameKeys.length }),
        })
      } catch {
        // eslint-disable-next-line no-console
        console.warn('[MIGLI] /scans/:id/process indisponível — frames salvos.')
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[MIGLI] Upload cloud falhou, mantendo local:', err)
    }

    /* ───── 3b. Modo local — persiste frames em IndexedDB ───── */
    await persistFramesLocally(frames, property.id, onProgress)
    onProgress?.('done', 1)
    return { property, propertyId: property.id, frameKeys }
  }

  /* ───── 4. Modo demo (sem cloud) — só local ───── */
  await persistFramesLocally(frames, property.id, onProgress)
  await updateProperty(property.id, {
    status: 'processing',
    metadata: {
      ...baseMeta,
      frames: { count: frames.length, storage: 'local' },
    },
  })
  onProgress?.('done', 1)
  return {
    property,
    propertyId: property.id,
    frameKeys: frames.map((f) => `local/${property.id}/${f.index}.jpg`),
  }
}

/**
 * Marca uma propriedade como "publicada" depois que o usuário
 * fez a reconstrução manualmente (Opção 3) e está subindo um .sog.
 */
export async function publishPropertyWithSplat(propertyId, splatUrl) {
  return updateProperty(propertyId, {
    status: 'published',
    splat_url: splatUrl,
  })
}

/* ──────────────────── helpers ──────────────────── */

async function persistFramesLocally(frames, propertyId, onProgress) {
  // Roda em background, não bloqueia
  let done = 0
  for (const frame of frames) {
    await localStoreFrame(propertyId, frame)
    done++
    onProgress?.('uploading', 0.1 + (done / frames.length) * 0.78)
  }
}

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
        keys[myIdx] = await uploadSingleFrame(frame, propertyId, apiBase)
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
  if (!presignRes.ok) throw new Error(`Presign HTTP ${presignRes.status}`)
  const { url, key } = await presignRes.json()
  const putRes = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': 'image/jpeg' },
    body: frame.blob,
  })
  if (!putRes.ok) throw new Error(`R2 PUT HTTP ${putRes.status}`)
  return key
}

async function pickThumbBlob(frames) {
  // Pega o frame do meio do scan — geralmente o mais representativo
  if (!frames.length) return null
  const mid = frames[Math.floor(frames.length / 2)]
  return mid?.blob || null
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function defaultPropertyName(capturedAt) {
  const d = new Date(capturedAt || Date.now())
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `Imóvel ${dd}/${mm} · ${hh}:${min}`
}
