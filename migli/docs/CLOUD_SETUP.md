# Configuração de Cloud (Fase 2)

Guia para ativar Supabase + Cloudflare R2 no MIGLI.

## 1. Criar projeto Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto novo.
2. Em **Project Settings → API**, copie:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public key` → `VITE_SUPABASE_ANON_KEY`
3. Copie `.env.example` para `.env.local` e preencha esses valores.

## 2. Criar a tabela de imóveis

No **SQL Editor** do Supabase, cole e execute:

```sql
-- Tabela de imóveis (properties)
create table properties (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  slug        text unique,
  name        text not null,
  subtitle    text,
  price       text,
  status      text not null default 'draft', -- draft | processing | published | failed
  splat_url   text,
  thumb_url   text,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Row Level Security
alter table properties enable row level security;

create policy "owner_select" on properties
  for select using (auth.uid() = owner_id);
create policy "owner_insert" on properties
  for insert with check (auth.uid() = owner_id);
create policy "owner_update" on properties
  for update using (auth.uid() = owner_id);
create policy "owner_delete" on properties
  for delete using (auth.uid() = owner_id);

-- Páginas públicas (/p/:slug) leem published-only sem login
create policy "public_select_published" on properties
  for select using (status = 'published');

-- Tabela de uploads (rastrear processamento)
create table uploads (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  property_id uuid references properties(id) on delete set null,
  r2_key      text not null,
  size_bytes  bigint,
  content_type text,
  stage       text not null default 'queued',
  progress    int  not null default 0,
  splat_url   text,
  error       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table uploads enable row level security;

create policy "owner_uploads_select" on uploads
  for select using (auth.uid() = owner_id);
create policy "owner_uploads_insert" on uploads
  for insert with check (auth.uid() = owner_id);
create policy "owner_uploads_update" on uploads
  for update using (auth.uid() = owner_id);

create index uploads_owner_idx on uploads(owner_id);
create index properties_slug_idx on properties(slug);
```

## 3. Configurar Cloudflare R2

1. Em [dash.cloudflare.com → R2](https://dash.cloudflare.com), crie dois buckets:
   - `migli-uploads` (privado — vídeos brutos do usuário)
   - `migli-splats` (público — splats publicados, servidos via CDN)
2. Em **R2 → Manage R2 API tokens**, gere um token com permissão de leitura/escrita nos dois buckets.
3. Anote: `account_id`, `access_key_id`, `secret_access_key`.
4. Para o bucket público `migli-splats`, ative **Public access** e anote a URL do CDN (`https://pub-xxxx.r2.dev` ou um domínio custom).

## 4. Cloudflare Worker — upload API

Crie um Worker novo via `wrangler init migli-upload`. Use o código abaixo como `src/index.ts`:

```typescript
import { AwsClient } from 'aws4fetch'

export interface Env {
  R2_ACCOUNT_ID: string
  R2_ACCESS_KEY_ID: string
  R2_SECRET_ACCESS_KEY: string
  R2_BUCKET_UPLOADS: string  // "migli-uploads"
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string  // KEEP SECRET
}

const ALLOWED_ORIGINS = ['https://migli.app', 'http://localhost:5173']

function cors(req: Request, origin = '*'): HeadersInit {
  const o = req.headers.get('origin') || ''
  const allow = ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0]
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'POST, GET, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
  }
}

async function verifySupabaseJWT(req: Request, env: Env): Promise<string | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace(/^Bearer /, '')
  if (!token) return null
  // Use Supabase admin API to validate + extract user id
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { authorization: `Bearer ${token}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  })
  if (!res.ok) return null
  const { id } = await res.json()
  return id ?? null
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: cors(req) })
    }

    const url = new URL(req.url)
    const userId = await verifySupabaseJWT(req, env)
    if (!userId) return json({ error: 'unauthorized' }, 401, cors(req))

    // POST /uploads/presign → emite URL pré-assinada
    if (req.method === 'POST' && url.pathname === '/uploads/presign') {
      const body = await req.json<{ filename: string; contentType: string; size: number }>()
      const uploadId = crypto.randomUUID()
      const ext = (body.filename.split('.').pop() || 'bin').toLowerCase()
      const key = `uploads/${userId}/${uploadId}.${ext}`

      // Inserir na tabela uploads via service role
      await fetch(`${env.SUPABASE_URL}/rest/v1/uploads`, {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          'content-type': 'application/json',
          prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id: uploadId, owner_id: userId, r2_key: key,
          size_bytes: body.size, content_type: body.contentType, stage: 'queued',
        }),
      })

      // Pre-signed PUT URL
      const aws = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        service: 's3',
        region: 'auto',
      })
      const endpoint = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET_UPLOADS}/${key}`
      const signed = await aws.sign(new Request(endpoint, { method: 'PUT' }), {
        aws: { signQuery: true },
      })
      return json({ url: signed.url, key, uploadId, publicUrl: null }, 200, cors(req))
    }

    // POST /uploads/:id/process → enfileira o job
    const processMatch = url.pathname.match(/^\/uploads\/([^/]+)\/process$/)
    if (req.method === 'POST' && processMatch) {
      const uploadId = processMatch[1]
      // TODO: enviar mensagem para Queue / Durable Object que processa o splat
      // Por enquanto, marca como 'queued' — Fase 4 implementa o worker real.
      return json({ ok: true, uploadId }, 200, cors(req))
    }

    // GET /uploads/:id/status → status do pipeline
    const statusMatch = url.pathname.match(/^\/uploads\/([^/]+)\/status$/)
    if (req.method === 'GET' && statusMatch) {
      const uploadId = statusMatch[1]
      const res = await fetch(
        `${env.SUPABASE_URL}/rest/v1/uploads?id=eq.${uploadId}&select=stage,progress,splat_url,error`,
        { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` } },
      )
      const rows = await res.json<any[]>()
      return json(rows[0] ?? { stage: 'unknown', progress: 0 }, 200, cors(req))
    }

    return new Response('Not found', { status: 404, headers: cors(req) })
  },
}

function json(data: unknown, status = 200, extra: HeadersInit = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', ...extra },
  })
}
```

Deploy:

```bash
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
wrangler deploy
```

Copie a URL final para `VITE_UPLOAD_API_URL` no `.env.local`.

## 5. Conectar tudo

```bash
npm install
npm run dev
```

Abra a home. Clique em "Entrar" no nav → digite seu e-mail → magic link chega no inbox → click → você está logado. O menu de conta agora mostra "Meus imóveis" → leva ao `/#/dashboard`.

Ao capturar um vídeo ou arrastar um arquivo, o `r2Adapter` automaticamente:
1. Pede URL pré-assinada ao Worker
2. Faz PUT direto na R2
3. Notifica o Worker que o upload terminou
4. Faz polling do status até o splat ficar pronto

## O que ainda não funciona (Fase 4)

O ponto 4 acima — **vídeo → splat real** — exige um pipeline computer vision que roda em GPU server. Veja `docs/PHASE_4_PIPELINE.md` para a especificação completa de como implementá-lo (COLMAP + gaussian-splatting, ou uma API como Postshot/Luma).

Por enquanto, você pode:
- Subir splats prontos manualmente para o bucket `migli-splats`
- Atualizar manualmente `properties.splat_url` e `properties.status='published'` no Supabase
- Os tours já ficam visíveis em `/#/p/:slug` ✓
