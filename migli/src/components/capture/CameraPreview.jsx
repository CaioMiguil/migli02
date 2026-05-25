import { motion } from 'framer-motion'
import { forwardRef } from 'react'

/**
 * Full-bleed camera preview surface. Renders the <video> tag and a
 * cinematic safe-area / framing guide overlay.
 *
 * Designed for mobile portrait but degrades gracefully on desktop.
 */
const CameraPreview = forwardRef(function CameraPreview(
  { mirrored = false, children },
  ref,
) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* The actual camera stream */}
      <video
        ref={ref}
        playsInline
        autoPlay
        muted
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: mirrored ? 'scaleX(-1)' : 'none' }}
      />

      {/* Cinematic letterbox vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Framing guides — subtle rule-of-thirds + center reticle */}
      <FramingGuides />

      {/* Brand accent edges */}
      <CornerBrackets />

      {children}
    </div>
  )
})

export default CameraPreview

function FramingGuides() {
  return (
    <motion.svg
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.18 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Thirds */}
      <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="white" strokeWidth="0.15" />
      <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="white" strokeWidth="0.15" />
      <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="white" strokeWidth="0.15" />
      <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="white" strokeWidth="0.15" />
      {/* Center reticle */}
      <circle cx="50" cy="50" r="0.7" fill="#00C2FF" />
      <circle cx="50" cy="50" r="2.5" fill="none" stroke="#00C2FF" strokeWidth="0.25" />
    </motion.svg>
  )
}

function CornerBrackets() {
  // 4 aqua corner brackets — signature MIGLI capture frame
  // Implemented as positioned DOM elements (not SVG) so they can use
  // CSS pixel offsets and scale crisply on any viewport.
  const stroke = 'rgba(0, 194, 255, 0.85)'
  const filter = 'drop-shadow(0 0 6px rgba(0,194,255,0.55))'
  const arm = 28
  const thickness = 2
  const inset = 24

  // Each corner is a wrapper with two divs (one horizontal, one vertical arm)
  const Corner = ({ vertical, horizontal, style }) => (
    <div
      aria-hidden
      className="pointer-events-none absolute"
      style={{ width: arm, height: arm, filter, ...style }}
    >
      <div
        className="absolute"
        style={{
          background: stroke,
          height: thickness,
          width: arm,
          borderRadius: thickness,
          [horizontal]: 0,
          [vertical]: 0,
        }}
      />
      <div
        className="absolute"
        style={{
          background: stroke,
          width: thickness,
          height: arm,
          borderRadius: thickness,
          [vertical]: 0,
          [horizontal]: 0,
        }}
      />
    </div>
  )

  return (
    <>
      <Corner vertical="top" horizontal="left" style={{ top: inset, left: inset }} />
      <Corner vertical="top" horizontal="right" style={{ top: inset, right: inset }} />
      <Corner vertical="bottom" horizontal="left" style={{ bottom: inset, left: inset }} />
      <Corner vertical="bottom" horizontal="right" style={{ bottom: inset, right: inset }} />
    </>
  )
}
