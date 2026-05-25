import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Camera,
  ArrowRight,
  Sparkles,
  Smartphone,
  Share2,
  Zap,
  Eye,
  Map,
  Building2,
} from 'lucide-react'
import AppHeader from '@components/shell/AppHeader'
import { LogoMark } from '@components/brand/Logo'
import ParticleGalaxy from '@components/ui/ParticleGalaxy'
import ParticleMesh from '@components/ui/ParticleMesh'
import AtmosphericOrbs from '@components/ui/AtmosphericOrbs'
import { listMyProperties } from '@lib/cloud/propertyService'
import { subscribeLocalProperties } from '@lib/cloud/localStore'

/**
 * HomeTab — a Home como produto, não como landing.
 *
 * Estrutura:
 *   1. Hero galáctico — galaxy particles + título + CTA scan
 *   2. Missão — manifesto sobre revolucionar imóveis no Brasil
 *   3. Continue de onde parou — últimos scans (se existem)
 *   4. Três pilares (Capturar/Reconstruir/Compartilhar)
 *   5. Números — métricas de impacto
 *   6. Closing CTA — convite imersivo final
 */
export default function HomeTab({ onScan, onSeeDemo, onOpenProperty }) {
  const [recents, setRecents] = useState([])

  useEffect(() => {
    let mounted = true
    const load = () =>
      listMyProperties().then((r) => mounted && setRecents(r.slice(0, 3)))
    load()
    const unsub = subscribeLocalProperties(load)
    return () => {
      mounted = false
      unsub()
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-cosmic pb-8">
      {/* Background atmospheric layers */}
      <AtmosphericOrbs />

      <AppHeader transparent>
        <div className="px-5 pb-2 md:px-8">
          <div className="eyebrow">MIGLI · IMÓVEIS EM OUTRA DIMENSÃO</div>
        </div>
      </AppHeader>

      {/* ════════════ HERO GALÁCTICO ════════════ */}
      <section className="relative px-5 pt-4 pb-16 md:px-8">
        {/* Galaxy canvas */}
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <ParticleGalaxy density={0.85} rotation={4} />
        </div>

        <div className="relative z-10 mx-auto max-w-md pt-8 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 flex justify-center"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
              style={{
                filter: 'drop-shadow(0 0 40px rgba(0, 194, 255, 0.55))',
              }}
            >
              <LogoMark size={72} animated />
            </motion.div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-[clamp(40px,10vw,64px)] font-extrabold leading-[0.95] tracking-tightest"
          >
            <span className="block text-white">O imóvel vai</span>
            <span className="block gradient-text-ocean">até o cliente.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mt-6 max-w-sm text-[15px] font-light leading-relaxed2 text-white/65"
          >
            Escaneie qualquer espaço com o celular. A MIGLI cria um tour 3D
            cinematográfico em minutos. Compartilhe num link.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="mt-9 flex flex-col items-center gap-3"
          >
            <button
              onClick={onScan}
              data-hover
              className="group flex items-center gap-2.5 rounded-full px-7 py-4 font-display text-base font-semibold tracking-tight text-white transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #00C2FF 0%, #0E8AC4 100%)',
                boxShadow:
                  '0 20px 60px rgba(0, 194, 255, 0.42), 0 0 0 1px rgba(0,194,255,0.3)',
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
              className="flex items-center gap-1.5 text-[12px] font-medium text-aqua-300/80 transition-colors hover:text-aqua-200"
            >
              <Eye size={12} />
              Ver tour de demonstração
            </button>
          </motion.div>
        </div>
      </section>

      {/* ════════════ MANIFESTO ════════════ */}
      <section className="relative px-5 py-16 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-md text-center"
        >
          <div className="eyebrow mb-4">MISSÃO MIGLI</div>
          <h2 className="font-display text-[clamp(26px,7vw,38px)] font-extrabold leading-[1.05] tracking-tightest text-white">
            Vamos revolucionar
            <br />
            <span className="gradient-text-aqua">o ramo imobiliário</span>
            <br />
            <span className="text-white/70">no Brasil.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-sm text-[14px] font-light leading-relaxed2 text-white/60">
            Cansamos de imóveis fotografados em quatro cliques. De visitas
            agendadas que nunca acontecem. De clientes que se perdem entre
            stories e listagens genéricas.
          </p>
          <p className="mx-auto mt-3 max-w-sm text-[14px] font-light leading-relaxed2 text-white/60">
            A MIGLI transforma o celular do corretor em uma máquina de
            captura espacial. Cada imóvel vira uma experiência imersiva.
            Cada link vira uma visita virtual em alta fidelidade.
          </p>
          <p className="mx-auto mt-5 max-w-sm text-[14px] font-semibold leading-relaxed2 text-aqua-300">
            O futuro do mercado imobiliário cabe no seu bolso.
          </p>
        </motion.div>
      </section>

      {/* ════════════ CONTINUE — recents ════════════ */}
      {recents.length > 0 && (
        <section className="relative px-5 py-8 md:px-8">
          <div className="mb-4 flex items-baseline justify-between">
            <div className="eyebrow">CONTINUE DE ONDE PAROU</div>
            <span className="text-[10px] text-white/40">
              {recents.length} {recents.length === 1 ? 'imóvel' : 'imóveis'}
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {recents.map((p) => (
              <RecentCard
                key={p.id}
                property={p}
                onClick={() => onOpenProperty?.(p)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ════════════ PILARES ════════════ */}
      <section className="relative px-5 py-16 md:px-8">
        <div className="mb-9 text-center">
          <div className="eyebrow mb-3">COMO FUNCIONA</div>
          <h2 className="font-display text-2xl font-extrabold tracking-tighter text-white">
            Três passos. Zero atrito.
          </h2>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, i) => (
            <StepCard key={step.title} step={step} index={i} />
          ))}
        </div>
      </section>

      {/* ════════════ NÚMEROS DE IMPACTO ════════════ */}
      <section className="relative px-5 py-12 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="card relative overflow-hidden p-7"
        >
          {/* Wave mesh no fundo */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-50">
            <ParticleMesh variant="wave" intensity={0.7} />
          </div>

          <div className="relative">
            <div className="eyebrow mb-3">POR QUE MIGLI</div>
            <h3 className="font-display text-xl font-bold tracking-tight text-white">
              Imóveis com tour 3D vendem
              <br />
              <span className="gradient-text-aqua">três vezes mais rápido</span>
            </h3>
            <p className="mt-3 text-[13px] leading-relaxed text-white/65">
              Corretores que mostram em 3D agendam menos visitas físicas
              improdutivas e fecham com clientes mais qualificados. Você foca
              em vender. A IA cuida do resto.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/8 pt-5">
              <Metric value="3×" label="Mais visitas" />
              <Metric value="50%" label="Menos tempo" />
              <Metric value="24h" label="Pronto em" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* ════════════ CLOSING CTA ════════════ */}
      <section className="relative px-5 pb-16 md:px-8">
        <motion.button
          onClick={onScan}
          data-hover
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="group relative w-full overflow-hidden rounded-3xl p-8 text-left"
          style={{
            background:
              'linear-gradient(135deg, rgba(11,30,47,0.92) 0%, rgba(14,138,196,0.4) 100%)',
            border: '1px solid rgba(0,194,255,0.3)',
            boxShadow: '0 24px 60px rgba(0, 194, 255, 0.25)',
          }}
        >
          <div className="pointer-events-none absolute -top-12 right-0 h-48 w-48 opacity-70">
            <ParticleMesh variant="helix" intensity={0.8} />
          </div>

          <div className="relative">
            <div className="flex items-center gap-2">
              <Sparkles size={14} strokeWidth={2.2} className="text-aqua-300" />
              <span className="text-[10px] font-semibold uppercase tracking-widest3 text-aqua-200">
                COMECE GRÁTIS
              </span>
            </div>
            <h3 className="mt-3 max-w-[18ch] font-display text-2xl font-extrabold leading-[1.05] tracking-tightest text-white">
              Seu primeiro imóvel imersivo está a um toque.
            </h3>
            <p className="mt-3 max-w-sm text-[13px] font-light text-white/65">
              Sem cartão. Sem download. Sem complicação. Abra a câmera e
              comece a revolução.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-aqua-400 px-5 py-2.5 text-[12px] font-semibold text-ink-950 shadow-aqua">
              <Camera size={13} strokeWidth={2.4} />
              Escanear meu primeiro
              <ArrowRight
                size={12}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </div>
        </motion.button>
      </section>
    </div>
  )
}

function RecentCard({ property, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative h-32 w-44 flex-shrink-0 snap-start overflow-hidden rounded-2xl border border-white/8 text-left transition-all hover:border-aqua-400/40"
      style={{ background: 'linear-gradient(135deg, #0A1E2F, #103D5A)' }}
    >
      {property.thumb_url ? (
        // eslint-disable-next-line jsx-a11y/img-redundant-alt
        <img
          src={property.thumb_url}
          alt={property.name}
          className="h-full w-full object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full items-center justify-center">
          <Building2 size={28} strokeWidth={1.4} className="text-aqua-400/50" />
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
        <div className="truncate text-[11px] font-bold text-white">{property.name}</div>
        <div className="mt-0.5 truncate text-[9px] text-aqua-300">
          {property.status === 'published' && 'Pronto · toque para abrir'}
          {property.status === 'processing' && 'Aguardando reconstrução'}
          {property.status === 'uploading' && 'Enviando…'}
          {property.status === 'draft' && 'Rascunho'}
        </div>
      </div>
    </button>
  )
}

function StepCard({ step, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: index * 0.08 }}
      className="card flex items-start gap-4 p-5"
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-aqua-400/30 bg-aqua-400/10">
        <step.Icon size={20} strokeWidth={1.8} className="text-aqua-300" />
      </div>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] font-semibold tracking-wider text-aqua-400/70">
            0{index + 1}
          </span>
          <h3 className="font-display text-[15px] font-bold tracking-tight text-white">
            {step.title}
          </h3>
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-white/60">
          {step.body}
        </p>
      </div>
    </motion.div>
  )
}

function Metric({ value, label }) {
  return (
    <div className="text-center">
      <div className="font-display text-2xl font-extrabold tracking-tighter gradient-text-aqua">
        {value}
      </div>
      <div className="mt-1 text-[10px] font-medium tracking-tight text-white/50">
        {label}
      </div>
    </div>
  )
}

const STEPS = [
  {
    title: 'Caminhe e escaneie',
    body: 'Aponte a câmera, ande devagar. A IA da MIGLI captura cada parede, cada detalhe.',
    Icon: Smartphone,
  },
  {
    title: 'A IA reconstrói em 3D',
    body: 'Nossa engine gera um tour imersivo em poucos minutos. Sem PC, sem software, sem dor de cabeça.',
    Icon: Zap,
  },
  {
    title: 'Compartilhe o tour',
    body: 'Cada imóvel ganha um link premium. O cliente abre, explora, se apaixona. Antes mesmo da visita.',
    Icon: Share2,
  },
]
