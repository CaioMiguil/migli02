import { motion } from 'framer-motion'
import { Check, Crown, Sparkles } from 'lucide-react'
import AppHeader from '@components/shell/AppHeader'
import { LogoMark } from '@components/brand/Logo'

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
    <div className="bg-wave min-h-screen">
      <AppHeader title="Plano" />

      <section className="px-5 pt-6 pb-12 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="eyebrow mb-3">UM PLANO. SIMPLES ASSIM.</div>
          <h2 className="font-display text-[clamp(28px,7vw,38px)] font-extrabold leading-[1.05] tracking-tightest text-ink-900">
            Tudo o que você precisa
            <span className="block gradient-text-ocean">por R$ 99/mês.</span>
          </h2>
        </motion.div>

        {/* Plan card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="relative mt-9 overflow-hidden rounded-3xl"
          style={{
            background:
              'linear-gradient(160deg, #FFFFFF 0%, #EFF8FD 100%)',
            border: '1px solid rgba(14, 138, 196, 0.2)',
            boxShadow:
              '0 20px 50px rgba(14, 138, 196, 0.18), 0 4px 12px rgba(14, 138, 196, 0.08)',
          }}
        >
          {/* Top gradient line */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{
              background:
                'linear-gradient(90deg, transparent, #0E8AC4, transparent)',
            }}
          />

          <div className="p-7 md:p-9">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-ocean-500">
                  <LogoMark size={22} />
                </div>
                <div>
                  <div className="font-display text-base font-bold tracking-tight text-ink-900">
                    Migli Pro
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest3 text-ocean-600">
                    ACESSO COMPLETO
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-ocean-100 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest2 text-ocean-700">
                <Crown size={10} strokeWidth={2.4} />
                Recomendado
              </div>
            </div>

            {/* Price */}
            <div className="mt-7 flex items-baseline gap-1">
              <span className="font-display text-base font-light text-ink-500">
                R$
              </span>
              <span className="font-display text-6xl font-extrabold leading-none tracking-tightest text-ink-900">
                99
              </span>
              <span className="font-display text-base font-light text-ink-500">
                /mês
              </span>
            </div>
            <p className="mt-2 text-[13px] font-light text-ink-700">
              Tudo o que você precisa para transformar imóveis em
              experiências.
            </p>

            {/* Benefits */}
            <div className="mt-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex items-start gap-2.5">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-ocean-100">
                    <Check
                      size={11}
                      strokeWidth={3}
                      className="text-ocean-600"
                    />
                  </div>
                  <div>
                    <div className="font-display text-[12px] font-semibold tracking-tight text-ink-900">
                      {b.title}
                    </div>
                    <div className="text-[11px] text-ink-500">{b.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={onSubscribe}
              data-hover
              className="group mt-8 flex w-full items-center justify-center gap-2 rounded-full px-6 py-4 font-display text-[14px] font-semibold tracking-tight text-white transition-all active:scale-95"
              style={{
                background:
                  'linear-gradient(135deg, #0E8AC4 0%, #0871A6 100%)',
                boxShadow: '0 14px 40px rgba(14, 138, 196, 0.32)',
              }}
            >
              <Sparkles size={14} strokeWidth={2.2} />
              Assinar agora
            </button>

            <div className="mt-4 text-center text-[11px] text-ink-500">
              7 dias grátis · Cancela quando quiser · Sem multa
            </div>
          </div>
        </motion.div>

        {/* FAQ */}
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
      <summary className="cursor-pointer list-none font-display text-[13px] font-semibold tracking-tight text-ink-900 group-open:text-ocean-600">
        {q}
      </summary>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-600">{a}</p>
    </details>
  )
}
