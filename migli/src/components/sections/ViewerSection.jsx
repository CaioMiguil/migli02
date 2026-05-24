import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { Expand } from 'lucide-react'
import { DEMO_PROPERTY } from '@lib/constants'
import { getDefaultScene } from '@lib/splatCatalog'
import { fadeUp, scaleIn } from '@lib/motion'
import SectionHeader from '@components/ui/SectionHeader'
import SplatViewer from '@components/viewer/SplatViewer'
import ViewerErrorBoundary from '@components/viewer/ViewerErrorBoundary'
import ViewerControls from '@components/viewer/ViewerControls'
import FloatingInfoCard from '@components/viewer/FloatingInfoCard'
import ImmersiveViewer from '@components/viewer/ImmersiveViewer'
import LogoWatermark from '@components/brand/LogoWatermark'

export default function ViewerSection() {
  const viewerRef = useRef(null)
  const containerRef = useRef(null)
  const [scene] = useState(getDefaultScene())
  const [immersive, setImmersive] = useState(false)

  return (
    <section id="viewer" className="bg-ink-800 px-6 pb-32 pt-24 md:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14">
          <SectionHeader
            eyebrow="EXPERIÊNCIA AO VIVO"
            title={
              <>
                Sinta o imóvel
                <br />
                antes de visitar.
              </>
            }
            sub="Tours fotorrealistas em Gaussian Splatting, renderizados em tempo real direto no navegador."
          />
        </div>

        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="overflow-hidden rounded-[28px] border border-glass-border bg-ink-800"
        >
          {/* 3D Canvas wrapper */}
          <div
            ref={containerRef}
            className="relative h-[420px] md:h-[540px]"
            style={{
              background:
                'radial-gradient(ellipse at 50% 30%, #0F2A4A 0%, #0A1628 70%)',
            }}
          >
            <ViewerErrorBoundary>
              <SplatViewer ref={viewerRef} scene={scene} />
            </ViewerErrorBoundary>

            {/* Top overlay UI */}
            <div className="pointer-events-none absolute inset-0 flex items-start justify-between p-5">
              <div className="glass-aqua rounded-xl px-4 py-3">
                <h3 className="font-display text-base font-bold">
                  {DEMO_PROPERTY.name}
                </h3>
                <p className="mt-0.5 text-xs text-white/45">
                  {DEMO_PROPERTY.status}
                </p>
              </div>
              <ViewerControls
                onReset={() => viewerRef.current?.resetCamera()}
                containerRef={containerRef}
              />
            </div>

            {/* Hint sutil para o usuário */}
            <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[10px] tracking-wider text-white/55 backdrop-blur-md">
              Arraste para explorar · Pinça ou rolagem para aproximar
            </div>

            {/* Floating annotations */}
            <FloatingInfoCard
              eyebrow="SALA DE ESTAR"
              title="42 m²"
              caption="Pé-direito alto"
              className="bottom-24 left-6"
              delay={0.3}
            />
            <FloatingInfoCard
              eyebrow="ILUMINAÇÃO"
              title={
                <span className="flex items-center gap-2 text-base font-medium">
                  <span className="inline-block h-2 w-2 animate-pulse-glow rounded-full bg-emerald-400" />
                  Natural · Alta
                </span>
              }
              className="bottom-24 right-24 hidden md:block"
              delay={0.5}
            />

            {/* Brand watermark */}
            <LogoWatermark position="bottom-right" size={20} opacity={0.4} />
          </div>

          {/* Bottom bar — property meta */}
          <motion.div
            variants={fadeUp}
            className="flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.04] px-6 py-5"
          >
            <div className="flex flex-wrap gap-2">
              {DEMO_PROPERTY.rooms.map((r) => (
                <div
                  key={r}
                  className="glass-aqua rounded-full px-4 py-2 text-sm font-medium text-aqua-300"
                >
                  {r}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setImmersive(true)}
                data-hover
                className="flex items-center gap-2 rounded-full border border-aqua-400/30 bg-aqua-400/10 px-4 py-2 text-sm font-medium text-aqua-300 transition-all hover:border-aqua-400 hover:bg-aqua-400/20 active:scale-95"
              >
                <Expand size={14} strokeWidth={1.8} />
                Modo imersivo
              </button>
              <div className="font-display text-2xl md:text-3xl font-bold gradient-text">
                {DEMO_PROPERTY.price}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Modo imersivo — fullscreen takeover */}
      <ImmersiveViewer
        open={immersive}
        scene={scene}
        propertyMeta={DEMO_PROPERTY}
        onClose={() => setImmersive(false)}
      />
    </section>
  )
}
