import { useEffect, useState } from 'react'
import { getSession, onAuthChange, signOut as authSignOut } from '@lib/cloud/authService'
import { isCloudConfigured } from '@lib/cloud/config'

/**
 * useAuth — estado de autenticação React-friendly.
 *
 * Retorna:
 *   session    Supabase session ou null
 *   user       atalho para session.user
 *   ready      true quando o estado inicial foi resolvido
 *   cloudOn    se o cloud está configurado neste ambiente
 *   signOut()  encerra sessão
 */
export function useAuth() {
  const cloudOn = isCloudConfigured()
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(!cloudOn)

  useEffect(() => {
    if (!cloudOn) return
    let mounted = true

    getSession().then((s) => {
      if (!mounted) return
      setSession(s)
      setReady(true)
    })

    const unsub = onAuthChange((s) => {
      if (!mounted) return
      setSession(s)
      setReady(true)
    })

    return () => {
      mounted = false
      unsub()
    }
  }, [cloudOn])

  return {
    session,
    user: session?.user ?? null,
    ready,
    cloudOn,
    signOut: () => authSignOut(),
  }
}
