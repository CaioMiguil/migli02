import { useEffect, useState } from 'react'

/**
 * Animate a number from 0 to `end` over `duration` ms.
 * Only animates while `active` is true.
 */
export function useCountUp(end, { duration = 1500, active = true } = {}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    let raf
    const start = performance.now()

    const step = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * end))
      if (progress < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [end, duration, active])

  return value
}
