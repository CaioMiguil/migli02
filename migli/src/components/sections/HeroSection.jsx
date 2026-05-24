import { motion } from 'framer-motion'
import { BRAND } from '@lib/constants'
import { staggerContainer, fadeUp, cinemaReveal } from '@lib/motion'
import ParticleField from '@components/ui/ParticleField'
import BackgroundOrbs from '@components/ui/BackgroundOrbs'
import Badge from '@components/ui/Badge'
import Button from '@components/ui/Button'
import { LogoMark } from '@components/brand/Logo'

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6"
    >
      {/* Background layers */}
      <ParticleField density={90} />
      <div className="absolute inset-0 bg-grid" />
      <BackgroundOrbs />

      {/* Content */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-4xl text-center"
      >
        <motion.div
          variants={fadeUp}
          className="mb-7 flex justify-center"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, ease: 'easeInOut', repeat: Infinity }}
          >
            <LogoMark size={64} animated />
          </motion.div>
        </motion.div>

        <motion.div variants={fadeUp} className="mb-10 flex justify-center">
          <Badge>IMÓVEIS COM IA · {BRAND.region.toUpperCase()}</Badge>
        </motion.div>

        <motion.h1
          variants={cinemaReveal}
          className="font-display font-extrabold leading-[0.95] tracking-[-0.02em] text-balance text-[clamp(52px,8vw,108px)]"
        >
          <span className="block text-white">Imóveis em</span>
          <span className="block gradient-text-aqua">outra dimensão.</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="mx-auto mt-7 max-w-xl text-base md:text-xl font-light leading-relaxed text-white/55 text-balance"
        >
          {BRAND.longTagline}
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="mt-12 flex flex-wrap items-center justify-center gap-4"
        >
          <Button variant="primary" size="lg">
            Explorar imóvel
          </Button>
          <Button variant="secondary" size="lg">
            Ver demonstração ↗
          </Button>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 0.55, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] tracking-widest2 text-aqua-300">ROLE</span>
        <div
          className="h-12 w-px animate-scroll-pulse"
          style={{
            background:
              'linear-gradient(to bottom, transparent, #00C2FF, transparent)',
          }}
        />
      </motion.div>
    </section>
  )
}
