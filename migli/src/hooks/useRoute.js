import { useEffect, useState } from 'react'

/**
 * Minimal hash-based router — não precisamos de react-router para o
 * tamanho atual da app. Suporta 3 rotas:
 *
 *   #/              → landing (home)
 *   #/dashboard     → painel do corretor
 *   #/p/:slug       → página pública do imóvel
 *
 * Rotas baseadas em hash funcionam em qualquer host estático (Vercel,
 * Cloudflare Pages, S3) sem precisar configurar rewrites.
 */
export function useRoute() {
  const [route, setRoute] = useState(parseRoute())

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return route
}

export function navigate(path) {
  // Cleans up to one leading slash
  const clean = '/' + path.replace(/^\/+/, '')
  window.location.hash = clean
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const parts = raw.split('/').filter(Boolean)

  if (parts.length === 0) return { name: 'home', params: {} }
  if (parts[0] === 'dashboard') return { name: 'dashboard', params: {} }
  if (parts[0] === 'p' && parts[1]) return { name: 'property', params: { slug: parts[1] } }

  return { name: 'home', params: {} }
}
