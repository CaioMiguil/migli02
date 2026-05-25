import { useMemo } from 'react'

/**
 * CoverageRing — anel SVG mostrando cobertura panorâmica.
 *
 * Divide os 360° em N segmentos. Cada segmento acende conforme o usuário
 * gira o celular e cobre aquela faixa de yaw (alpha).
 *
 * Renderiza também:
 *   - "ponteiro" (needle) apontando pro heading atual
 *   - seta sugerindo a faixa não-coberta mais próxima
 *
 * Props:
 *   coverage: array de 12 booleanos OU bits (qual segmento já coberto)
 *   heading: 0..360 yaw atual (graus)
 *   size: diâmetro do SVG em px
 */
const SEGMENTS = 12

export default function CoverageRing({ coverage, heading = 0, size = 160 }) {
  const segments = useMemo(() => {
    const list = []
    for (let i = 0; i < SEGMENTS; i++) {
      const startAngle = (i / SEGMENTS) * 360 - 90 // -90 para começar no topo
      const endAngle = ((i + 1) / SEGMENTS) * 360 - 90
      list.push({
        i,
        path: arcPath(size / 2, size / 2, size / 2 - 6, startAngle, endAngle),
        covered: !!coverage?.[i],
      })
    }
    return list
  }, [coverage, size])

  const needleAngle = heading - 90 // SVG zero é direita; -90 leva pro topo

  // Sugestão de direção: pega o segmento não-coberto mais próximo (CCW ou CW)
  const suggestion = useMemo(() => {
    if (!coverage) return null
    const currentSegment = Math.floor(((heading + 360) % 360) / (360 / SEGMENTS))
    if (coverage[currentSegment]) {
      // Já capturou aqui — sugere ir pro próximo não-coberto
      for (let offset = 1; offset <= SEGMENTS / 2; offset++) {
        const cwIdx = (currentSegment + offset) % SEGMENTS
        const ccwIdx = (currentSegment - offset + SEGMENTS) % SEGMENTS
        if (!coverage[cwIdx]) return 'right'
        if (!coverage[ccwIdx]) return 'left'
      }
    }
    return null
  }, [coverage, heading])

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="cov-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0E8AC4" />
          <stop offset="100%" stopColor="#3FA8DA" />
        </linearGradient>
        <radialGradient id="cov-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(14,138,196,0.35)" />
          <stop offset="100%" stopColor="rgba(14,138,196,0)" />
        </radialGradient>
      </defs>

      {/* Glow interno se já há cobertura */}
      {coverage?.some(Boolean) && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 12}
          fill="url(#cov-glow)"
        />
      )}

      {/* Segmentos */}
      {segments.map((seg) => (
        <path
          key={seg.i}
          d={seg.path}
          stroke={seg.covered ? 'url(#cov-fill)' : 'rgba(255,255,255,0.18)'}
          strokeWidth={seg.covered ? 4 : 2}
          fill="none"
          strokeLinecap="round"
          style={{
            transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: seg.covered ? 'drop-shadow(0 0 4px rgba(14,138,196,0.5))' : 'none',
          }}
        />
      ))}

      {/* Needle do heading atual */}
      <g
        transform={`rotate(${needleAngle} ${size / 2} ${size / 2})`}
        style={{ transition: 'transform 0.2s ease-out' }}
      >
        <line
          x1={size / 2}
          y1={size / 2}
          x2={size / 2 + (size / 2 - 8)}
          y2={size / 2}
          stroke="#00C2FF"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.85}
        />
        {/* Ponteiro tip */}
        <circle
          cx={size / 2 + (size / 2 - 8)}
          cy={size / 2}
          r={4}
          fill="#00C2FF"
          style={{ filter: 'drop-shadow(0 0 6px rgba(0,194,255,0.8))' }}
        />
      </g>

      {/* Centro: número da cobertura */}
      <text
        x={size / 2}
        y={size / 2}
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Montserrat, sans-serif"
        fontSize="22"
        fontWeight="700"
        fill="white"
        style={{ letterSpacing: '-0.04em' }}
      >
        {Math.round((coverage?.filter(Boolean).length || 0) * (100 / SEGMENTS))}%
      </text>
      <text
        x={size / 2}
        y={size / 2 + 16}
        dominantBaseline="middle"
        textAnchor="middle"
        fontFamily="Montserrat, sans-serif"
        fontSize="8"
        fontWeight="600"
        fill="rgba(255,255,255,0.5)"
        style={{ letterSpacing: '0.18em' }}
      >
        COBERTURA
      </text>

      {/* Setinhas indicando direção sugerida */}
      {suggestion === 'right' && (
        <g
          transform={`translate(${size - 4} ${size / 2})`}
          style={{ animation: 'mig-arrow-pulse 1.4s ease-in-out infinite' }}
        >
          <path d="M 0 -6 L 8 0 L 0 6 Z" fill="#00C2FF" opacity={0.85} />
        </g>
      )}
      {suggestion === 'left' && (
        <g
          transform={`translate(4 ${size / 2})`}
          style={{ animation: 'mig-arrow-pulse 1.4s ease-in-out infinite' }}
        >
          <path d="M 0 -6 L -8 0 L 0 6 Z" fill="#00C2FF" opacity={0.85} />
        </g>
      )}
    </svg>
  )
}

/**
 * Coverage utilities — convertem yaw delta acumulado em array de bits.
 */
export const COVERAGE_SEGMENTS = SEGMENTS

export function createCoverageMap() {
  return new Array(SEGMENTS).fill(false)
}

export function markCoverage(coverage, headingDeg) {
  const next = coverage.slice()
  const idx = Math.floor(((headingDeg + 360) % 360) / (360 / SEGMENTS))
  next[idx] = true
  return next
}

/* ───────── helpers SVG ───────── */
function polarToCartesian(cx, cy, r, angleDeg) {
  const a = (angleDeg * Math.PI) / 180.0
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1
  // SVG arc: M start, A rx ry x-rot large-arc sweep end
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}
