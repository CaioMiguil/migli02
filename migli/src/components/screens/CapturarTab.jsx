import { motion } from 'framer-motion'
import { Camera, ArrowRight, Lightbulb, Move, Hand } from 'lucide-react'
import AppHeader from '@components/shell/AppHeader'
import ParticleMesh from '@components/ui/ParticleMesh'
import AtmosphericOrbs from '@components/ui/AtmosphericOrbs'

export default function CapturarTab({ onScan }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-cosmic pb-12">
      <AtmosphericOrbs density={0.7} />
      <AppHeader title="Escanear imóvel" />

      <section className="relative px-5 pt-6 md:px-8">
        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-3xl p-8 text-center"
          style={{
            background:
              'linear-gradient(160deg, rgba(11,30,47,0.85) 0%, rgba(14,138,196,0.25) 100%)',
            border: '1px solid rgba(0, 194, 255, 0.18)',
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 60px rgba(0,194,255,0.12) inset',
          }}
        >
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <ParticleMesh variant="wave" intensity={0.7} />
          </div>

          <div className="relative">
            <motion.div
              className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl"
              style={{
                background: 'rgba(0, 194, 255, 0.15)',
                border: '1px solid rgba(0, 194, 255, 0.4)',
                boxShadow: '0 0 32px rgba(0,194,255,0.35)',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
            >
              <Camera size={28} strokeWidth={1.7} className="text-aqua-300" />
            </motion.div>
            <h2 className="font-display text-2xl font-extrabold tracking-tighter text-white">
              Tudo pronto para começar?
            </h2>
            <p className="mt-3 text-[14px] font-light leading-relaxed text-white/65">
              Use seu celular como uma varinha mágica. Caminhe pelo cômodo, a
              MIGLI cuida do resto.
            </p>

            <button
              onClick={onScan}
              data-hover
              className="group mt-7 inline-flex items-center gap-2.5 rounded-full px-8 py-4 font-display text-base font-semibold tracking-tight text-white transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #00C2FF 0%, #0E8AC4 100%)',
                boxShadow: '0 18px 50px rgba(0, 194, 255, 0.42)',
              }}
            >
              <Camera size={18} strokeWidth={2.2} />
              Iniciar scan
              <ArrowRight
                size={16}
                strokeWidth={2.4}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
          </div>
        </motion.div>

        {/* Tips */}
        <div className="mt-10">
          <div className="eyebrow mb-4 px-1">DICAS PARA UMA CAPTURA PERFEITA</div>
          <div className="space-y-3">
            {TIPS.map((tip, i) => (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.15 + i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="card flex items-start gap-3 p-4"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-aqua-400/30 bg-aqua-400/10">
                  <tip.Icon size={18} strokeWidth={1.8} className="text-aqua-300" />
                </div>
                <div>
                  <div className="font-display text-[14px] font-semibold tracking-tight text-white">
                    {tip.title}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-white/55">
                    {tip.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-aqua-400/20 bg-aqua-400/8 p-4">
          <div className="flex items-start gap-2.5">
            <Lightbulb
              size={14}
              strokeWidth={2}
              className="mt-0.5 flex-shrink-0 text-aqua-300"
            />
            <div className="text-[12px] leading-relaxed text-aqua-100">
              <strong className="font-semibold">Dica do dev:</strong> O scan
              funciona melhor em iPhone moderno ou Android recente. Em PCs sem
              câmera traseira, use o modo demo.
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

const TIPS = [
  {
    Icon: Move,
    title: 'Caminhe devagar',
    body: 'Movimentos lentos e contínuos geram melhor reconstrução. Pense em "vagar pelo imóvel".',
  },
  {
    Icon: Hand,
    title: 'Segure firme com as duas mãos',
    body: 'Evita tremidas. Ombros relaxados, cotovelos próximos ao corpo.',
  },
  {
    Icon: Lightbulb,
    title: 'Ilumine bem o ambiente',
    body: 'Abra cortinas, acenda luzes. Cantos escuros geram artefatos no tour.',
  },
]
