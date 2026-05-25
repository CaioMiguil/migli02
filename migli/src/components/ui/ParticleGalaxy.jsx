import { useEffect, useRef } from 'react'

/**
 * ParticleGalaxy — campo de partículas em espiral / galáxia.
 *
 * Inspirado no hero do Structure.run. Renderiza ~600 partículas azuis
 * distribuídas em forma de galáxia espiral, com rotação lenta e brilho
 * pulsante. Usa Canvas 2D (não WebGL) — performance OK em iPhone moderno.
 *
 * Props:
 *   density: 0..1 multiplicador do número de partículas (default 1)
 *   rotation: graus por segundo (default 6)
 *   intensity: 0..1 brilho geral
 */
export default function ParticleGalaxy({
  density = 1,
  rotation = 6,
  intensity = 1,
  className = '',
}) {
  const canvasRef = useRef(null)
  const reducedMotion = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Respeita prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.current = mediaQuery.matches

    const ctx = canvas.getContext('2d', { alpha: true })
    let raf = 0
    let particles = []
    let width = 0
    let height = 0
    let dpr = 1
    let angle = 0
    let lastTime = 0
    let visible = true

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.scale(dpr, dpr)
      buildParticles()
    }

    function buildParticles() {
      const count = Math.round(440 * density)
      particles = []
      const cx = width / 2
      const cy = height / 2
      const maxR = Math.min(width, height) * 0.5

      for (let i = 0; i < count; i++) {
        // Distribui ao longo de braços espirais (4 braços)
        const arm = Math.floor(Math.random() * 4)
        const armOffset = (arm * Math.PI * 2) / 4
        // Distância radial — bias pro centro
        const t = Math.pow(Math.random(), 0.6)
        const r = t * maxR
        // Ângulo: arm + twist por raio (cria espiral)
        const twist = (r / maxR) * Math.PI * 1.8
        const baseAngle = armOffset + twist + (Math.random() - 0.5) * 0.6

        particles.push({
          baseAngle,
          r,
          // Pequeno wobble individual
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.5 + Math.random() * 1.2,
          size: 0.5 + Math.random() * 1.8 + (1 - t) * 1.2,
          // Cor: centro mais branco/aqua, bordas mais azul profundo
          hue: 195 + Math.random() * 15,
          sat: 80 + (1 - t) * 20,
          light: 55 + (1 - t) * 30,
          // Brilho pulsante individual
          alpha: 0.3 + Math.random() * 0.6,
          alphaSpeed: 0.4 + Math.random() * 0.8,
          cx,
          cy,
        })
      }
    }

    function tick(timestamp) {
      if (!visible) {
        raf = requestAnimationFrame(tick)
        return
      }
      const dt = lastTime ? (timestamp - lastTime) / 1000 : 0
      lastTime = timestamp
      angle += (rotation * Math.PI) / 180 * dt
      if (reducedMotion.current) angle = 0

      ctx.clearRect(0, 0, width, height)

      // Glow central — gradient radial
      const cx = width / 2
      const cy = height / 2
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.5)
      grd.addColorStop(0, `rgba(0, 194, 255, ${0.12 * intensity})`)
      grd.addColorStop(0.4, `rgba(14, 138, 196, ${0.06 * intensity})`)
      grd.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = grd
      ctx.fillRect(0, 0, width, height)

      // Partículas
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.wobble += p.wobbleSpeed * dt
        const a = p.baseAngle + angle
        const px = p.cx + Math.cos(a) * p.r + Math.cos(p.wobble) * 1.5
        const py = p.cy + Math.sin(a) * p.r * 0.5 + Math.sin(p.wobble) * 1.5
        const alpha = p.alpha * intensity * (0.6 + 0.4 * Math.sin(p.wobble * p.alphaSpeed))

        ctx.beginPath()
        ctx.arc(px, py, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${alpha})`
        ctx.fill()

        // Halo para partículas grandes
        if (p.size > 1.5) {
          ctx.beginPath()
          ctx.arc(px, py, p.size * 2.4, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${p.hue}, ${p.sat}%, ${p.light}%, ${alpha * 0.15})`
          ctx.fill()
        }
      }

      raf = requestAnimationFrame(tick)
    }

    const onVisChange = () => {
      visible = document.visibilityState === 'visible'
      if (visible) lastTime = 0
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
  }, [density, rotation, intensity])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  )
}
