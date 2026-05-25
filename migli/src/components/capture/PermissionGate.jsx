import { motion } from 'framer-motion'
import { Camera, X, AlertCircle, RefreshCw } from 'lucide-react'
import { CameraPermission } from '@lib/capture/cameraEngine'
import { CAPTURE_COPY } from '@lib/constants'
import { LogoMark } from '@components/brand/Logo'

/**
 * Tela de permissão de câmera.
 *
 * Estados:
 *   PROMPT      — pedindo acesso
 *   DENIED      — usuário bloqueou; mostra passos pra reverter
 *   UNAVAILABLE — navegador não suporta MediaDevices
 *
 * Aceita tanto `onRetry` quanto `onRequest` (backwards-compat).
 */
export default function PermissionGate({
  permission,
  onRetry,
  onRequest,
  onClose,
  error,
}) {
  if (permission === CameraPermission.GRANTED) return null

  const isDenied = permission === CameraPermission.DENIED
  const isUnavailable = permission === CameraPermission.UNAVAILABLE
  const handle = onRetry || onRequest

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-40 flex items-center justify-center bg-ink-950/95 px-6 py-8 backdrop-blur-xl"
    >
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Sair"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/60 text-white/85 backdrop-blur-md"
          style={{ top: 'max(env(safe-area-inset-top, 0px), 12px)' }}
        >
          <X size={18} strokeWidth={1.6} />
        </button>
      )}

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm text-center"
      >
        <div className="mb-6 flex justify-center">
          <LogoMark size={48} animated />
        </div>

        {/* Ícone do estado */}
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-aqua-400/12 border border-aqua-400/30">
          {isDenied || isUnavailable ? (
            <AlertCircle size={22} className="text-amber-300" strokeWidth={1.7} />
          ) : (
            <Camera size={22} className="text-aqua-300" strokeWidth={1.7} />
          )}
        </div>

        <h2 className="font-display text-2xl font-extrabold tracking-tighter text-white">
          {isUnavailable
            ? 'Câmera indisponível'
            : isDenied
              ? 'Acesso bloqueado'
              : CAPTURE_COPY.permissionTitle}
        </h2>

        <p className="mx-auto mt-3 max-w-xs text-sm font-light leading-relaxed text-white/65">
          {isUnavailable
            ? CAPTURE_COPY.permissionUnavailable
            : isDenied
              ? CAPTURE_COPY.permissionDenied
              : CAPTURE_COPY.permissionBody}
        </p>

        {/* Passos quando negado */}
        {isDenied && (
          <ol className="mx-auto mt-6 max-w-xs space-y-3 text-left">
            {CAPTURE_COPY.permissionDeniedSteps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5"
              >
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-aqua-400/15 text-[11px] font-bold text-aqua-300">
                  {i + 1}
                </span>
                <span className="text-[12px] leading-relaxed text-white/75">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
            {String(error.message || error)}
          </div>
        )}

        {!isUnavailable && handle && (
          <button
            onClick={handle}
            data-hover
            className="mt-7 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-display text-[13px] font-semibold tracking-tight text-ink-950 transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #00C2FF 0%, #3FA8DA 100%)',
              boxShadow: '0 14px 40px rgba(0, 194, 255, 0.32)',
            }}
          >
            {isDenied ? (
              <>
                <RefreshCw size={14} strokeWidth={2.2} />
                {CAPTURE_COPY.ctaRetry}
              </>
            ) : (
              <>
                <Camera size={14} strokeWidth={2.2} />
                {CAPTURE_COPY.cta}
              </>
            )}
          </button>
        )}
      </motion.div>
    </motion.div>
  )
}
