import { motion } from 'framer-motion'
import { FEATURES } from '@lib/constants'
import { staggerContainer } from '@lib/motion'
import SectionHeader from '@components/ui/SectionHeader'
import FeatureCard from '@components/ui/FeatureCard'

export default function FeaturesSection() {
  return (
    <section id="features" className="relative bg-ink-950 px-6 py-32 md:px-12">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="A TECNOLOGIA POR TRÁS"
          title={
            <>
              Construído para o
              <br />
              imóvel do futuro.
            </>
          }
          sub="Uma plataforma completa para transformar qualquer imóvel numa experiência imersiva — do scan ao link compartilhável."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          className="mt-16 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
