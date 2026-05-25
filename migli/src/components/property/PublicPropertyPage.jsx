import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Eye, MapPin, ArrowRight } from 'lucide-react'
import { getPropertyBySlug } from '@lib/cloud/propertyService'
import { navigate } from '@hooks/useAppRoute'
import { isCloudConfigured } from '@lib/cloud/config'
import { getDefaultScene } from '@lib/splatCatalog'
import ImmersiveViewer from '@components/viewer/ImmersiveViewer'
import { LogoMark } from '@components/brand/Logo'

/**
 * Página pública de imóvel — `/#/p/:slug`
 *
 * Fluxo:
 *   1. Carrega metadados
 *   2. Mostra um intro card cinematográfico (foto + nome + preço + CTA)
 *   3. Usuário clica "Iniciar tour imersivo" → entra no ImmersiveViewer
 *
 * Esse passo intermediário evita que o navegador entre direto em
 * fullscreen + carregue WebGL pesado antes do usuário sinalizar intenção.
 * É o padrão de Apple Vision Pro / Luma — "click to enter".
 */
export default function PublicPropertyPage({ slug }) {
  const [state, setState] = useState({ loading: true, property: null, error: null })
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    setState({ loading: true, property: null, error: null })

    const load = async () => {
      try {
        if (!isCloudConfigured()) {
          await new Promise((r) => setTimeout(r, 300))
          if (!mounted) return
          setState({
            loading: false,
            property: {
              slug,
              name: 'Apartamento de demonstração',
              subtitle: 'Modo demo · sem cloud configurado',
              price: 'R$ 1.250.000',
              metadata: {
                area: '120 m²',
                rooms: ['3 quartos', '2 banheiros', '1 vaga'],
                highlight: 'Pé-direito alto',
                location: 'Pinheiros, São Paulo',
              },
            },
            error: null,
          })
          return
        }
        const row = await getPropertyBySlug(slug)
        if (!mounted) return
        if (!row) {
          setState({ loading: false, property: null, error: 'not-found' })
        } else if (row.status !== 'published') {
          setState({ loading: false, property: null, error: 'not-published' })
        } else {
          setState({ loading: false, property: row, error: null })
        }
      } catch (err) {
        if (!mounted) return
        setState({ loading: false, property: null, error: err.message })
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [slug])

  if (state.loading) return <LoadingScreen />
  if (state.error) return <NotFoundScreen reason={state.error} />

  const property = state.property
  const scene = property.splat_url
    ? {
        splatUrl: property.splat_url,
        initial: property.metadata?.initial ?? {
          position: [4, 1.6, 5],
          target: [0, 1, 0],
        },
      }
    : getDefaultScene()

  const propertyMeta = {
    name: property.name,
    status: property.subtitle ?? 'Tour imersivo · ao vivo',
    price: property.price,
    area: property.metadata?.area,
    rooms: property.metadata?.rooms,
    highlight: property.metadata?.highlight,
  }

  return (
    <>
      <IntroCard
        property={property}
        onEnter={() => setTourOpen(true)}
      />
      <ImmersiveViewer
        open={tourOpen}
        scene={scene}
        propertyMeta={propertyMeta}
        onClose={() => setTourOpen(false)}
      />
    </>
  )
}

/* ============================================================
   IntroCard — apresenta o imóvel antes de entrar no tour
   ============================================================ */
function IntroCard({ property, onEnter }) {
  const meta = property.metadata ?? {}

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950 text-white">
      {/* Atmospheric backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 20%, rgba(0,194,255,0.10), transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(56,189,248,0.08), transparent 50%)',
        }}
      />

      {/* Branding bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center justify-between px-5 py-5 md:px-10"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 20px)' }}
      >
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault()
            navigate('/')
          }}
          data-hover
          className="flex items-center gap-2.5"
        >
          <LogoMark size={26} />
          <span className="font-display text-base font-extrabold tracking-tight gradient-text">
            Migli
          </span>
        </a>
        <div className="text-[10px] tracking-widest2 text-aqua-300/70">
          TOUR IMERSIVO
        </div>
      </motion.div>

      {/* Main content */}
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 pb-16 pt-8 md:px-12 md:pt-16">
        {/* Hero thumbnail / placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, filter: 'blur(8px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full overflow-hidden rounded-[28px] border border-glass-border"
          style={{
            aspectRatio: '16/9',
            background:
              'linear-gradient(135deg, #0F2A4A 0%, #061428 70%)',
          }}
        >
          {property.thumb_url ? (
            // eslint-disable-next-line jsx-a11y/img-redundant-alt
            <img
              src={property.thumb_url}
              alt={property.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <ThumbFallback />
          )}
          {/* Bottom-left badge */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full border border-aqua-400/40 bg-black/55 px-3 py-1.5 text-[11px] font-medium text-aqua-200 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aqua-400" />
            Pronto para visitar
          </div>
        </motion.div>

        {/* Title + meta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="mt-10 w-full max-w-2xl text-center"
        >
          {meta.location && (
            <div className="mb-3 inline-flex items-center gap-1.5 text-[11px] tracking-wider text-aqua-300/80">
              <MapPin size={12} />
              {meta.location}
            </div>
          )}
          <h1 className="font-display text-[clamp(32px,5vw,52px)] font-extrabold leading-tight tracking-[-0.02em] text-balance">
            {property.name}
          </h1>
          {property.subtitle && (
            <p className="mt-3 text-sm font-light text-white/55 md:text-base">
              {property.subtitle}
            </p>
          )}

          {/* Meta chips */}
          {(meta.rooms?.length || meta.area || meta.highlight) && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {meta.area && <Chip>{meta.area}</Chip>}
              {meta.rooms?.map((r) => (
                <Chip key={r}>{r}</Chip>
              ))}
              {meta.highlight && <Chip>{meta.highlight}</Chip>}
            </div>
          )}

          {/* Price */}
          {property.price && (
            <div className="mt-7 font-display text-3xl font-extrabold gradient-text-aqua md:text-4xl">
              {property.price}
            </div>
          )}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.35 }}
          className="mt-10"
        >
          <button
            onClick={onEnter}
            data-hover
            className="group relative flex items-center gap-3 rounded-full px-9 py-4 font-display text-base font-bold tracking-wide text-ink-950 transition-all hover:scale-105 active:scale-100"
            style={{
              background: 'linear-gradient(135deg, #00C2FF 0%, #38BDF8 100%)',
              boxShadow: '0 0 60px rgba(0, 194, 255, 0.4)',
            }}
          >
            <Eye size={18} strokeWidth={2.2} />
            Iniciar tour imersivo
            <ArrowRight
              size={18}
              strokeWidth={2.2}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
          <p className="mt-3 text-center text-[11px] text-white/40">
            Use o celular na horizontal para a melhor experiência
          </p>
        </motion.div>
      </div>

      {/* Footer with brand attribution */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
        className="absolute inset-x-0 bottom-4 flex justify-center text-[10px] tracking-widest2 text-white/30"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        TOUR IMERSIVO POR MIGLI
      </motion.div>
    </div>
  )
}

function Chip({ children }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/75">
      {children}
    </div>
  )
}

function ThumbFallback() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
      >
        <LogoMark size={64} />
      </motion.div>
    </div>
  )
}

/* ============================================================
   Loading + Not-found screens
   ============================================================ */
function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={48} animated />
        <div className="text-[11px] tracking-widest2 text-aqua-300">
          CARREGANDO IMÓVEL
        </div>
      </div>
    </div>
  )
}

function NotFoundScreen({ reason }) {
  const text =
    reason === 'not-found'
      ? 'Este imóvel não existe ou foi removido.'
      : reason === 'not-published'
        ? 'Este tour ainda não foi publicado.'
        : 'Não foi possível carregar o imóvel.'
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-center text-white">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md"
        >
          <div className="mb-6 flex justify-center">
            <LogoMark size={48} animated />
          </div>
          <h1 className="font-display text-3xl font-bold">Tour não disponível</h1>
          <p className="mt-3 text-sm font-light text-white/55">{text}</p>
          <button
            onClick={() => navigate('/')}
            className="mt-7 text-aqua-300 underline-offset-2 hover:underline"
          >
            ← Voltar para a home
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
