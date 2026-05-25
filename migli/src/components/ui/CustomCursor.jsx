import { useEffect, useRef, useState } from 'react'
import { useMousePosition } from '@hooks/useMousePosition'

/**
 * Premium custom cursor with magnetic ring follower.
 * Activates on any element with `data-hover` attribute or interactive tag.
 * Hidden on touch devices via CSS media query.
 */
export default function CustomCursor() {
  const { x, y, visible } = useMousePosition()
  const ringRef = useRef(null)
  const ringPos = useRef({ x: 0, y: 0 })
  const [hovering, setHovering] = useState(false)

  // Animate ring with lerp easing
  useEffect(() => {
    let raf
    const tick = () => {
      ringPos.current.x += (x - ringPos.current.x) * 0.16
      ringPos.current.y += (y - ringPos.current.y) * 0.16
      if (ringRef.current) {
        ringRef.current.style.transform = `translate(${ringPos.current.x}px, ${ringPos.current.y}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [x, y])

  // Detect interactive hover state
  useEffect(() => {
    const onEnter = (e) => {
      const t = e.target
      if (!t.closest) return
      if (t.closest('a, button, [data-hover]')) setHovering(true)
    }
    const onLeave = (e) => {
      const t = e.target
      if (!t.closest) return
      if (t.closest('a, button, [data-hover]')) setHovering(false)
    }
    document.addEventListener('mouseover', onEnter)
    document.addEventListener('mouseout', onLeave)
    return () => {
      document.removeEventListener('mouseover', onEnter)
      document.removeEventListener('mouseout', onLeave)
    }
  }, [])

  if (!visible) return null

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed z-[9999] hidden md:block rounded-full bg-aqua-400 mix-blend-screen transition-[width,height,opacity] duration-200"
        style={{
          width: hovering ? 20 : 12,
          height: hovering ? 20 : 12,
          left: x,
          top: y,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed z-[9998] hidden md:block rounded-full border transition-[width,height,border-color] duration-200"
        style={{
          width: hovering ? 56 : 36,
          height: hovering ? 56 : 36,
          borderColor: hovering ? 'rgba(0,194,255,0.8)' : 'rgba(0,194,255,0.5)',
          left: 0,
          top: 0,
        }}
      />
    </>
  )
}
