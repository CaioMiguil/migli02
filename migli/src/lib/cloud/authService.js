// MIGLI · Serviço de autenticação
// ------------------------------------------------------------
// Magic links via Supabase. Sem senha — o usuário recebe um e-mail,
// clica no link, está logado. UX premium, segurança alta.

import { getSupabase } from './supabaseClient'

/**
 * Envia um link mágico de login para o e-mail informado.
 * O usuário recebe um e-mail com um link "/auth/callback" que loga
 * automaticamente.
 */
export async function sendMagicLink(email, { redirectTo } = {}) {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud não configurado. Veja .env.example.')

  const { error } = await sb.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: redirectTo || `${window.location.origin}/`,
      shouldCreateUser: true,
    },
  })
  if (error) throw error
  return { ok: true }
}

/**
 * Retorna a sessão atual (se houver). Null se não logado.
 */
export async function getSession() {
  const sb = getSupabase()
  if (!sb) return null
  const { data } = await sb.auth.getSession()
  return data?.session ?? null
}

/**
 * Subscreve mudanças de auth state. Retorna função de unsubscribe.
 */
export function onAuthChange(callback) {
  const sb = getSupabase()
  if (!sb) return () => {}
  const { data } = sb.auth.onAuthStateChange((event, session) => {
    callback(session, event)
  })
  return () => data?.subscription?.unsubscribe?.()
}

/**
 * Logout — limpa a sessão local + invalida no servidor.
 */
export async function signOut() {
  const sb = getSupabase()
  if (!sb) return
  await sb.auth.signOut()
}
