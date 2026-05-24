/**
 * Aqua pulse badge — used in hero and CTA sections.
 */
export default function Badge({ children, className = '' }) {
  return (
    <div
      className={`inline-flex items-center gap-2 glass-aqua rounded-full px-4 py-2 text-[11px] font-medium tracking-widest2 text-aqua-300 ${className}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-pulse-glow rounded-full bg-aqua-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-aqua-400" />
      </span>
      {children}
    </div>
  )
}
