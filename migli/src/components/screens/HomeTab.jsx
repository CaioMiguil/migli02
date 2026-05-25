import { motion } from 'framer-motion'
import { Camera, ArrowRight, Sparkles, Smartphone, Share2, Zap } from 'lucide-react'
import AppHeader from '@components/shell/AppHeader'
import { LogoMark } from '@components/brand/Logo'

/**
 * HomeTab — primeira tab do app shell.
 *
 * Substitui a antiga landing. Mantém a essência (hero imersivo, recursos
 * principais, CTA forte) mas reformatada como tela mobile-first:
 *   - Sem nav top, só AppHeader simples
 *   - Bloco principal: marca + título + scan CTA
 *   - "Como funciona" em 3 passos
 *   - Card de demonstração que leva à biblioteca
 *
 * Tom: limpo, claro, premium. Não é mais landing de marketing pesada.
 */
export default function HomeTab({ onScan, onSeeDemo }) {
  return (
    <div className="bg-wave min-h-screen">
      <AppHeader transparent>
        <div className="px-4 pb-3 md:px-6">
          <div className="eyebrow">IMÓVEIS COM IA · BRASIL</div>
        </div>
      </AppHeader>

      {/* Hero */}
      <section className="relative px-5 pt-2 pb-12 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="mb-7 flex justify-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
            >
              <LogoMark size={68} animated />
            </motion.div>
          </div>

          <h1 className="font-display text-[clamp(34px,9vw,52px)] font-extrabold leading-[0.98] tracking-tightest text-ink-900">
            Escaneie qualquer imóvel
            <span className="block gradient-text-ocean">em minutos.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-[15px] font-light leading-relaxed2 text-ink-700">
            Use o celular para capturar. Receba um tour 3D imersivo. Envie
            por link.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <button
              onClick={onScan}
              data-hover
              className="group flex items-center gap-2.5 rounded-full px-7 py-4 font-display text-base font-semibold tracking-tight text-white transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #0E8AC4 0%, #0871A6 100%)',
                boxShadow: '0 14px 40px rgba(14, 138, 196, 0.32)',
              }}
            >
              <Camera size={18} strokeWidth={2.2} />
              Escanear agora
              <ArrowRight
                size={16}
                strokeWidth={2.4}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </button>
            <button
              onClick={onSeeDemo}
              className="text-[12px] font-medium text-ink-500 transition-colors hover:text-ocean-600"
            >
              Ver demonstração de tour
            </button>
          </div>
        </motion.div>
      </section>

      {/* Como funciona */}
      <section className="px-5 py-12 md:px-8">
        <div className="mb-7 text-center">
          <div className="eyebrow mb-2">COMO FUNCIONA</div>
          <h2 className="font-display text-2xl font-bold tracking-tighter text-ink-900">
            Três passos. Sem complicação.
          </h2>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <StepCard key={step.title} step={step} index={i} />
          ))}
        </div>
      </section>

      {/* Why MIGLI */}
      <section className="px-5 py-12 md:px-8">
        <div className="card overflow-hidden p-6">
          <div className="eyebrow mb-2">A DIFERENÇA MIGLI</div>
          <h3 className="font-display text-xl font-bold tracking-tight text-ink-900">
            Imóveis vendem 3× mais rápido com tours imersivos
          </h3>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-600">
            Corretores que mostram imóveis em 3D agendam mais visitas
            qualificadas e fecham negócios em menos tempo. Você foca em
            vender. A IA cuida do resto.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-paper-200 pt-5">
            <Metric value="3×" label="Mais visitas" />
            <Metric value="50%" label="Menos tempo" />
            <Metric value="24h" label="Pronto em" />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-5 pb-12 md:px-8">
        <button
          onClick={onScan}
          data-hover
          className="group w-full overflow-hidden rounded-3xl p-8 text-left transition-all active:scale-[0.99]"
          style={{
            background: 'linear-gradient(135deg, #0A5C83 0%, #0E8AC4 100%)',
            boxShadow: '0 14px 40px rgba(14, 138, 196, 0.32)',
          }}
        >
          <div className="flex items-center gap-3">
            <Sparkles size={18} strokeWidth={2} className="text-aqua-200" />
            <span className="text-[11px] font-semibold uppercase tracking-widest3 text-aqua-200">
              COMECE GRÁTIS
            </span>
          </div>
          <h3 className="mt-3 font-display text-2xl font-extrabold tracking-tighter text-white">
            Escaneie seu primeiro imóvel agora
          </h3>
          <p className="mt-2 text-[13px] font-light text-white/75">
            Sem cartão. Sem download. Funciona pelo navegador.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold text-white">
            Começar
            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </div>
        </button>
      </section>
    </div>
  )
}

function StepCard({ step, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.06 }}
      className="card flex items-start gap-4 p-5"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-ocean-100">
        <step.Icon size={20} strokeWidth={1.8} className="text-ocean-600" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] font-semibold tracking-wider text-ocean-500">
            0{index + 1}
          </span>
          <h3 className="font-display text-[15px] font-bold tracking-tight text-ink-900">
            {step.title}
          </h3>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-600">
          {step.body}
        </p>
      </div>
    </motion.div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="text-center">
      <div className="font-display text-2xl font-extrabold tracking-tighter gradient-text-ocean">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-medium tracking-tight text-ink-500">
        {label}
      </div>
    </div>
  )
}

const STEPS = [
  {
    title: 'Escaneie com o celular',
    body: 'Caminhe pelo imóvel filmando devagar. A IA captura tudo automaticamente.',
    Icon: Smartphone,
  },
  {
    title: 'Reconstrução automática',
    body: 'Nossa IA cuida da reconstrução 3D em minutos. Você não precisa fazer nada.',
    Icon: Zap,
  },
  {
    title: 'Compartilhe o tour',
    body: 'Cada imóvel ganha um link premium. Cliente abre, explora, se apaixona.',
    Icon: Share2,
  },
]
