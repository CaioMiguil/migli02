import { useEffect, useRef } from 'react'

/**
 * ParticleMesh — partículas formando uma onda fluida ou hélice DNA.
 *
 * Variant 'wave': onda horizontal fluida (linha que ondula como água)
 * Variant 'helix': hélice DNA dupla rotacionando
 *
 * Inspirado nos elementos visuais do Structure.run (curve glow, DNA mesh).
 */
export default function ParticleMesh({
  variant = 'wave',
  intensity = 1,
  className = '',
}) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d', { alpha: true })
    let raf = 0
    let width = 0
    let height = 0
    let dpr = 1
    let time = 0
    let visible = true

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.scale(dpr, dpr)
    }

    function drawWave() {
      ctx.clearRect(0, 0, width, height)
      const points = 90
      const cy = height / 2
      // Múltiplas linhas de onda sobrepostas
      for (let layer = 0; layer < 3; layer++) {
        const layerPhase = layer * 0.4
        const layerAmplitude = 30 - layer * 8
        const alpha = 0.6 - layer * 0.18

        for (let i = 0; i < points; i++) {
          const t = i / (points - 1)
          const x = t * width
          const wave1 = Math.sin(t * Math.PI * 4 + time + layerPhase) * layerAmplitude
          const wave2 = Math.sin(t * Math.PI * 2.3 - time * 0.7 + layerPhase) * (layerAmplitude * 0.5)
          const y = cy + wave1 + wave2

          const hue = 195 + layer * 5
          const size = 1.4 + Math.sin(time * 2 + t * Math.PI * 4) * 0.8
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${alpha * intensity})`
          ctx.fill()

          // Halo
          ctx.beginPath()
          ctx.arc(x, y, size * 3, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${alpha * 0.12 * intensity})`
          ctx.fill()
        }
      }
    }

    function drawHelix() {
      ctx.clearRect(0, 0, width, height)
      const points = 60
      const cx = width / 2
      const totalHeight = height * 0.9
      const startY = (height - totalHeight) / 2

      // 2 strands
      for (let strand = 0; strand < 2; strand++) {
        const strandOffset = strand * Math.PI
        for (let i = 0; i < points; i++) {
          const t = i / (points - 1)
          const y = startY + t * totalHeight
          const angle = t * Math.PI * 4 + time * 0.5 + strandOffset
          const radius = 60 + Math.sin(time + t * 2) * 8
          const x = cx + Math.cos(angle) * radius
          const z = Math.sin(angle) // -1..1 — usado pra depth alpha
          const depthAlpha = 0.4 + (z + 1) * 0.3

          const size = 2 + (z + 1) * 1.2
          ctx.beginPath()
          ctx.arc(x, y, size, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(195, 90%, ${50 + (z + 1) * 15}%, ${depthAlpha * intensity})`
          ctx.fill()

          // Halo
          ctx.beginPath()
          ctx.arc(x, y, size * 2.5, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(195, 90%, 65%, ${depthAlpha * 0.18 * intensity})`
          ctx.fill()

          // Linhas de conexão entre os strands
          if (strand === 0 && i % 4 === 0) {
            const oppositeAngle = angle + Math.PI
            const ox = cx + Math.cos(oppositeAngle) * radius
            ctx.beginPath()
            ctx.moveTo(x, y)
            ctx.lineTo(ox, y)
            ctx.strokeStyle = `hsla(195, 90%, 65%, ${0.10 * intensity})`
            ctx.lineWidth = 0.6
            ctx.stroke()
          }
        }
      }
    }

    function tick() {
      if (!visible) {
        raf = requestAnimationFrame(tick)
        return
      }
      if (!reducedMotion) time += 0.018
      if (variant === 'helix') drawHelix()
      else drawWave()
      raf = requestAnimationFrame(tick)
    }

    const onVisChange = () => {
      visible = document.visibilityState === 'visible'
    }
    document.addEventListener('visibilitychange', onVisChange)

    const resizeObs = new ResizeObserver(resize)
    resizeObs.observe(canvas)
    resize()
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      resizeObs.disconnect()
      document.removeEventListener('visibilitychange', onVisChange)
    }
  }, [variant, intensity])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
