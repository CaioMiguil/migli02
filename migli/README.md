# MIGLI

> **Experiências imersivas em 3D para o mercado imobiliário brasileiro.**
> Capture com o celular. Compartilhe num link premium.

---

## ✦ Status

| | |
|---|---|
| Identidade visual completa (PT-BR) | ✅ |
| Modo imersivo cinematográfico | ✅ |
| Captura mobile + fila de upload | ✅ |
| Auth Supabase + R2 (código pronto) | ✅ |
| Dashboard + páginas `/p/:slug` | ✅ |
| Realtime (push de status) | ✅ |
| **PWA installable** | ✅ |
| **Onboarding cinematográfico** | ✅ |
| Pipeline vídeo→splat (GPU) | 📋 [Especificado](docs/PHASE_4_PIPELINE.md) |

---

## 🚀 Rodar localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:5173](http://localhost:5173). Sem `.env.local`, roda em modo demo (simulação local). Com cloud configurado, tudo persiste de verdade.

## 📱 Testar como app installable

PWA só ativa em build de produção:

```bash
npm run build
npm run preview
```

Abra o IP da rede no celular (Vite preview mostra) ou use ngrok para HTTPS:

```bash
npx ngrok http 4173
```

No iPhone/Android, a faixa "Instale o MIGLI" aparece após 8s. Em iOS Safari, mostra instruções de "Adicionar à tela de início".

## ☁️ Ativar cloud

1. `cp .env.example .env.local`
2. Siga [docs/CLOUD_SETUP.md](docs/CLOUD_SETUP.md) — SQL Supabase + Worker R2

---

## 🎯 Fluxo completo end-to-end (com cloud)

```
1. Usuário entra → splash cinematográfico → home imersiva
2. Clica "Entrar" → magic link no e-mail → login
3. Vai pro dashboard → onboarding cinematográfico (4 passos)
4. "Capturar" → full-screen mobile capture → grava vídeo
5. Para de gravar → "Usar gravação" → fila de upload aparece
6. R2 recebe vídeo → Worker dispara pipeline → status atualiza em realtime
7. Card no dashboard muda de "Processando" → "Publicado ✦"
8. Toast: "✦ Apartamento ficou pronto"
9. Compartilha link → cliente abre `/#/p/:slug`
10. Intro card cinematográfico → "Iniciar tour imersivo"
11. Modo imersivo fullscreen com WebGL Gaussian Splatting
```

O passo 6 (vídeo→splat real) depende do worker GPU — ver [docs/PHASE_4_PIPELINE.md](docs/PHASE_4_PIPELINE.md). Tudo o resto funciona hoje.

---

## 📁 Estrutura nova nesta versão

```
src/
├── components/
│   ├── onboarding/
│   │   └── BrokerOnboarding.jsx        ← cinematic 4-step intro
│   ├── pwa/
│   │   ├── InstallPrompt.jsx           ← faixa de instalação Android/iOS
│   │   └── UpdateNotification.jsx      ← toast nova versão
│   └── ... (resto inalterado)
├── hooks/
│   └── usePWA.js                       ← install + update + standalone
└── lib/
    └── cloud/
        └── propertyRealtime.js          ← subscribe Supabase Realtime
public/brand/
├── icon-192.png
├── icon-512.png
├── icon-maskable-512.png
└── apple-touch-icon.png
```

---

## 🧪 Roteiro para testar com corretor real

**Antes do encontro:**
1. `npm run build && npm run preview`
2. `npx ngrok http 4173` (precisa HTTPS para câmera + PWA)
3. Envie o link `https://...ngrok.app` para o corretor

**No encontro, peça ele para:**
1. Abrir o link no celular (~30s para sentir a marca)
2. Clicar "Instalar agora" na faixa que aparece (mostra como vira app)
3. Clicar "Entrar" → digitar e-mail → checar magic link
4. No dashboard, completar o onboarding cinematográfico
5. "Capturar" → filmar um imóvel real (qualquer cômodo serve)
6. Acompanhar fila de upload
7. (Sem pipeline GPU, fica em "Processando" — explique que é o próximo passo)

**O que perguntar:**
- "Pagaria R$ 99/mês por isso?"
- "Quantos imóveis por mês usaria?"
- "Qual é o cômodo mais difícil de filmar?"
- "Você instalaria no celular?"

10 dessas conversas valem mais que qualquer feature nova.

---

## 📚 Docs

- [CLOUD_SETUP.md](docs/CLOUD_SETUP.md) — Supabase + R2 + Worker
- [PHASE_4_PIPELINE.md](docs/PHASE_4_PIPELINE.md) — vídeo→splat
- [PHASES_5_TO_9.md](docs/PHASES_5_TO_9.md) — roadmap honesto

---

© MIGLI — Imersão 3D para o mercado imobiliário brasileiro.
