import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { Maximize, RotateCcw, X, Info, Share2 } from 'lucide-react'
import SplatViewer from './SplatViewer'
import ViewerErrorBoundary from './ViewerErrorBoundary'
import { LogoMark } from '@components/brand/Logo'
import LogoWatermark from '@components/brand/LogoWatermark'

/**
 * Modo imersivo de visualização — ocupa a tela inteira do dispositivo.
 *
 * Comportamentos:
 *   - Aciona fullscreen automaticamente ao abrir (quando permitido)
 *   - HUD auto-oculta após 4s sem interação, reaparece ao tocar
 *   - Trava scroll do body
 *   - Esc para sair
 *   - Mobile-safe: usa dynamic viewport, respeita safe-area
 */
export default function ImmersiveViewer({ open, scene, onClose, propertyMeta }) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const hideTimer = useRef(null)
  const [hudVisible, setHudVisible] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [shareToast, setShareToast] = useState(false)

  // Trava o body, ativa fullscreen
  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Tenta entrar em fullscreen do dispositivo (não funciona em iOS Safari)
    const tryFullscreen = async () => {
      try {
        await containerRef.current?.requestFullscreen?.()
      } catch {
        /* navegador bloqueou ou não suporta — sem problema */
      }
    }
    tryFullscreen()

    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {})
      }
    }
  }, [open, onClose])

  // Auto-hide do HUD
  const bumpHud = () => {
    setHudVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setHudVisible(false)
    }, 4000)
  }

  useEffect(() => {
    if (!open) return
    bumpHud()
    return () => clearTimeout(hideTimer.current)
  }, [open])

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Tour imersivo · MIGLI',
          text: propertyMeta?.name || 'Veja este imóvel em 3D',
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setShareToast(true)
        setTimeout(() => setShareToast(false), 2200)
      }
    } catch {
      /* user canceled */
    }
  }

  if (!open) return null

  return (
    <AnimatePresence>
      <motion.div
        key="immersive"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        ref={containerRef}
        onPointerMove={bumpHud}
        onPointerDown={bumpHud}
        className="fixed inset-0 z-[9500] h-dscreen w-screen bg-black"
      >
        {/* O splat viewer ocupa tudo */}
        <div className="absolute inset-0">
          <ViewerErrorBoundary>
            <SplatViewer ref={viewerRef} scene={scene} eager />
          </ViewerErrorBoundary>
        </div>

        {/* HUD — top bar */}
        <AnimatePresence>
          {hudVisible && (
            <>
              <motion.div
                key="hud-top"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4 md:p-6"
                style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
              >
                <div className="pointer-events-auto flex items-center gap-3">
                  <button
                    onClick={onClose}
                    aria-label="Sair"
                    data-hover
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/85 backdrop-blur-md transition-all hover:bg-white/10 active:scale-95"
                  >
                    <X size={18} strokeWidth={1.6} />
                  </button>
                  <div className="hidden flex-col leading-tight md:flex">
                    <div className="font-display text-sm font-bold text-white">
                      {propertyMeta?.name ?? 'Tour imersivo'}
                    </div>
                    {propertyMeta?.status && (
                      <div className="mt-0.5 text-[10px] tracking-wider text-aqua-300/80">
                        {propertyMeta.status}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pointer-events-auto flex items-center gap-2">
                  <HudButton
                    icon={Share2}
                    label="Compartilhar"
                    onClick={handleShare}
                  />
                  <HudButton
                    icon={Info}
                    label="Detalhes"
                    onClick={() => setShowInfo((v) => !v)}
                    active={showInfo}
                  />
                  <HudButton
                    icon={RotateCcw}
                    label="Recentralizar"
                    onClick={() => viewerRef.current?.resetCamera()}
                  />
                </div>
              </motion.div>

              {/* HUD — bottom hint */}
              <motion.div
                key="hud-bottom"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex items-end justify-center p-4 md:p-6"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}
              >
                <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[11px] tracking-wider text-white/65 backdrop-blur-md">
                  Arraste para explorar · Pinça ou rolagem para aproximar
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Painel de detalhes do imóvel */}
        <AnimatePresence>
          {showInfo && propertyMeta && (
            <motion.div
              initial={{ x: 360, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 360, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-4 top-20 z-20 w-[280px] rounded-2xl border border-glass-border bg-ink-900/95 p-5 backdrop-blur-2xl md:right-6"
            >
              <div className="font-display text-base font-bold">
                {propertyMeta.name}
              </div>
              {propertyMeta.area && (
                <div className="mt-2 text-xs text-white/55">
                  {propertyMeta.area} · {propertyMeta.highlight}
                </div>
              )}
              {propertyMeta.rooms && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {propertyMeta.rooms.map((r) => (
                    <div
                      key={r}
                      className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/65"
                    >
                      {r}
                    </div>
                  ))}
                </div>
              )}
              {propertyMeta.price && (
                <div className="mt-4 font-display text-xl font-bold gradient-text">
                  {propertyMeta.price}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share toast */}
        <AnimatePresence>
          {shareToast && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="pointer-events-none absolute bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full border border-aqua-400/30 bg-black/70 px-4 py-2 text-[12px] text-aqua-200 backdrop-blur-md"
            >
              Link copiado ✦
            </motion.div>
          )}
        </AnimatePresence>

        {/* Marca discreta */}
        <LogoWatermark position="bottom-right" size={22} opacity={0.5} />
      </motion.div>
    </AnimatePresence>
  )
}

function HudButton({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-hover
      className={`flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-md transition-all active:scale-95 ${
        active
          ? 'border-aqua-400 bg-aqua-400/15 text-aqua-300'
          : 'border-white/15 bg-black/50 text-white/85 hover:bg-white/10'
      }`}
    >
      <Icon size={16} strokeWidth={1.6} />
    </button>
  )
}

// Avoid lint unused import warning
void Maximize
