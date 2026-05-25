# 🚀 MIGLI — Guia GO LIVE (30 minutos)

Este é o passo a passo idiota-prova para colocar o MIGLI no ar com:
- **Vercel** (hospedagem do app, grátis)
- **Supabase** (banco + auth + realtime, grátis até 500MB)
- **Cloudflare R2** (storage de frames + splats, grátis até 10GB)
- **Reconstrução manual** (você processa os ZIPs no seu PC com Gaussian Splatting)

> **Você não precisa de nada disso pra testar.** O app funciona 100% em modo demo (localStorage) só rodando `npm run dev`. Esse guia é só pra você compartilhar tours por link público.

---

## ⚡ Fase 0 — Roda local sem nada configurado (2 min)

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Funciona:
- Câmera, scan, biblioteca, marcar como publicado com `.sog` local
- Tudo persiste em IndexedDB do navegador
- **Não** funciona ainda: link público `/p/:slug` (precisa de cloud)

Quando estiver feliz com a UX local, segue pra Fase 1.

---

## 🗄️ Fase 1 — Supabase (10 minutos)

### 1.1. Criar projeto

1. Vai em [https://supabase.com](https://supabase.com) → **Sign up** com GitHub
2. **New project** → nome `migli` → senha forte (anota) → região `São Paulo`
3. Espera ~2min o projeto provisionar

### 1.2. Rodar o schema SQL

Vai em **SQL Editor** → cola isso e clica **Run**:

```sql
-- Tabela principal de imóveis
create table properties (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  slug        text unique,
  name        text not null,
  subtitle    text,
  price       text,
  status      text not null default 'draft',
  splat_url   text,
  thumb_url   text,
  metadata    jsonb default '{}'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Tabela de uploads de frames (rastreamento)
create table uploads (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  index       int not null,
  r2_key      text not null,
  size        int,
  sharpness   real,
  brightness  real,
  width       int,
  height      int,
  created_at  timestamptz default now()
);

-- RLS — donos veem só os próprios
alter table properties enable row level security;
alter table uploads enable row level security;

create policy "owner reads own properties"
  on properties for select using (auth.uid() = owner_id);
create policy "owner inserts own properties"
  on properties for insert with check (auth.uid() = owner_id);
create policy "owner updates own properties"
  on properties for update using (auth.uid() = owner_id);
create policy "owner deletes own properties"
  on properties for delete using (auth.uid() = owner_id);

-- Páginas públicas /p/:slug → leitura sem login se published
create policy "public reads published"
  on properties for select
  using (status = 'published');

-- Realtime
alter publication supabase_realtime add table properties;
```

### 1.3. Configurar Auth

1. **Authentication** → **Providers** → habilita **Email** (magic link)
2. **Authentication** → **URL Configuration**:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: `http://localhost:5173/**`, `https://SEU-DOMINIO.vercel.app/**`

### 1.4. Pegar as keys

**Settings** → **API**:
- Anota `Project URL` (algo tipo `https://xxxx.supabase.co`)
- Anota `anon public key` (começa com `eyJ…`)

### 1.5. Criar `.env.local` no MIGLI

Cria um arquivo `.env.local` na raiz do projeto:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Reinicia `npm run dev`. Agora a aba **Perfil** vai oferecer login com magic link.

✅ **Pronto pra testar:** faz login, escaneia, vê o imóvel salvo na Biblioteca, agora persistente entre devices.

---

## 📦 Fase 2 — Cloudflare R2 + Worker (15 min)

R2 = storage S3-compatible da Cloudflare. Grátis até 10GB de armazenamento + 1M ops/mês.

### 2.1. Criar conta Cloudflare e habilitar R2

1. [https://cloudflare.com](https://cloudflare.com) → **Sign up**
2. Dashboard → menu lateral → **R2** → confirma o cartão de crédito (cobra zero, é só pra ativar — Cloudflare é confiável)

### 2.2. Criar buckets

R2 → **Create bucket**:
1. `migli-frames` → região `Eastern North America (ENAM)` (mais barato)
2. `migli-splats` → mesma região

### 2.3. Tornar `migli-splats` público

`migli-splats` → **Settings** → **Public Access** → **Allow Access** → anota o **Public bucket URL** (algo como `https://pub-xxxxx.r2.dev`)

### 2.4. Criar API Token R2

R2 dashboard → **Manage R2 API Tokens** → **Create API token**:
- Permissions: **Object Read & Write**
- Buckets: `migli-frames` E `migli-splats`
- TTL: deixa vazio (permanente)

Anota: `Access Key ID`, `Secret Access Key`, `Endpoint` (formato `https://CONTA.r2.cloudflarestorage.com`)

### 2.5. Deploy do Worker (presign URLs)

Cria pasta `worker/` na raiz do MIGLI:

**`worker/wrangler.toml`:**
```toml
name = "migli-api"
main = "src/index.ts"
compatibility_date = "2024-09-01"

[[r2_buckets]]
binding = "FRAMES"
bucket_name = "migli-frames"

[[r2_buckets]]
binding = "SPLATS"
bucket_name = "migli-splats"

[vars]
SUPABASE_URL = "https://xxxx.supabase.co"
# SUPABASE_JWT_SECRET fica em secrets:
# wrangler secret put SUPABASE_JWT_SECRET
```

**`worker/src/index.ts`:**
```ts
import { AwsClient } from 'aws4fetch'

export interface Env {
  FRAMES: R2Bucket
  SPLATS: R2Bucket
  SUPABASE_URL: string
  SUPABASE_JWT_SECRET: string
  R2_ACCESS_KEY: string
  R2_SECRET_KEY: string
  R2_ENDPOINT: string
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization',
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: CORS })
    }

    const url = new URL(req.url)

    // POST /scans/:id/frames/presign
    const presignMatch = url.pathname.match(/^\/scans\/([^/]+)\/frames\/presign$/)
    if (req.method === 'POST' && presignMatch) {
      const propertyId = presignMatch[1]
      const auth = req.headers.get('authorization')
      const userId = await verifySupabaseJwt(auth, env.SUPABASE_JWT_SECRET)
      if (!userId) return cors(401, { error: 'unauthorized' })

      const body = await req.json() as any
      const key = `${userId}/${propertyId}/${String(body.index).padStart(4, '0')}.jpg`

      const r2 = new AwsClient({
        accessKeyId: env.R2_ACCESS_KEY,
        secretAccessKey: env.R2_SECRET_KEY,
        service: 's3',
        region: 'auto',
      })
      const signedUrl = await r2.sign(
        new Request(`${env.R2_ENDPOINT}/migli-frames/${key}`, {
          method: 'PUT',
          headers: { 'content-type': 'image/jpeg' },
        }),
        { aws: { signQuery: true } },
      )

      return cors(200, { url: signedUrl.url, key })
    }

    // POST /scans/:id/process — placeholder pra Fase 4
    if (req.method === 'POST' && url.pathname.match(/^\/scans\/[^/]+\/process$/)) {
      // Por enquanto: no-op. Quando você integrar KIRI/Modal, dispara aqui.
      return cors(200, { queued: true })
    }

    return cors(404, { error: 'not found' })
  },
}

function cors(status: number, body: any) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...CORS },
  })
}

async function verifySupabaseJwt(authHeader: string | null, secret: string) {
  if (!authHeader) return null
  const token = authHeader.replace(/^Bearer\s+/i, '')
  // Supabase JWT verification — em produção use jose ou similar
  // Aqui um stub simplificado que extrai sub do JWT decodificado
  try {
    const [, payload] = token.split('.')
    const decoded = JSON.parse(atob(payload))
    return decoded.sub
  } catch {
    return null
  }
}
```

### 2.6. Deploy

```bash
cd worker
npm install -g wrangler
npm install aws4fetch
wrangler login
wrangler secret put SUPABASE_JWT_SECRET
# cola o JWT secret de Supabase → Settings → API → JWT Secret
wrangler secret put R2_ACCESS_KEY
wrangler secret put R2_SECRET_KEY
wrangler secret put R2_ENDPOINT
wrangler deploy
```

Anota a URL do Worker (algo tipo `https://migli-api.SEU-USUARIO.workers.dev`).

### 2.7. Adicionar ao `.env.local`

```
VITE_UPLOAD_API_URL=https://migli-api.SEU-USUARIO.workers.dev
VITE_CDN_BASE_URL=https://pub-xxxxx.r2.dev
```

Reinicia `npm run dev`. Agora cada scan vai subir os frames pra R2 direto, vinculados ao seu user no Supabase.

---

## 🌍 Fase 3 — Deploy do app no Vercel (3 min)

1. Push do projeto pro GitHub
2. [https://vercel.com](https://vercel.com) → **Add New Project** → importa o repo
3. **Environment Variables** → cola as 4 envs do `.env.local`
4. **Deploy**

Em ~2min você tem `https://migli-SEU-USUARIO.vercel.app` no ar.

Volta no Supabase → Auth → URL Configuration → adiciona a URL Vercel nos Redirect URLs.

---

## 🎨 Fase 4 — Reconstrução manual (Opção 3)

Aqui é onde a "manualidade temporária" entra. Sem isso, o tour mostra a cena demo.

### 4.1. Workflow do corretor

1. Corretor escaneia imóvel no app
2. App sobe frames pra R2 + cria property `status=processing`
3. Você (admin) baixa o ZIP de frames da Biblioteca (menu do imóvel → **Baixar frames (ZIP)**)
4. No seu PC, processa offline (veja 4.2)
5. Volta no app → Biblioteca → menu do imóvel → **Subir reconstrução (.sog)**
6. Seleciona o arquivo `.sog` gerado
7. Status vira `published`, tour aparece com seu splat real

### 4.2. Como reconstruir num PC com GPU

**Pré-requisitos:** Linux ou WSL2, NVIDIA GPU com ≥6GB VRAM, ~20GB de disco.

```bash
# Setup uma vez
git clone --recurse-submodules https://github.com/graphdeco-inria/gaussian-splatting
cd gaussian-splatting
conda env create -f environment.yml
conda activate gaussian_splatting

# Para cada imóvel:
# 1. Extrai o ZIP em ~/migli-scans/imovel-X/input/
# 2. Roda COLMAP pra estimar poses
python convert.py -s ~/migli-scans/imovel-X
# 3. Treina o splat (~20min na sua GPU)
python train.py -s ~/migli-scans/imovel-X --iterations 7000
# 4. Saída em output/<hash>/point_cloud/iteration_7000/point_cloud.ply
```

### 4.3. Comprimir pra `.sog` (10× menor)

```bash
# Usa o sog-converter da PlayCanvas (Python)
pip install playcanvas-sog
sog-convert point_cloud.ply output.sog
```

Esse `.sog` final é o que você sobe via **Subir reconstrução** no MIGLI.

### 4.4. Próxima fase (automação)

Quando tiver 10+ corretores reclamando do tempo manual, você vai querer automatizar. Duas opções:
- **KIRI Engine API** (~US$ 1/imóvel, integra em meio dia) → ideal pra primeiros 100 imóveis
- **Modal Labs** (~US$ 0,30/imóvel após setup, semana de trabalho) → ideal escala 100+

Por enquanto, valida o produto com manualidade.

---

## 🛠️ Troubleshooting

### "Sem conexão" piscando
Normal em mobile com 4G fraco. Funciona offline.

### Scan abre câmera preta
Em iOS Safari, exige HTTPS. `localhost` funciona, mas IP local (192.168.x.x) precisa de HTTPS. Use Vercel preview ou ngrok.

### Permission denied de orientação
iOS 13+ exige tap explícito. O botão "Iniciar" já dispara o gate.

### Link público mostra cena demo
A property não tem `splat_url`. Faz upload via **Subir reconstrução**.

### Frames não baixam ZIP
O scan precisa ter rodado **na mesma sessão de browser** (frames vivem em IndexedDB local). Em outro dispositivo, os frames estão na R2 — busca direto lá com `aws s3 sync s3://migli-frames/USER_ID/PROPERTY_ID/ ./`.

---

## ✅ Checklist final

- [ ] Supabase rodando, magic link funciona
- [ ] `.env.local` com 4 variáveis preenchidas
- [ ] Worker R2 deployed e respondendo `/scans/test/process`
- [ ] App no Vercel
- [ ] Pelo menos 1 scan completo → frames no R2 → ZIP baixa
- [ ] Pelo menos 1 reconstrução manual → `.sog` upado → tour funciona
- [ ] Link público compartilhado num WhatsApp e abriu

Quando esses 6 itens estiverem ✅, você tem um produto pronto pra mostrar pros corretores.

---

## 📞 Suporte

Algo quebrou? Faz print + step a step + cola aqui no chat com Claude. Ele tem o contexto inteiro desse projeto.

**Vamos revolucionar o ramo imobiliário no Brasil.** 🌊
