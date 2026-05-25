# Fases 5–9 — Especificações de arquitetura

Este documento descreve as próximas fases sem código spec, porque cada
uma exige decisões de infraestrutura, custos, e equipe que dependem do
estágio da empresa.

---

## Fase 5 — Processing Infrastructure escalável

**Dependência:** Fase 4 deve estar implementada.

### Arquitetura recomendada

```
Cloudflare Worker  →  Cloudflare Queue  →  Modal/RunPod GPU Workers
                            ↓
                  Worker DLQ + retries
                            ↓
                  Supabase notifica client via Realtime
```

### Componentes a implementar

1. **Queue** — Cloudflare Queues (~US$ 0,40 por milhão de operações) ou
   AWS SQS. Dedupe por `upload_id`.

2. **Workers GPU** — Modal Labs (pay-per-second, autoscale 0→N) ou
   RunPod (spot GPUs mais baratas, mas startup latency maior).

3. **DLQ + retries** — falhas no pipeline são comuns (vídeo ruim,
   SfM diverge). Tentar 2x e mover para dead-letter para inspeção manual.

4. **Realtime status** — em vez de polling do client, use Supabase
   Realtime subscriptions na tabela `uploads`. O viewer recebe push
   instantâneo quando `stage` muda.

### Custo estimado a 1.000 imóveis/mês

| Item | US$/mês |
|------|---------|
| Cloudflare R2 storage (50GB) | 0,75 |
| Cloudflare R2 egress | 0 (free) |
| Cloudflare Queues | 0,50 |
| Modal GPU (L4, 15min/imóvel × 1k) | 350 |
| Supabase Pro | 25 |
| **Total** | **~US$ 380** |

→ R$ 99 × 1000 = R$ 99.000 = US$ 18k receita. Margem confortável.

---

## Fase 6 — Mobile app real (PWA primeiro)

**Dependência:** Fases 2 e 3 completas (já estão).

### Recomendação: PWA antes de React Native

Para MIGLI, **PWA é a escolha certa para começar** porque:

- Não precisa publicar em App Store / Play Store (atrito zero)
- Mesma codebase web + mobile (manutenção 1x)
- Câmera, geolocalização, push notifications — tudo suportado em PWAs modernos
- Atualização instantânea (sem review de loja)
- Quando volume justificar, dá para portar para React Native em ~2 meses

### O que adicionar à codebase

