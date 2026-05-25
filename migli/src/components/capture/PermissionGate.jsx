import { motion } from 'framer-motion'
import { Camera, ShieldCheck, Smartphone } from 'lucide-react'
import { CameraPermission } from '@lib/capture/cameraEngine'
import { CAPTURE_COPY } from '@lib/constants'
import { LogoMark } from '@components/brand/Logo'
import Button from '@components/ui/Button'

/**
 * Tela de permissão de câmera — exibida até o usuário liberar acesso.
 * Três estados: prompt | denied | unavailable.
 */
export default function PermissionGate({ permission, onRequest, error }) {
  if (permission === CameraPermission.GRANTED) return null

  const isDenied = permission === CameraPermission.DENIED
  const isUnavailable = permission === CameraPermission.UNAVAILABLE

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute inset-0 z-30 flex items-center justify-center bg-ink-950/95 px-6 backdrop-blur-xl"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md text-center"
      >
        <div className="mb-6 flex justify-center">
          <LogoMark size={56} animated />
        </div>

        <h2 className="font-display text-3xl font-bold leading-tight">
          {isUnavailable
            ? 'Câmera indisponível'
            : isDenied
              ? 'Acesso necessário'
              : CAPTURE_COPY.permissionTitle}
        </h2>

        <p className="mx-auto mt-4 max-w-sm text-sm font-light leading-relaxed text-white/55">
          {isUnavailable
            ? CAPTURE_COPY.permissionUnavailable
            : isDenied
              ? CAPTURE_COPY.permissionDenied
              : CAPTURE_COPY.permissionBody}
        </p>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-xs text-red-200/80">
            {error.message}
          </div>
        )}

        {!isUnavailable && !isDenied && (
          <>
            <div className="mt-8">
              <Button variant="primary" size="lg" onClick={onRequest}>
                <Camera size={16} className="mr-2 inline" />
                {CAPTURE_COPY.cta}
              </Button>
            </div>

            <div className="mx-auto mt-10 grid max-w-sm grid-cols-2 gap-4 text-left">
              <Reassure
                icon={ShieldCheck}
                title={CAPTURE_COPY.privacyTitle}
                text={CAPTURE_COPY.privacyText}
              />
              <Reassure
                icon={Smartphone}
                title={CAPTURE_COPY.mobileTitle}
                text={CAPTURE_COPY.mobileText}
              />
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

function Reassure({ icon: Icon, title, text }) {
  return (
    <div className="glass rounded-2xl p-4">
      <Icon size={18} className="mb-2 text-aqua-300" strokeWidth={1.5} />
      <div className="text-xs font-semibold text-white/85">{title}</div>
      <div className="mt-1 text-[11px] font-light leading-relaxed text-white/45">
        {text}
      </div>
    </div>
  )
}
