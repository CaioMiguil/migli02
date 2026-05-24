import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Camera,
  Share2,
  MoreVertical,
  Eye,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Edit3,
  Check,
  Search,
} from 'lucide-react'
import {
  listMyProperties,
  createProperty,
  updateProperty,
  deleteProperty,
} from '@lib/cloud/propertyService'
import { subscribeProperties } from '@lib/cloud/propertyRealtime'
import { useAuth } from '@hooks/useAuth'
import { navigate } from '@hooks/useRoute'
import { useUploadQueue } from '@hooks/useUploadQueue'
import { UploadStatus } from '@lib/upload/uploadQueue'
import { fadeUp, staggerContainer, scaleIn } from '@lib/motion'
import Nav from '@components/Nav'
import Footer from '@components/Footer'
import Button from '@components/ui/Button'
import CaptureScreen from '@components/capture/CaptureScreen'
import BrokerOnboarding, {
  hasSeenBrokerOnboarding,
} from '@components/onboarding/BrokerOnboarding'

const STATUS_INFO = {
  draft: { label: 'Rascunho', color: '#94a3b8' },
  processing: { label: 'Processando', color: '#fbbf24' },
  published: { label: 'Publicado', color: '#22d3ee' },
  failed: { label: 'Erro', color: '#f87171' },
}
const STATUS_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'published', label: 'Publicados' },
  { id: 'processing', label: 'Processando' },
  { id: 'draft', label: 'Rascunhos' },
]

