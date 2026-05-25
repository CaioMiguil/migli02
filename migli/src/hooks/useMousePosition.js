import { useEffect, useState } from 'react'

/** Track global mouse position. Returns { x, y, visible }. */
export function useMousePosition() {
  const [pos, setPos] = useState({ x: 0, y: 0, visible: false })

  useEffect(() => {
    const onMove = (e) => setPos({ x: e.clientX, y: e.clientY, visible: true })
    const onLeave = () => setPos((p) => ({ ...p, visible: false }))
    window.addEventListener('mousemove', onMove)
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return pos
}
