import { motion } from 'framer-motion'
import { Camera, ArrowRight, Lightbulb, Move, Hand } from 'lucide-react'
import AppHeader from '@components/shell/AppHeader'

/**
 * CapturarTab — tela que apresenta o scan e o dispara em fullscreen.
 *
 * Não abre câmera direto: mostra dicas rápidas + botão grande "Começar
 * scan". Quando o usuário clica, o ScanScreen (já existente) abre por
 * cima do app shell como overlay.
 */
export default function CapturarTab({ onScan }) {
  return (
    <div className="min-h-screen">
      <AppHeader title="Escanear imóvel" />

      <section className="px-5 pt-8 pb-12 md:px-8">
        {/* Hero card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="card relative overflow-hidden p-8 text-center"
          style={{
            background:
              'linear-gradient(160deg, #FFFFFF 0%, #EFF8FD 100%)',
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2"
            style={{
              background:
                'radial-gradient(ellipse, rgba(14,138,196,0.18), transparent 70%)',
              filter: 'blur(20px)',
            }}
          />

          <div className="relative">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-ocean-100">
              <Camera size={28} strokeWidth={1.7} className="text-ocean-600" />
            </div>
            <h2 className="font-display text-2xl font-extrabold tracking-tighter text-ink-900">
              Pronto para escanear?
            </h2>
            <p className="mt-3 text-[14px] font-light leading-relaxed text-ink-700">
              Use o celular como uma varinha mágica. A IA cuida do resto.
            </p>

            <button
              onClick={onScan}
              data-hover
              className="group mt-7 inline-flex items-center gap-2.5 rounded-full px-8 py-4 font-display text-base font-semibold tracking-tight text-white transition-all active:scale-95"
              style={{
                background:
                  'linear-gradient(135deg, #0E8AC4 0%, #0871A6 100%)',
                boxShadow: '0 14px 40px rgba(14, 138, 196, 0.32)',
              }}
            >
              <Camera size={18} strokeWidth={2.2} />
              Começar scan
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
          <div className="eyebrow mb-4 px-1">DICAS RÁPIDAS</div>
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
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-ocean-100">
                  <tip.Icon
                    size={18}
                    strokeWidth={1.8}
                    className="text-ocean-600"
                  />
                </div>
                <div>
                  <div className="font-display text-[14px] font-semibold tracking-tight text-ink-900">
                    {tip.title}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-ink-600">
                    {tip.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Compatibility note */}
        <div className="mt-8 rounded-2xl border border-ocean-100 bg-ocean-50 p-4">
          <div className="flex items-start gap-2.5">
            <Lightbulb
              size={14}
              strokeWidth={2}
              className="mt-0.5 flex-shrink-0 text-ocean-600"
            />
            <div className="text-[12px] leading-relaxed text-ocean-800">
              <strong className="font-semibold">Dica:</strong> Para a melhor
              experiência, use seu iPhone ou Android moderno na orientação
              horizontal.
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