export default function DashboardScreen() {
  const { user, ready, cloudOn } = useAuth()
  const queue = useUploadQueue()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [toast, setToast] = useState(null)

  // Onboarding control: aparece se logado e nunca viu
  useEffect(() => {
    if (ready && user && !hasSeenBrokerOnboarding()) {
      const t = setTimeout(() => setShowOnboarding(true), 400)
      return () => clearTimeout(t)
    }
  }, [ready, user])

  const showToast = useCallback((text, kind = 'ok') => {
    setToast({ text, kind, at: Date.now() })
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  // Carga inicial
  useEffect(() => {
    if (!ready || !user) return
    let mounted = true
    setLoading(true)
    listMyProperties()
      .then((rows) => mounted && setProperties(rows))
      .catch((err) => mounted && setError(err.message))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [ready, user])

  // Realtime — push de updates do Supabase. Quando o pipeline marca
  // status='published' + splat_url, o card aqui muda na hora.
  useEffect(() => {
    if (!user?.id) return
    return subscribeProperties(user.id, {
      onInsert: (row) =>
        setProperties((prev) =>
          prev.some((p) => p.id === row.id) ? prev : [row, ...prev],
        ),
      onUpdate: (next) => {
        setProperties((prev) =>
          prev.map((p) => (p.id === next.id ? next : p)),
        )
        // Notificar quando uma publicação acontece (mudança visível)
        if (next.status === 'published') {
          showToast(`✦ ${next.name} ficou pronto`)
        }
      },
      onDelete: (row) =>
        setProperties((prev) => prev.filter((p) => p.id !== row.id)),
    })
  }, [user?.id, showToast])

  // Filtrados + buscados
  const visible = useMemo(() => {
    let rows = properties
    if (filter !== 'all') rows = rows.filter((p) => p.status === filter)
    const q = search.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.subtitle?.toLowerCase().includes(q),
      )
    }
    return rows
  }, [properties, filter, search])

  // Contagens por status para os filtros
  const counts = useMemo(() => {
    const c = { all: properties.length, draft: 0, processing: 0, published: 0 }
    for (const p of properties) {
      if (c[p.status] != null) c[p.status]++
    }
    return c
  }, [properties])

  const handleCreate = async () => {
    try {
      const row = await createProperty({
        name: 'Novo imóvel',
        subtitle: 'Aguardando captura',
      })
      setProperties((prev) => [row, ...prev])
      showToast('Imóvel criado · pronto para captura')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDelete = async (id) => {
    const ok = confirm('Excluir este imóvel? Esta ação não pode ser desfeita.')
    if (!ok) return
    try {
      await deleteProperty(id)
      setProperties((prev) => prev.filter((p) => p.id !== id))
      showToast('Imóvel removido')
    } catch (err) {
      setError(err.message)
    }
  }

  const handleRename = async (id, name) => {
    try {
      const next = await updateProperty(id, { name })
      setProperties((prev) => prev.map((p) => (p.id === id ? next : p)))
    } catch (err) {
      setError(err.message)
    }
  }

  const handleShare = async (property) => {
    if (!property.slug) return
    const url = `${window.location.origin}/#/p/${property.slug}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${property.name} · MIGLI`,
          text: 'Tour imersivo em 3D',
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        showToast('Link copiado para a área de transferência')
      }
    } catch {
      /* user canceled */
    }
  }

  // Gates
  if (!cloudOn) return <GateScreen reason="cloud-off" />
  if (ready && !user) return <GateScreen reason="logged-out" />

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <Nav onOpenDashboard={() => navigate('/dashboard')} />

      <main className="mx-auto max-w-6xl px-5 pb-32 pt-28 md:px-12 md:pt-32">
        {/* Header */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-wrap items-end justify-between gap-6"
        >
          <motion.div variants={fadeUp}>
            <div className="section-label mb-3">SEU ESPAÇO</div>
            <h1 className="font-display text-4xl font-extrabold leading-tight md:text-5xl">
              Meus imóveis
            </h1>
            <p className="mt-3 max-w-md text-sm font-light text-white/55">
              Gerencie suas experiências imersivas, capture novos imóveis e
              compartilhe tours com seus clientes.
            </p>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCaptureOpen(true)}
            >
              <Camera size={14} className="mr-1.5 inline" />
              Capturar
            </Button>
            <Button variant="primary" size="md" onClick={handleCreate}>
              <Plus size={14} className="mr-1.5 inline" />
              Novo imóvel
            </Button>
          </motion.div>
        </motion.div>

        {/* Active upload banner */}
        <ActiveUploadsBanner items={queue.items} />

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-200/80">
            {error}
          </div>
        )}

        {/* Filters + search */}
        {properties.length > 0 && (
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="mt-8 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((f) => {
                const count = counts[f.id] ?? 0
                const active = filter === f.id
                return (
                  <button
                    key={f.id}
                    onClick={() => setFilter(f.id)}
                    data-hover
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all ${
                      active
                        ? 'border-aqua-400/40 bg-aqua-400/10 text-aqua-300'
                        : 'border-white/10 bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white/85'
                    }`}
                  >
                    {f.label}
                    <span className={`ml-1.5 ${active ? 'text-aqua-300/70' : 'text-white/35'}`}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="relative w-full md:w-56">
              <Search
                size={14}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar imóvel…"
                className="w-full rounded-full border border-white/10 bg-white/[0.025] px-3 py-2 pl-9 text-xs text-white placeholder-white/30 transition-all focus:border-aqua-400/50 focus:bg-white/[0.04] focus:outline-none"
              />
            </div>
          </motion.div>
        )}

        {/* Grid */}
        <div className="mt-8">
          {loading ? (
            <LoadingGrid />
          ) : properties.length === 0 ? (
            <EmptyState onCreate={handleCreate} onCapture={() => setCaptureOpen(true)} />
          ) : visible.length === 0 ? (
            <EmptyFilter
              onReset={() => {
                setFilter('all')
                setSearch('')
              }}
            />
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <AnimatePresence>
                {visible.map((p) => (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    onDelete={() => handleDelete(p.id)}
                    onRename={(name) => handleRename(p.id, name)}
                    onShare={() => handleShare(p)}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      <Footer />

      <CaptureScreen open={captureOpen} onClose={() => setCaptureOpen(false)} />

      <BrokerOnboarding
        open={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 z-[9000] -translate-x-1/2 rounded-full border border-aqua-400/30 bg-ink-900/95 px-5 py-2.5 text-xs font-medium text-aqua-100 shadow-glow backdrop-blur-2xl"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
          >
            <span className="flex items-center gap-2">
              <Check size={12} className="text-aqua-300" strokeWidth={2.4} />
              {toast.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================================================
   PropertyCard — clean, editable, premium
   ============================================================ */
function PropertyCard({ property, onDelete, onRename, onShare }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(property.name)
  const statusInfo = STATUS_INFO[property.status] || STATUS_INFO.draft

  // Sync local name when property updates from upstream
  useEffect(() => setName(property.name), [property.name])

  const saveName = () => {
    const trimmed = name.trim()
    if (!trimmed || trimmed === property.name) {
      setName(property.name)
      setEditing(false)
      return
    }
    onRename(trimmed)
    setEditing(false)
  }

  return (
    <motion.div
      variants={scaleIn}
      layout
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.025] transition-all duration-300 hover:border-glass-border"
    >
      {/* Thumbnail */}
      <div
        className="relative aspect-video overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F2A4A 0%, #061428 70%)' }}
      >
        {property.thumb_url ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img
            src={property.thumb_url}
            alt={property.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <ThumbPlaceholder />
        )}
        {/* Status badge */}
        <div
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border bg-black/55 px-2.5 py-1 text-[10px] tracking-wider backdrop-blur-md"
          style={{ borderColor: statusInfo.color + '55', color: statusInfo.color }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: statusInfo.color }}
          />
          {statusInfo.label}
        </div>
        {/* Hover: open tour overlay */}
        {property.status === 'published' && property.slug && (
          <button
            onClick={() => navigate(`/p/${property.slug}`)}
            data-hover
            className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100"
          >
            <div className="flex items-center gap-2 rounded-full border border-aqua-400/40 bg-ink-900/85 px-4 py-2 text-xs font-medium text-aqua-200 backdrop-blur-md">
              <Eye size={12} strokeWidth={2} />
              Abrir tour
            </div>
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {editing ? (
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveName()
                  if (e.key === 'Escape') {
                    setName(property.name)
                    setEditing(false)
                  }
                }}
                className="w-full rounded-md border border-aqua-400/30 bg-white/[0.04] px-2 py-1 font-display text-base font-bold text-white focus:outline-none"
              />
            ) : (
              <button
                onClick={() => setEditing(true)}
                data-hover
                className="block w-full truncate text-left font-display text-base font-bold transition-colors hover:text-aqua-300"
              >
                {property.name}
              </button>
            )}
            {property.subtitle && (
              <div className="mt-0.5 truncate text-xs text-white/45">
                {property.subtitle}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Mais opções"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div
                onMouseLeave={() => setMenuOpen(false)}
                className="absolute right-0 top-9 z-10 w-44 overflow-hidden rounded-xl border border-glass-border bg-ink-900/95 backdrop-blur-2xl"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setEditing(true)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-white/75 hover:bg-white/[0.03] hover:text-aqua-300"
                >
                  <Edit3 size={12} />
                  Renomear
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete()
                  }}
                  className="flex w-full items-center gap-2 border-t border-white/[0.04] px-3 py-2 text-left text-xs text-red-300/85 hover:bg-red-500/10"
                >
                  <Trash2 size={12} />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          {property.status === 'published' && property.slug ? (
            <>
              <button
                onClick={() => navigate(`/p/${property.slug}`)}
                data-hover
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-aqua-400/30 bg-aqua-400/10 px-3 py-2 text-xs font-medium text-aqua-300 transition-all hover:border-aqua-400 hover:bg-aqua-400/20 active:scale-95"
              >
                <Eye size={12} strokeWidth={2} />
                Ver tour
              </button>
              <button
                onClick={onShare}
                data-hover
                aria-label="Compartilhar"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/55 transition-all hover:border-aqua-400 hover:text-aqua-300"
              >
                <Share2 size={12} />
              </button>
            </>
          ) : (
            <div className="flex-1 text-xs italic text-white/40">
              {property.status === 'processing'
                ? 'Reconstruindo em 3D…'
                : property.status === 'failed'
                  ? 'Reprocessamento necessário'
                  : 'Aguardando captura'}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function ThumbPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="relative">
        <ImageIcon size={36} strokeWidth={1.2} className="text-white/15" />
        <div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(0,194,255,0.15), transparent 70%)',
            filter: 'blur(10px)',
          }}
        />
      </div>
    </div>
  )
}

/* ============================================================
   ActiveUploadsBanner — banner com progresso dos uploads em curso
   ============================================================ */
function ActiveUploadsBanner({ items }) {
  const active = items.filter(
    (i) =>
      i.status === UploadStatus.UPLOADING ||
      i.status === UploadStatus.PROCESSING,
  )
  if (active.length === 0) return null
  const avgProgress =
    active.reduce((s, i) => s + (i.progress || 0), 0) / active.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-7 flex flex-wrap items-center gap-4 rounded-2xl border border-aqua-400/20 bg-aqua-400/[0.04] px-5 py-3.5"
    >
      <div className="flex items-center gap-3">
        <Sparkles size={16} className="animate-pulse text-aqua-300" />
        <div>
          <div className="font-display text-sm font-semibold">
            {active.length === 1
              ? '1 imóvel sendo processado'
              : `${active.length} imóveis sendo processados`}
          </div>
          <div className="mt-0.5 text-xs text-white/45">
            Você pode fechar essa página — vamos te avisar quando ficar pronto.
          </div>
        </div>
      </div>
      <div className="ml-auto flex w-full items-center gap-3 md:w-56">
        <div className="flex-1 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-1"
            style={{ background: 'linear-gradient(90deg, #00C2FF, #7DD3FC)' }}
            animate={{ width: `${Math.round(avgProgress)}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
        <span className="font-mono text-xs tabular-nums text-aqua-300">
          {Math.round(avgProgress)}%
        </span>
      </div>
    </motion.div>
  )
}

/* ============================================================
   Empty states + Loading
   ============================================================ */
function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-white/[0.04] bg-white/[0.015]"
        >
          <div className="aspect-video animate-pulse bg-white/[0.025]" />
          <div className="p-4">
            <div className="h-4 w-2/3 animate-pulse rounded bg-white/[0.04]" />
            <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/[0.03]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyState({ onCreate, onCapture }) {
  return (
    <motion.div
      variants={scaleIn}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-md rounded-3xl border border-dashed border-aqua-400/30 bg-white/[0.02] p-12 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 hidden h-40 w-80 -translate-x-1/2 rounded-full md:block"
        style={{
          background:
            'radial-gradient(ellipse, rgba(0,194,255,0.15), transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl glass-aqua">
        <Sparkles size={28} className="text-aqua-300" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-xl font-bold">Pronto para começar?</h3>
      <p className="mt-2 text-sm font-light text-white/55">
        Capture seu primeiro imóvel com o celular ou crie um esboço aqui no
        painel.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Button variant="primary" size="md" onClick={onCapture}>
          <Camera size={14} className="mr-1.5 inline" />
          Capturar primeiro imóvel
        </Button>
        <Button variant="secondary" size="md" onClick={onCreate}>
          <Plus size={14} className="mr-1.5 inline" />
          Criar esboço
        </Button>
      </div>
    </motion.div>
  )
}

function EmptyFilter({ onReset }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-10 text-center">
      <div className="text-sm font-light text-white/55">
        Nenhum imóvel encontrado com este filtro.
      </div>
      <button
        onClick={onReset}
        className="mt-3 text-xs font-medium text-aqua-300 underline-offset-2 hover:underline"
      >
        Limpar filtros
      </button>
    </div>
  )
}

function GateScreen({ reason }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-6 text-center text-white">
      <div className="max-w-md">
        <h1 className="font-display text-2xl font-bold">
          {reason === 'cloud-off'
            ? 'Cloud não configurado'
            : 'Você precisa estar logado'}
        </h1>
        <p className="mt-3 text-sm font-light text-white/55">
          {reason === 'cloud-off'
            ? 'O painel exige Supabase + Cloudflare R2 configurados. Veja .env.example.'
            : 'Faça login para acessar o painel de imóveis.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 text-aqua-300 underline-offset-2 hover:underline"
        >
          ← Voltar para a home
        </button>
      </div>
    </div>
  )
}
