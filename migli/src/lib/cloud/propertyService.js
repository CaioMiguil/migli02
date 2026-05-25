// MIGLI · Serviço de imóveis
// ------------------------------------------------------------
// CRUD em registros de imóvel, persistidos em Supabase Postgres.
//
// Schema esperado (rode em Supabase SQL editor):
//
//   create table properties (
//     id          uuid primary key default gen_random_uuid(),
//     owner_id    uuid not null references auth.users(id) on delete cascade,
//     slug        text unique,
//     name        text not null,
//     subtitle    text,
//     price       text,
//     status      text not null default 'draft', -- draft | processing | published
//     splat_url   text,
//     thumb_url   text,
//     metadata    jsonb default '{}'::jsonb,
//     created_at  timestamptz default now(),
//     updated_at  timestamptz default now()
//   );
//
//   alter table properties enable row level security;
//
//   create policy "owner reads own properties"
//     on properties for select using (auth.uid() = owner_id);
//   create policy "owner inserts own properties"
//     on properties for insert with check (auth.uid() = owner_id);
//   create policy "owner updates own properties"
//     on properties for update using (auth.uid() = owner_id);
//   create policy "owner deletes own properties"
//     on properties for delete using (auth.uid() = owner_id);
//
//   -- Páginas públicas (/p/:slug) leem published-only sem auth:
//   create policy "public reads published"
//     on properties for select
//     using (status = 'published');

import { getSupabase } from './supabaseClient'

const TABLE = 'properties'

/**
 * Lista imóveis do usuário autenticado.
 */
export async function listMyProperties() {
  const sb = getSupabase()
  if (!sb) return []
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * Cria um novo imóvel (draft). Retorna o registro.
 */
export async function createProperty(input) {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud não configurado.')

  const session = await sb.auth.getSession()
  const userId = session.data.session?.user?.id
  if (!userId) throw new Error('Sessão expirada — faça login.')

  const slug = input.slug || randomSlug()
  const { data, error } = await sb
    .from(TABLE)
    .insert({
      owner_id: userId,
      slug,
      name: input.name,
      subtitle: input.subtitle ?? null,
      price: input.price ?? null,
      status: 'draft',
      metadata: input.metadata ?? {},
    })
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Atualiza um imóvel existente (próprio).
 */
export async function updateProperty(id, patch) {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud não configurado.')
  const { data, error } = await sb
    .from(TABLE)
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Lê um imóvel pelo slug. Funciona sem auth se status = published.
 */
export async function getPropertyBySlug(slug) {
  const sb = getSupabase()
  if (!sb) return null
  const { data, error } = await sb
    .from(TABLE)
    .select('*')
    .eq('slug', slug)
    .maybeSingle()
  if (error) throw error
  return data
}

/**
 * Exclui um imóvel.
 */
export async function deleteProperty(id) {
  const sb = getSupabase()
  if (!sb) throw new Error('Cloud não configurado.')
  const { error } = await sb.from(TABLE).delete().eq('id', id)
  if (error) throw error
}

/* ────────────────────────────────────────────── */

function randomSlug() {
  // Slug curto, URL-friendly (~7 chars). Não precisa ser único globalmente;
  // a DB tem unique constraint que rejeita duplicatas.
  return Math.random().toString(36).slice(2, 9)
}
