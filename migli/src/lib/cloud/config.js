// MIGLI · Configuração da camada de cloud
// ------------------------------------------------------------
// As variáveis de ambiente vivem em `.env.local` (não comitar!) e são
// expostas ao Vite via prefixo VITE_. Veja `.env.example` na raiz do
// projeto para um template completo.
//
// IMPORTANTE: as keys aqui são PÚBLICAS (anon key Supabase, URL do worker
// R2). Nunca exponha service-role keys, secrets da R2, ou tokens privados
// no frontend.

const env = (key, fallback = '') => {
  try {
    return import.meta.env?.[key] ?? fallback
  } catch {
    return fallback
  }
}

export const CLOUD = {
  // Supabase — autenticação + DB de metadados de imóveis
  supabase: {
    url: env('VITE_SUPABASE_URL'),
    anonKey: env('VITE_SUPABASE_ANON_KEY'),
  },
  // Cloudflare Worker que emite URLs pré-assinadas para R2
  uploadApi: {
    baseUrl: env('VITE_UPLOAD_API_URL'),
  },
  // Bucket público R2 para servir splats finalizados (ou Cloudflare CDN)
  cdn: {
    baseUrl: env('VITE_CDN_BASE_URL'),
  },
}

/**
 * `true` quando todas as credenciais estão configuradas.
 * Usado para detectar se devemos rodar em modo cloud ou local-only.
 */
export function isCloudConfigured() {
  return Boolean(
    CLOUD.supabase.url &&
      CLOUD.supabase.anonKey &&
      CLOUD.uploadApi.baseUrl,
  )
}
