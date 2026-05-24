// MIGLI · Realtime de imóveis
// ------------------------------------------------------------
// Subscreve mudanças na tabela `properties` do usuário logado e emite
// novos rows / updates via callback. Usa Supabase Realtime (websockets).
//
// Quando o worker do pipeline atualiza `status='published'` + `splat_url`,
// o dashboard recebe push e atualiza o card automaticamente sem o usuário
// precisar dar F5. Essa é a diferença entre "SaaS comum" e "magic".

import { getSupabase } from './supabaseClient'

/**
 * Subscreve a tabela `properties` filtrada pelo owner_id.
 *
 * @param {string} userId
 * @param {{ onInsert, onUpdate, onDelete }} handlers
 * @returns {() => void} unsubscribe
 */
export function subscribeProperties(userId, handlers = {}) {
  const sb = getSupabase()
  if (!sb || !userId) return () => {}

  const channel = sb
    .channel(`properties:owner=${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'properties', filter: `owner_id=eq.${userId}` },
      (payload) => handlers.onInsert?.(payload.new),
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'properties', filter: `owner_id=eq.${userId}` },
      (payload) => handlers.onUpdate?.(payload.new, payload.old),
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'properties', filter: `owner_id=eq.${userId}` },
      (payload) => handlers.onDelete?.(payload.old),
    )
    .subscribe()

  return () => {
    try {
      sb.removeChannel(channel)
    } catch {
      /* noop */
    }
  }
}