1. **manifest.json** em `/public/manifest.webmanifest`:
```json
{
  "name": "MIGLI",
  "short_name": "MIGLI",
  "description": "Experiências imersivas em 3D para imóveis",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#060D1A",
  "background_color": "#060D1A",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

2. **Service Worker** — usar `vite-plugin-pwa`:
```bash
npm i -D vite-plugin-pwa
```

Em `vite.config.js`:
```js
import { VitePWA } from 'vite-plugin-pwa'
plugins: [react(), VitePWA({ registerType: 'autoUpdate' })]
```

3. **iOS meta tags** no `index.html`:
```html
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
```

4. **Install prompt** — componente que detecta `beforeinstallprompt` e
   mostra um botão "Instalar MIGLI" no painel do corretor.

5. **Push notifications** — usar Web Push API + VAPID keys. Notificar
   o corretor quando o splat de um imóvel ficar pronto.

### Quando migrar para React Native

Indicadores:
- Mais de 30% dos usuários querendo features nativas (gravação background, sensors)
- Necessidade de ARKit/ARCore para captura guiada
- Push notifications precisam funcionar em iOS Safari sem PWA install

---

## Fase 7 — Dashboard agente SaaS

### Já implementado (Fase 2 deste repo)

✓ Lista de imóveis
✓ Criar/excluir
✓ Status badges
✓ Link de share

### Próximos incrementos (baixo esforço, alto valor)

1. **Editor de metadados** — abrir um drawer ao clicar num imóvel para
   editar nome, preço, descrição, fotos extras.

2. **Analytics por imóvel** — adicionar tabela `property_views`:
```sql
create table property_views (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references properties(id),
  viewed_at timestamptz default now(),
  duration_seconds int,
  referrer text,
  country text,
  device text
);
```
   E uma view de analytics no card: visualizações últimos 7 dias, tempo
   médio no tour.

3. **Filtros + busca** — sortear por status, data, valor; busca por nome.

4. **Onboarding tour** — `react-joyride` mostrando os 3 primeiros passos
   na primeira visita.

### Avoid

- Tabelas pesadas — usar grade de cards visuais
- Múltiplos workspaces / teams (over-engineering para single-plan SaaS)
- Customização avançada (deixar mínimo, premium-by-default)

---

## Fase 8 — AI Enhancement

**Recomendação:** *não construa primeiro*. Valide demanda real antes.

### Quando vale a pena

Quando você tiver 500+ corretores ativos e dados sobre **quais imóveis
fecham mais rápido**. Aí você terá insight sobre o que melhorar.

### Caminhos viáveis

1. **AI staging** (mais procurado em US) — usar Stable Diffusion + ControlNet
   para repor móveis virtuais. **No Brasil, validação é incerta** — pode
   ser visto como "enganar o cliente". Pesquisar antes.

2. **Sky replacement** em fotos exteriores — útil, fácil, baixo risco.
   API como [SkyReplace](https://github.com/CompVis/stable-diffusion) ou
   serviços comerciais.

3. **Upscaling** de splats baixa resolução — usar [Real-ESRGAN](https://github.com/xinntao/Real-ESRGAN)
   nos frames de entrada antes da reconstrução.

4. **Auto-tagging** — Claude/GPT-4V analisa frames e gera descrição PT-BR
   automática do imóvel ("apartamento com pé-direito alto, janela
   panorâmica, piso em madeira clara"). Este é o de **menor risco e maior
   ROI**. Recomendo começar por aqui.

### Custo estimado para auto-tagging

Claude Sonnet ~US$ 0,015 por imóvel (3 frames × 1500 tokens output) =
US$ 15 por 1000 imóveis. Marginal.

---

## Fase 9 — Production Scaling

### Quando importar

Quando você tiver: 1k+ usuários pagantes, 10k+ tours publicados,
ou for fechar uma rodada.

### Checklist em ordem de prioridade

1. **Observability** — Sentry para errors no frontend, Axiom/Logflare
   para logs do Worker. Ambos têm free tier generoso.

2. **CDN** — splats em `migli-splats` já são servidos pela Cloudflare CDN
   por padrão. Adicionar custom domain (`cdn.migli.app`) e habilitar
   cache rules.

3. **Billing** — Stripe + Stripe customer portal. Plano único = setup
   trivial. ~3 dias de trabalho.

4. **Monitoring** — Better Stack (uptime) + Cloudflare Analytics.

5. **Backup** — Supabase tem PITR no plano Pro. R2 não tem backup
   nativo; replicar `migli-splats` para B2/S3 com worker que copia
   on-write. Ou aceitar o risco (R2 já é redundante).

6. **Rate limiting** — Cloudflare Worker tem rate limit nativo
   (`rateLimit` binding). Limitar /uploads/presign para 5/min/user.

7. **Security** — `helmet`-equivalent headers via Worker; CSP estrita;
   rotation de R2 keys a cada 90 dias.

8. **Performance** — Lighthouse 90+ em mobile. Já estamos próximos com
   `manualChunks` em `vite.config.js`.

---

## Resumo executivo das prioridades

| Fase | Esforço | Valor | Recomendação |
|------|---------|-------|--------------|
| 4 (vídeo→splat) | Alto | **Crítico** | Começar com API externa (Opção A) |
| 5 (workers escala) | Alto | Depois de validar 4 | Modal Labs |
| 6 (PWA) | Médio | Alto | **Fazer cedo** — destrava aquisição mobile |
| 7 (dashboard polish) | Baixo | Médio | Iterar com feedback de corretores reais |
| 8 (AI) | Médio | **Incerto no BR** | Validar com 100+ corretores antes |
| 9 (scale prod) | Médio | Crítico em escala | Quando passar de 100 clientes pagantes |
