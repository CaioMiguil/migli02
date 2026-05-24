import { Maximize, Minimize, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Painel flutuante de controles do viewer.
 * Recebe `onReset` para resetar a câmera, e gerencia fullscreen sozinho.
 */
export default function ViewerControls({ onReset, containerRef }) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = async () => {
    const el = containerRef?.current
    if (!el) return
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen?.()
      } else {
        await document.exitFullscreen?.()
      }
    } catch {
      /* user denied or unsupported — silent */
    }
  }

  const controls = [
    {
      icon: RotateCcw,
      label: 'Recentralizar câmera',
      onClick: onReset,
    },
    {
      icon: isFullscreen ? Minimize : Maximize,
      label: isFullscreen ? 'Sair da tela cheia' : 'Tela cheia',
      onClick: toggleFullscreen,
    },
  ]

  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      {controls.map(({ icon: Icon, label, onClick }) => (
        <button
          key={label}
          title={label}
          aria-label={label}
          onClick={onClick}
          className="glass-aqua flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-all hover:border-aqua-400 hover:text-aqua-400 active:scale-95"
          data-hover
        >
          <Icon size={16} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  )
}
