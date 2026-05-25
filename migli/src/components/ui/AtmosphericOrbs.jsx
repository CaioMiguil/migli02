import { motion } from 'framer-motion'

/**
 * AtmosphericOrbs — 3 orbs flutuantes de glow azul/ocean dando profundidade.
 *
 * Ultra leve (CSS only, sem canvas). Cria sensação de "depth" e atmosfera
 * sem custar performance.
 */
export default function AtmosphericOrbs({ density = 1 }) {
  const orbs = [
    {
      size: 380 * density,
      x: '-20%',
      y: '-15%',
      color: 'rgba(0, 194, 255, 0.22)',
      duration: 16,
    },
    {
      size: 320 * density,
      x: '110%',
      y: '40%',
      color: 'rgba(91, 188, 239, 0.16)',
      duration: 22,
    },
    {
      size: 280 * density,
      x: '50%',
      y: '110%',
      color: 'rgba(14, 138, 196, 0.18)',
      duration: 19,
    },
  ]

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: o.size,
            height: o.size,
            left: o.x,
            top: o.y,
            background: o.color,
            filter: 'blur(70px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 20, 0],
          }}
          transition={{
            duration: o.duration,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
