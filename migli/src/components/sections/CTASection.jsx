import { motion } from 'framer-motion'
import { staggerContainer, fadeUp, cinemaReveal } from '@lib/motion'
import Badge from '@components/ui/Badge'
import Button from '@components/ui/Button'

export default function CTASection() {
  return (
    <section id="cta" className="bg-ink-950 px-6 pb-32 pt-8 md:px-12">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="relative overflow-hidden rounded-[32px] border border-aqua-400/20 p-12 md:p-20 text-center"
          style={{
            background:
              'linear-gradient(135deg, #0A1E3D 0%, #061428 50%, #0A2040 100%)',
          }}
        >
          {/* Radial glow */}
          <div
            className="pointer-events-none absolute -top-32 left-1/2 h-[400px] w-[600px] -translate-x-1/2"
            style={{
              background:
                'radial-gradient(ellipse, rgba(0,194,255,0.15) 0%, transparent 70%)',
            }}
          />
          {/* Bottom line accent */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-px"
            style={{
              background:
                'linear-gradient(90deg, transparent, rgba(0,194,255,0.5), transparent)',
            }}
          />

          <div className="relative">
            <motion.div variants={fadeUp} className="mb-8 flex justify-center">
              <Badge>JUNTE-SE À PRÓXIMA GERAÇÃO DE CORRETORES</Badge>
            </motion.div>

            <motion.h2
              variants={cinemaReveal}
              className="font-display font-extrabold leading-[1.05] tracking-[-0.02em] text-[clamp(36px,5vw,64px)]"
            >
              O futuro dos imóveis
              <br />
              começa com <span className="gradient-text-aqua">um clique.</span>
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-6 max-w-md text-base md:text-lg font-light leading-relaxed text-white/45"
            >
              Imobiliárias inovadoras já estão transformando a forma de
              apresentar imóveis. Não fique de fora.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-12">
              <Button variant="primary" size="lg">
                Começar agora
              </Button>
              <div className="mt-5 text-xs text-white/25">
                7 dias grátis · Sem cartão de crédito
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
