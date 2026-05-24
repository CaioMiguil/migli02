import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { getDefaultScene } from '@lib/splatCatalog'
import { LogoMark } from '@components/brand/Logo'

/**
 * SplatViewer — wrapper React do motor PlayCanvas.
 *
 * Estratégia de carregamento:
 *
 *   1. O componente monta com o canvas + um placeholder elegante. Nada
 *      pesado é importado ainda.
 *   2. Um IntersectionObserver detecta quando o canvas entra na viewport
 *      (ou imediatamente, se `eager`).
 *   3. Aí sim, `import('@lib/playcanvas')` baixa o chunk de ~1.5MB do
 *      PlayCanvas + dependências do gsplat.
 *   4. Boot do motor dentro de try/catch — se algo falhar, o error
 *      boundary acima captura, ou o estado local mostra um fallback.
 *
 * Isso garante que a homepage paint não fique bloqueado esperando o
 * motor 3D, e que falhas WebGL/init não derrubem o app.
 *
 * Métodos imperativos via ref:
 *   resetCamera, playCinematicIntro, setQuality, setExposure,
 *   getDevice, getQuality
 */
const SplatViewer = forwardRef(function SplatViewer(
  {
    scene = getDefaultScene(),
    className = '',
    eager = false,
    onProgress,
    onError,
    onReady,
  },
  ref,
) {
  const wrapperRef = useRef(null)
  const canvasRef = useRef(null)
  const viewerRef = useRef(null)
  const mountedRef = useRef(true)

  /**
   * Phases:
   *   'idle'    — canvas ainda não entrou na viewport
   *   'loading' — baixando chunk do PlayCanvas
   *   'booting' — motor inicializando
   *   'ready'   — motor pronto, cena carregada
   *   'error'   — falha não-recuperável (erro será propagado para boundary)
   */
  const [phase, setPhase] = useState('idle')
  const [loadProgress, setLoadProgress] = useState(0)
  const [loadingSplat, setLoadingSplat] = useState(Boolean(scene?.splatUrl))
  const [splatError, setSplatError] = useState(null)
  const [fatal, setFatal] = useState(null) // erro para arremessar no render

  useImperativeHandle(ref, () => ({
    resetCamera: () => viewerRef.current?.resetCamera(),
    playCinematicIntro: () => viewerRef.current?.playCinematicIntro(),
    setQuality: (tier) => viewerRef.current?.setQuality(tier),
    setExposure: (v) => viewerRef.current?.setExposure(v),
    getDevice: () => viewerRef.current?.device,
    getQuality: () => viewerRef.current?.quality,
  }))

  // Track unmount para evitar setState em componente desmontado
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  /**
   * Boot do motor — chama uma única vez quando o usuário precisa.
   * Idempotente: chamadas adicionais viram no-op se já bootou.
   */
  const bootEngine = useCallback(async () => {
    if (viewerRef.current) return // já bootou
    if (!canvasRef.current) return
    if (!mountedRef.current) return

    setPhase('loading')

    let createMigliViewer
    try {
      const mod = await import('@lib/playcanvas')
      createMigliViewer = mod.createMigliViewer
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[MIGLI] Falha ao carregar PlayCanvas:', err)
      if (mountedRef.current) {
        setPhase('error')
        setFatal(err)
      }
      return
    }

    if (!mountedRef.current || !canvasRef.current) return
    setPhase('booting')

    try {
      const viewer = createMigliViewer(canvasRef.current, {
        onReady: (info) => {
          if (!mountedRef.current) return
          setPhase('ready')
          onReady?.(info)
        },
        onProgress: (p, kind) => {
          if (!mountedRef.current) return
          setLoadProgress(p)
          onProgress?.(p, kind)
          if (p >= 1) setLoadingSplat(false)
        },
        onError: (err) => {
          if (!mountedRef.current) return
          // Erro de splat individual — não-fatal. O motor cai pra cena demo.
          setSplatError(err)
          setLoadingSplat(false)
          onError?.(err)
        },
      })
      viewerRef.current = viewer
    } catch (err) {
      // Erro fatal durante init do motor. O error boundary captura.
      // eslint-disable-next-line no-console
      console.error('[MIGLI] Falha fatal no boot do PlayCanvas:', err)
      if (mountedRef.current) {
        setPhase('error')
        setFatal(err)
      }
    }
  }, [onProgress, onError, onReady])

  // IntersectionObserver — defere o boot até o canvas estar visível,
  // economizando ~1.5MB de download na home se o usuário sair antes.
  useEffect(() => {
    if (eager) {
      bootEngine()
      return
    }

    const target = wrapperRef.current
    if (!target) return

    // Falha graciosa em browsers sem IntersectionObserver
    if (typeof IntersectionObserver === 'undefined') {
      bootEngine()
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            io.disconnect()
            bootEngine()
            break
          }
        }
      },
      { rootMargin: '200px' }, // antecipa boot 200px antes de entrar
    )
    io.observe(target)

    return () => io.disconnect()
  }, [eager, bootEngine])

  // Cleanup do motor no unmount
  useEffect(() => {
    return () => {
      try {
        viewerRef.current?.dispose()
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[MIGLI] Erro no dispose do viewer:', err)
      }
      viewerRef.current = null
    }
  }, [])

  // Carrega (ou recarrega) a cena quando muda
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || phase !== 'ready') return
    setSplatError(null)
    if (scene?.splatUrl) {
      setLoadingSplat(true)
      setLoadProgress(0)
    }
    viewer.loadScene(scene).catch((err) => {
      // O onError do motor já capturou e propagou
      // eslint-disable-next-line no-console
      console.warn('[MIGLI] loadScene falhou, fallback para cena demo:', err)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scene?.splatUrl])

  // Arremessa erro fatal para o ViewerErrorBoundary acima
  if (fatal) throw fatal

  const showBootLoader = phase === 'loading' || phase === 'booting'

  return (
    <div ref={wrapperRef} className={`relative h-full w-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="block h-full w-full"
        style={{ touchAction: 'none' }}
      />

      {/* Placeholder enquanto não bootou (idle) */}
      <AnimatePresence>
        {phase === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 flex items-center justify-center bg-ink-900/30 backdrop-blur-[2px]"
          >
            <div className="flex flex-col items-center gap-3 opacity-70">
              <LogoMark size={36} />
              <div className="text-[10px] tracking-widest2 text-aqua-300/70">
                EXPERIÊNCIA 3D
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loader durante boot (download do chunk + init do motor) */}
      <AnimatePresence>
        {showBootLoader && (
          <motion.div
            key="boot"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center bg-ink-900/85 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center gap-4">
              <LogoMark size={42} animated />
              <div className="flex items-center gap-2 text-[10px] tracking-widest2 text-aqua-300">
                <span className="h-1 w-1 animate-pulse rounded-full bg-aqua-400" />
                {phase === 'loading'
                  ? 'CARREGANDO MOTOR 3D'
                  : 'INICIANDO EXPERIÊNCIA'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progresso de download de splat */}
      <AnimatePresence>
        {phase === 'ready' && loadingSplat && (
          <motion.div
            key="splat-load"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center bg-ink-900/75 backdrop-blur-sm"
          >
            <div className="flex w-full max-w-xs flex-col items-center gap-5 px-6">
              <LogoMark size={36} animated />
              <div className="w-full">
                <div className="mb-2 flex justify-between text-[10px] tracking-widest2 text-aqua-300">
                  <span>CARREGANDO IMÓVEL</span>
                  <span className="tabular-nums">
                    {Math.round(loadProgress * 100)}%
                  </span>
                </div>
                <div className="h-[2px] overflow-hidden rounded-full bg-white/[0.08]">
                  <motion.div
                    className="h-full"
                    style={{
                      background: 'linear-gradient(90deg, #00C2FF, #7DD3FC)',
                    }}
                    animate={{ width: `${loadProgress * 100}%` }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <div className="text-center text-[11px] font-light leading-relaxed text-white/45">
                Preparando experiência imersiva em Gaussian Splatting
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chip não-bloqueante para erros de splat (cena demo continua) */}
      <AnimatePresence>
        {splatError && phase === 'ready' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute left-1/2 top-5 -translate-x-1/2 rounded-full border border-amber-400/30 bg-amber-500/10 px-4 py-1.5 text-[11px] text-amber-200/85 backdrop-blur-md"
          >
            Splat indisponível · exibindo demonstração
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

export default SplatViewer
