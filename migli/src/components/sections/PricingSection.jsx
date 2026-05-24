import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { PRICING } from '@lib/constants'
import { staggerContainer, fadeUp, cinemaReveal, scaleIn } from '@lib/motion'
import SectionHeader from '@components/ui/SectionHeader'
import Badge from '@components/ui/Badge'
import Button from '@components/ui/Button'
import { LogoMark } from '@components/brand/Logo'

/**
 * PricingSection — um plano único, premium, sem distração.
 *
 * Estratégia: simplicidade radical. Sem grid de comparação, sem tier,
 * sem "Starter / Pro / Enterprise". Apenas uma escolha clara.
 */
export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-ink-950 px-6 py-32 md:px-12"
    >
      {/* Ambient backdrop glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgba(0,194,255,0.10) 0%, transparent 65%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="mb-14 flex justify-center">
          <SectionHeader
            eyebrow="UM PLANO. SIMPLES ASSIM."
            title={
              <>
                Tudo o que você precisa
                <br />
                <span className="gradient-text-aqua">por um valor justo.</span>
              </>
            }
            sub="Sem pacotes confusos. Sem letras miúdas. Apenas a experiência completa MIGLI, do scan ao tour imersivo."
            align="center"
          />
        </div>

        {/* Single plan card */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="relative mx-auto max-w-xl"
        >
          {/* Glow border layer */}
          <div
            aria-hidden
            className="absolute -inset-px rounded-[32px] opacity-80"
            style={{
              background:
                'linear-gradient(135deg, rgba(0,194,255,0.6) 0%, rgba(125,211,252,0.15) 50%, rgba(0,194,255,0.5) 100%)',
              filter: 'blur(1px)',
            }}
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="relative overflow-hidden rounded-[32px] border border-glass-border bg-ink-900/95 p-10 backdrop-blur-2xl md:p-14"
          >
            {/* Top accent line */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(0,194,255,0.6), transparent)',
              }}
            />

            {/* Brand mark + plan name */}
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <LogoMark size={32} animated />
                <div>
                  <div className="font-display text-lg font-bold leading-none">
                    {PRICING.name}
                  </div>
                  <div className="mt-1 text-[10px] tracking-widest2 text-aqua-300/70">
                    ACESSO COMPLETO
                  </div>
                </div>
              </div>
              <Badge>RECOMENDADO</Badge>
            </motion.div>

            {/* Price */}
            <motion.div
              variants={cinemaReveal}
              className="mt-10 flex items-baseline gap-2"
            >
              <span className="font-display text-2xl font-light text-white/55">
                {PRICING.currency}
              </span>
              <span className="font-display text-7xl font-extrabold leading-none tracking-tight gradient-text md:text-8xl">
                {PRICING.price}
              </span>
              <span className="font-display text-xl font-light text-white/45">
                {PRICING.cycle}
              </span>
            </motion.div>

            <motion.p
              variants={fadeUp}
              className="mt-3 text-sm font-light leading-relaxed text-white/55"
            >
              {PRICING.oneLiner}
            </motion.p>

            {/* Divider */}
            <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Benefits — two-column grid on desktop, one on mobile */}
            <motion.ul
              variants={staggerContainer}
              className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-x-6"
            >
              {PRICING.benefits.map((b) => (
                <motion.li
                  key={b}
                  variants={fadeUp}
                  className="flex items-start gap-2.5"
                >
                  <span className="mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full bg-aqua-400/15">
                    <Check size={10} strokeWidth={3} className="text-aqua-300" />
                  </span>
                  <span className="text-sm font-light leading-relaxed text-white/80">
                    {b}
                  </span>
                </motion.li>
              ))}
            </motion.ul>

            {/* CTAs */}
            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col items-stretch gap-3 md:flex-row md:items-center"
            >
              <Button variant="primary" size="lg" className="md:flex-1">
                {PRICING.primaryCta}
              </Button>
              <Button variant="secondary" size="lg">
                {PRICING.secondaryCta}
              </Button>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-5 text-center text-xs text-white/35"
            >
              {PRICING.reassurance}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
