// MIGLI · Adaptador R2 — upload em produção
// ------------------------------------------------------------
// Implementa o mesmo contrato do simulatorAdapter, mas envia arquivos
// reais para Cloudflare R2 via pre-signed PUT URL emitida por um
// Worker. O processamento splat fica como polling do status no backend.
//
// Pré-requisitos no backend:
//   1. Worker em /uploads/presign  → emite { url, key, publicUrl }
//   2. Endpoint /uploads/:id/process  → enfileira o job no pipeline
//   3. Endpoint /uploads/:id/status   → retorna { stage, progress }
//
// Veja docs/CLOUD_SETUP.md para o código completo do Worker.

import { CLOUD } from './config'
import { ProcessingStage } from '../upload/uploadQueue'
import { getSupabase } from './supabaseClient'

const POLL_INTERVAL_MS = 2500

async function authHeaders() {
  const sb = getSupabase()
  if (!sb) return {}
  const { data } = await sb.auth.getSession()
  const token = data?.session?.access_token
  return token ? { authorization: `Bearer ${token}` } : {}
}

export const r2Adapter = {
  /**
   * Upload do arquivo para R2 via pre-signed PUT URL.
   */
  async upload(item, { onProgress, signal }) {
    const apiBase = CLOUD.uploadApi.baseUrl
    if (!apiBase) throw new Error('VITE_UPLOAD_API_URL não configurado.')

    // 1. Pedir URL pré-assinada
    const presignRes = await fetch(`${apiBase}/uploads/presign`, {
      method: 'POST',
      signal,
      headers: {
        'content-type': 'application/json',
        ...(await authHeaders()),
      },
      body: JSON.stringify({
        filename: item.name,
        contentType: item.type,
        size: item.size,
        meta: item.meta,
      }),
    })
    if (!presignRes.ok) {
      throw new Error(`Falha ao iniciar upload (HTTP ${presignRes.status})`)
    }
    const presign = await presignRes.json()
    // expected: { url, key, publicUrl, uploadId }

    // 2. PUT direto na R2 com progresso real
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presign.url)
      if (item.type) xhr.setRequestHeader('content-type', item.type)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100)
      }
      xhr.onload = () =>
        xhr.status < 400
          ? resolve()
          : reject(new Error(`HTTP ${xhr.status} ao enviar para R2`))
      xhr.onerror = () => reject(new Error('Erro de rede durante o upload'))
      xhr.onabort = () => {
        const err = new Error('Cancelado')
        err.name = 'AbortError'
        reject(err)
      }
      signal?.addEventListener('abort', () => xhr.abort())
      xhr.send(item.file)
    })

    // 3. Notificar o backend que o upload concluiu (enfileira processamento)
    const processRes = await fetch(`${apiBase}/uploads/${presign.uploadId}/process`, {
      method: 'POST',
      signal,
      headers: { 'content-type': 'application/json', ...(await authHeaders()) },
    })
    if (!processRes.ok) {
      // Upload foi gravado, mas o pipeline não enfileirou. Não-fatal —
      // o operador pode reprocessar manualmente. Surface o erro mesmo assim.
      // eslint-disable-next-line no-console
      console.warn('[MIGLI] Pipeline não foi enfileirado:', processRes.status)
    }

    return {
      url: presign.publicUrl,
      key: presign.key,
      uploadId: presign.uploadId,
      bytes: item.size,
    }
  },

  /**
   * Polling do status do pipeline no backend.
   * Emite progresso por estágio até o pipeline reportar 'done'.
   */
  async process(item, { onStage, signal }) {
    const apiBase = CLOUD.uploadApi.baseUrl
    const uploadId = item.result?.uploadId
    if (!apiBase || !uploadId) {
      throw new Error('Sem uploadId — fluxo de processamento não pode iniciar.')
    }

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (signal?.aborted) {
        const err = new Error('Cancelado')
        err.name = 'AbortError'
        throw err
      }

      const res = await fetch(`${apiBase}/uploads/${uploadId}/status`, {
        signal,
        headers: await authHeaders(),
      })
      if (!res.ok) {
        throw new Error(`Status HTTP ${res.status}`)
      }
      const { stage, progress, splatUrl, error } = await res.json()
      if (error) throw new Error(error)

      onStage(stage, progress ?? 0)

      if (stage === ProcessingStage.DONE || stage === 'done') {
        // Anexa a URL final do splat ao result
        if (splatUrl) item.result.splatUrl = splatUrl
        return
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))
    }
  },
}
