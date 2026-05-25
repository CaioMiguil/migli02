// MIGLI · Serviço de imóveis
// ------------------------------------------------------------
// CRUD em registros de imóvel.
//
// Quando Supabase está configurado → usa cloud (RLS, multi-device).
// Quando não → usa localStore (IndexedDB) automaticamente.
//
// Schema cloud esperado em docs/CLOUD_SETUP.md.

import { getSupabase } from './supabaseClient'
import { isCloudConfigured } from './config'
import {
  localListProperties,
  localCreateProperty,
  localUpdateProperty,
  localDeleteProperty,
  localGetPropertyBySlug,
} from './localStore'

const TABLE = 'properties'

function useLocal() {
  return !isCloudConfigured()
}

/**
 * Lista imóveis do usuário autenticado (ou locais).
 */
export async function listMyProperties() {
  if (useLocal()) return localListProperties()
  const sb = getSupabase()
  if (!sb) return localListProperties()
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) {
    // Em caso de erro de auth/RLS, ainda mostra o que tem local
    // eslint-disable-next-line no-console
    console.warn('[MIGLI] listMyProperties cloud falhou, usando local:', error)
    return localListProperties()
  }
  return data ?? []
}

/**
 * Cria um novo imóvel.
 */
export async function createProperty(input) {
  if (useLocal()) return localCreateProperty(input)
  const sb = getSupabase()
  if (!sb) return localCreateProperty(input)

  const session = await sb.auth.getSession()
  const userId = session.data.session?.user?.id
  if (!userId) {
    // Sem login → cria localmente
    return localCreateProperty(input)
  }

  const slug = input.slug || randomSlug()
  const { data, error } = await sb
    .from(TABLE)
    .insert({
      owner_id: userId,
      slug,
      name: input.name,
      subtitle: input.subtitle ?? null,
      price: input.price ?? null,
      status: input.status || 'draft',
      splat_url: input.splat_url ?? null,
      thumb_url: input.thumb_url ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Atualiza um imóvel existente.
 */
export async function updateProperty(id, patch) {
  if (useLocal()) return localUpdateProperty(id, patch)
  const sb = getSupabase()
  if (!sb) return localUpdateProperty(id, patch)

  // Tenta cloud primeiro; se não encontrar, faz local
  const { data, error } = await sb
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error || !data) {
    return localUpdateProperty(id, patch)
  }
  return data
}

/**
 * Lê um imóvel pelo slug.
 */
export async function getPropertyBySlug(slug) {
  if (useLocal()) return localGetPropertyBySlug(slug)
  const sb = getSupabase()
  if (!sb) return localGetPropertyBySlug(slug)
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) {
    // Fallback local pra slugs criados sem cloud
    return localGetPropertyBySlug(slug)
  }
  return data
}

/**
 * Exclui um imóvel.
 */
export async function deleteProperty(id) {
  if (useLocal()) return localDeleteProperty(id)
  const sb = getSupabase()
  if (!sb) return localDeleteProperty(id)
  const { error } = await sb.from(TABLE).delete().eq('id', id)
  if (error) {
    // Tenta local também — pode estar lá
    await localDeleteProperty(id)
    return
  }
  await localDeleteProperty(id) // limpa cache local também
}

/* ────────────────────────────────────────────── */

function randomSlug() {
  return Math.random().toString(36).slice(2, 9)
}
