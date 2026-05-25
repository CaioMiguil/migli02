import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * useDeviceOrientation — wrapper que respeita o gate de permissão iOS.
 *
 * Em iOS 13+, `window.DeviceOrientationEvent.requestPermission()` precisa ser
 * chamado de dentro de um user gesture (tap). Antes disso, eventos
 * 'deviceorientation' não chegam.
 *
 * Em Android e iOS < 13, o evento dispara sem permissão explícita.
 *
 * Estados:
 *   permission: 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'
 *   orientation: { alpha, beta, gamma } (null se sem permissão)
 *
 * Uso:
 *   const { permission, request, orientation } = useDeviceOrientation()
 *   // No componente, dentro de onClick:
 *   <button onClick={request}>Permitir orientação</button>
 */
export function useDeviceOrientation({ onChange } = {}) {
  const [permission, setPermission] = useState(() => {
    if (typeof window === 'undefined') return 'unsupported'
    if (typeof DeviceOrientationEvent === 'undefined') return 'unsupported'
    // iOS 13+ exige permission. Detecta pela existência do método estático.
    const needsPermission =
      typeof DeviceOrientationEvent.requestPermission === 'function'
    return needsPermission ? 'prompt' : 'granted'
  })
  const [orientation, setOrientation] = useState(null)
  const handlerRef = useRef(null)

  const handle = useCallback(
    (e) => {
      const next = {
        alpha: e.alpha ?? 0,
        beta: e.beta ?? 0,
        gamma: e.gamma ?? 0,
      }
      setOrientation(next)
      onChange?.(next, e)
    },
    [onChange],
  )

  // Manter handler em ref pra cleanup sem recriar listener
  useEffect(() => {
    handlerRef.current = handle
  }, [handle])

  const attach = useCallback(() => {
    const wrapper = (e) => handlerRef.current?.(e)
    window.addEventListener('deviceorientation', wrapper, true)
    return () => window.removeEventListener('deviceorientation', wrapper, true)
  }, [])

  // Anexa imediatamente se já está granted (Android, iOS<13)
  useEffect(() => {
    if (permission !== 'granted') return
    const detach = attach()
    return detach
  }, [permission, attach])

  /**
   * Pede permissão ao usuário. DEVE ser chamado dentro de um user gesture
   * (onClick, onTouchEnd) — caso contrário o iOS rejeita silenciosamente.
   */
  const request = useCallback(async () => {
    if (permission === 'granted') return 'granted'
    if (permission === 'unsupported') return 'unsupported'
    try {
      const result = await DeviceOrientationEvent.requestPermission()
      if (result === 'granted') {
        setPermission('granted')
        return 'granted'
      }
      setPermission('denied')
      return 'denied'
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[MIGLI] requestPermission falhou:', err)
      setPermission('denied')
      return 'denied'
    }
  }, [permission])

  return { permission, orientation, request }
}
