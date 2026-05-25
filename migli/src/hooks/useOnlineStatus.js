import { useEffect, useState } from 'react'

/**
 * useOnlineStatus — true se navegador relata online.
 *
 * Não é 100% confiável (browser pode reportar online sem internet real),
 * mas pega o caso mais comum de "ônibus entrou em túnel".
 */
export function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const onUp = () => setOnline(true)
    const onDown = () => setOnline(false)
    window.addEventListener('online', onUp)
    window.addEventListener('offline', onDown)
    return () => {
      window.removeEventListener('online', onUp)
      window.removeEventListener('offline', onDown)
    }
  }, [])

  return online
}
