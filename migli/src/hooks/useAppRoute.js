import { useEffect, useState } from 'react'

/**
 * Router minimalista para o app shell mobile.
 *
 * Rotas:
 *   #/                → tab Home
 *   #/capturar        → tab Capturar (abre scan fullscreen)
 *   #/biblioteca      → tab Biblioteca (lista de imóveis)
 *   #/plano           → tab Plano
 *   #/perfil          → tab Perfil
 *   #/p/:slug         → página pública do imóvel (sem app shell)
 *
 * Rotas baseadas em hash funcionam em qualquer host estático.
 */
export const TABS = ['home', 'capturar', 'biblioteca', 'plano', 'perfil']

export function useAppRoute() {
  const [route, setRoute] = useState(parseRoute())

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return route
}

export function navigate(path) {
  const clean = '/' + path.replace(/^\/+/, '')
  if (window.location.hash !== '#' + clean) {
    window.location.hash = clean
  }
}

function parseRoute() {
  const raw = window.location.hash.replace(/^#/, '') || '/'
  const parts = raw.split('/').filter(Boolean)

  if (parts.length === 0) return { name: 'home', params: {} }
  if (parts[0] === 'p' && parts[1]) {
    return { name: 'property', params: { slug: parts[1] } }
  }
  if (TABS.includes(parts[0])) {
    return { name: parts[0], params: {} }
  }
  return { name: 'home', params: {} }
}
