/**
 * Cinematic atmospheric blur orbs. Pure CSS, no JS — cheap to render.
 * Place inside a `relative` container.
 */
export default function BackgroundOrbs({ density = 'normal' }) {
  return (
    <>
      <div
        className="bg-orb animate-orb-float"
        style={{
          width: 500,
          height: 500,
          background: 'rgba(0, 194, 255, 0.09)',
          top: -100,
          right: -120,
          animationDelay: '0s',
        }}
      />
      <div
        className="bg-orb animate-orb-float"
        style={{
          width: 420,
          height: 420,
          background: 'rgba(56, 189, 248, 0.07)',
          bottom: 80,
          left: -160,
          animationDelay: '-3s',
        }}
      />
      {density === 'normal' && (
        <div
          className="bg-orb animate-orb-float"
          style={{
            width: 320,
            height: 320,
            background: 'rgba(125, 211, 252, 0.05)',
            top: '30%',
            left: '32%',
            animationDelay: '-6s',
          }}
        />
      )}
    </>
  )
}
