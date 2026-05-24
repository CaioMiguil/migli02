import { motion } from 'framer-motion'
import { Smartphone, Sparkles, Cloud } from 'lucide-react'
import { useState } from 'react'
import { scaleIn } from '@lib/motion'
import SectionHeader from '@components/ui/SectionHeader'
import UploadDropzone from '@components/upload/UploadDropzone'
import CaptureScreen from '@components/capture/CaptureScreen'

/**
 * UploadSection — the marketing-page funnel into the real capture & upload flow.
 *
 * The actual queue state lives in the global UploadPanel (mounted at App
 * level), so this section is intentionally about the moment of intent:
 * dropping files or opening the camera. Once enqueued, the floating panel
 * takes over.
 */
export default function UploadSection() {
  const [captureOpen, setCaptureOpen] = useState(false)

  return (
    <section id="upload" className="bg-ink-800 px-6 pb-32 pt-24 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14">
          <SectionHeader
            eyebrow="COMECE EM SEGUNDOS"
            title={
              <>
                Capture, envie,
                <br />
                impressione.
              </>
            }
            sub="Grave com o celular, arraste vídeos ou solte arquivos de scan. A nossa IA cuida do resto."
          />
        </div>

        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
        >
          <UploadDropzone onOpenCapture={() => setCaptureOpen(true)} />
        </motion.div>

        {/* Pipeline preview — shows what happens after the user drops a file */}
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <PipelineStep
            number="01"
            icon={Smartphone}
            title="Captura"
            text="Grave um vídeo lento do imóvel ou faça upload dos arquivos."
          />
          <PipelineStep
            number="02"
            icon={Cloud}
            title="Reconstrução"
            text="Nossa IA extrai poses, gera o splat e otimiza a geometria."
          />
          <PipelineStep
            number="03"
            icon={Sparkles}
            title="Publicação"
            text="Link imersivo pronto para compartilhar com seus clientes."
          />
        </div>
      </div>

      {/* The actual capture surface — full-screen overlay */}
      <CaptureScreen open={captureOpen} onClose={() => setCaptureOpen(false)} />
    </section>
  )
}

function PipelineStep({ number, icon: Icon, title, text }) {
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl glass-aqua">
          <Icon size={16} className="text-aqua-300" strokeWidth={1.6} />
        </div>
        <div className="font-mono text-[10px] tracking-widest2 text-aqua-300/70">
          {number}
        </div>
      </div>
      <div className="mt-3 font-display text-base font-bold">{title}</div>
      <div className="mt-1 text-xs font-light leading-relaxed text-white/50">
        {text}
      </div>
    </div>
  )
}
