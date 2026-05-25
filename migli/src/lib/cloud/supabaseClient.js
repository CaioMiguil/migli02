// MIGLI · Cliente Supabase
// ------------------------------------------------------------
// Instância única, criada sob demanda. Se as credenciais não estiverem
// configuradas, retorna null e o app cai no modo "local-only" (sem cloud).

import { createClient } from '@supabase/supabase-js'
import { CLOUD, isCloudConfigured } from './config'

let _client = null

export function getSupabase() {
  if (!isCloudConfigured()) return null
  if (_client) return _client
  _client = createClient(CLOUD.supabase.url, CLOUD.supabase.anonKey, {
    auth: {
      // Magic link / OTP em vez de senha — UX mais fluida
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'migli.session',
    },
  })
  return _client
}
