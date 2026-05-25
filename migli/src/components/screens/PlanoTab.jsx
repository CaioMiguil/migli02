import { motion } from 'framer-motion'
import { Check, Crown, Sparkles } from 'lucide-react'
import AppHeader from '@components/shell/AppHeader'
import { LogoMark } from '@components/brand/Logo'
import AtmosphericOrbs from '@components/ui/AtmosphericOrbs'
import ParticleMesh from '@components/ui/ParticleMesh'

const BENEFITS = [
  { title: 'Scans ilimitados', detail: 'Quantos imóveis quiser, sem limite' },
  { title: 'Tours imersivos 3D', detail: 'Reconstrução automática com IA' },
  { title: 'Links premium', detail: 'Compartilhe num link bonito' },
  { title: 'Domínio personalizado', detail: 'imóveis.suacorretora.com.br' },
  { title: 'Hospedagem incluída', detail: 'Cloud rápida, CDN global' },
  { title: 'Insights por imóvel', detail: 'Veja como cada lead navegou' },
  { title: 'Atualizações grátis', detail: 'Sempre na versão mais nova' },
  { title: 'Suporte humano', detail: 'Time brasileiro, fala português' },
]

export default function PlanoTab({ onSubscribe }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-cosmic pb-12">
      <AtmosphericOrbs density={0.7} />
      <AppHeader title="Plano" />

      <section className="relative px-5 pt-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="eyebrow mb-3">UM PLANO. SIMPLES ASSIM.</div>
          <h2 className="font-display text-[clamp(28px,8vw,40px)] font-extrabold leading-[1.05] tracking-tightest text-white">
            Tudo o que você precisa
            <br />
            <span className="gradient-text-aqua">por R$ 99/mês.</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative mt-9 overflow-hidden rounded-3xl"
          style={{
            background:
              'linear-gradient(160deg, rgba(11,30,47,0.95) 0%, rgba(14,138,196,0.25) 100%)',
            border: '1px solid rgba(0, 194, 255, 0.3)',
            boxShadow:
              '0 28px 64px rgba(0, 194, 255, 0.25), 0 4px 16px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, transparent, #00C2FF, transparent)',
            }}
          />
          <div className="pointer-events-none absolute -bottom-12 -right-12 h-48 w-48 opacity-40">
            <ParticleMesh variant="helix" intensity={0.7} />
          </div>

          <div className="relative p-7 md:p-9">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{
                    background: 'linear-gradient(135deg, #00C2FF, #0E8AC4)',
                    boxShadow: '0 8px 20px rgba(0,194,255,0.35)',
                  }}
                >
                  <LogoMark size={22} />
                </div>
                <div>
                  <div className="font-display text-base font-bold tracking-tight text-white">
                    Migli Pro
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest3 text-aqua-300">
                    ACESSO COMPLETO
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-aqua-400/15 border border-aqua-400/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest2 text-aqua-200">
                <Crown size={10} strokeWidth={2.4} />
                Recomendado
              </div>
            </div>

            <div className="mt-7 flex items-baseline gap-1">
              <span className="font-display text-base font-light text-white/55">R$</span>
              <span className="font-display text-6xl font-extrabold leading-none tracking-tightest text-white">
                99
              </span>
              <span className="font-display text-base font-light text-white/55">/mês</span>
            </div>
            <p className="mt-2 text-[13px] font-light text-white/70">
              Tudo o que você precisa para transformar imóveis em experiências.
            </p>

            <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-aqua-400/20 border border-aqua-400/40">
                    <Check size={11} strokeWidth={3} className="text-aqua-300" />
                  </div>
                  <div>
                    <div className="font-display text-[12px] font-semibold tracking-tight text-white">
                      {b.title}
                    </div>
                    <div className="text-[11px] text-white/50">{b.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={onSubscribe}
              data-hover
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-display text-[14px] font-semibold tracking-tight text-white transition-all active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #00C2FF 0%, #0E8AC4 100%)',
                boxShadow: '0 18px 50px rgba(0, 194, 255, 0.42)',
              }}
            >
              <Sparkles size={14} strokeWidth={2.2} />
              Assinar agora
            </button>

            <div className="mt-4 text-center text-[11px] text-white/50">
              7 dias grátis · Cancela quando quiser · Sem multa
            </div>
          </div>
        </motion.div>

        <div className="mt-12">
          <div className="eyebrow mb-4 px-1">DÚVIDAS FREQUENTES</div>
          <div className="space-y-3">
            <FAQ
              q="Posso cancelar quando quiser?"
              a="Sim. Cancele direto pelo app, sem ligação, sem burocracia. Você mantém acesso até o fim do período pago."
            />
            <FAQ
              q="Quantos imóveis posso escanear?"
              a="Ilimitado. Escaneie quantos imóveis quiser dentro do plano mensal."
            />
            <FAQ
              q="Como funciona o teste grátis?"
              a="7 dias completos com todas as funcionalidades. Cobramos só se você continuar."
            />
            <FAQ
              q="Preciso de algum equipamento especial?"
              a="Não. Funciona com qualquer iPhone ou Android moderno. Sem instalações nem hardware extra."
            />
          </div>
        </div>
      </section>
    </div>
  )
}

function FAQ({ q, a }) {
  return (
    <details className="card group p-4">
      <summary className="cursor-pointer list-none font-display text-[13px] font-semibold tracking-tight text-white group-open:text-aqua-300">
        {q}
      </summary>
      <p className="mt-2 text-[12px] leading-relaxed text-white/60">{a}</p>
    </details>
  )
}
