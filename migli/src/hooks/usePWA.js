import { useCallback, useEffect, useState } from 'react'

// O `virtual:pwa-register` é injetado pelo vite-plugin-pwa em build/preview.
// Em dev sem PWA habilitado, o import lança — falha silenciosa para
// manter o dev loop limpo.
let _registerSW = null
let _swRegisterAttempted = false
async function ensureSW(callbacks) {
  if (_swRegisterAttempted) return _registerSW
  _swRegisterAttempted = true
  try {
    const mod = await import(/* @vite-ignore */ 'virtual:pwa-register')
    _registerSW = mod.registerSW(callbacks)
  } catch {
    _registerSW = null
  }
  return _registerSW
}

/**
 * usePWA — estado e ações relacionadas à PWA.
 *
 * Expõe:
 *   canInstall    pode pedir instalação via prompt nativo (Android/desktop)?
 *   installed     já está rodando como app instalado?
 *   isIOS         é iOS Safari (precisa de instrução manual)?
 *   needsRefresh  service worker baixou nova versão?
 *   install()     dispara o prompt nativo de instalação
 *   updateApp()   ativa o novo SW e recarrega
 */
export function usePWA() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null)
  const [installed, setInstalled] = useState(isStandalone())
  const [isIOS] = useState(detectIOS())
  const [needsRefresh, setNeedsRefresh] = useState(false)
  const [updateFn, setUpdateFn] = useState(() => () => {})

  // Install prompt + standalone
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setInstallPromptEvent(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setInstallPromptEvent(null)
    }
    const onDisplayChange = () => setInstalled(isStandalone())

    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    const mq = window.matchMedia('(display-mode: standalone)')
    mq.addEventListener?.('change', onDisplayChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
      mq.removeEventListener?.('change', onDisplayChange)
    }
  }, [])

  // Service worker registration + update detection
  useEffect(() => {
    let mounted = true
    ensureSW({
      onNeedRefresh() {
        if (mounted) setNeedsRefresh(true)
      },
      onOfflineReady() {
        // silencioso — apenas marca log
        // eslint-disable-next-line no-console
        console.info('[MIGLI] Pronto para uso offline')
      },
    }).then((fn) => {
      if (mounted && fn) setUpdateFn(() => fn)
    })
    return () => {
      mounted = false
    }
  }, [])

  const install = useCallback(async () => {
    if (!installPromptEvent) return { ok: false, reason: 'no-prompt' }
    installPromptEvent.prompt()
    const choice = await installPromptEvent.userChoice
    setInstallPromptEvent(null)
    return { ok: choice?.outcome === 'accepted', outcome: choice?.outcome }
  }, [installPromptEvent])

  const updateApp = useCallback(() => {
    setNeedsRefresh(false)
    try {
      updateFn(true) // skip waiting + reload
    } catch {
      window.location.reload()
    }
  }, [updateFn])

  return {
    canInstall: !!installPromptEvent && !installed,
    installed,
    isIOS,
    needsRefresh,
    install,
    updateApp,
  }
}

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  )
}

function detectIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}
