import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Camera,
  Share2,
  Eye,
  Trash2,
  MoreVertical,
  Edit3,
  Sparkles,
  Image as ImageIcon,
  Download,
  Upload,
  CheckCircle2,
} from 'lucide-react'
import AppHeader from '@components/shell/AppHeader'
import { useAuth } from '@hooks/useAuth'
import { isCloudConfigured } from '@lib/cloud/config'
import {
  listMyProperties,
  updateProperty,
  deleteProperty,
} from '@lib/cloud/propertyService'
import { publishPropertyWithSplat } from '@lib/cloud/scanUploadService'
import { subscribeProperties } from '@lib/cloud/propertyRealtime'
import {
  localGetFrames,
  subscribeLocalProperties,
} from '@lib/cloud/localStore'
import { buildFramesZip, downloadBlob } from '@lib/capture/framesDownload'

const STATUS = {
  draft: { label: 'Rascunho', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', dot: '#94A3B8' },
  uploading: { label: 'Enviando', color: '#7DD3FC', bg: 'rgba(125,211,252,0.15)', dot: '#7DD3FC' },
  processing: { label: 'Processando', color: '#FBBF24', bg: 'rgba(251,191,36,0.15)', dot: '#FBBF24' },
  published: { label: 'Pronto', color: '#34D399', bg: 'rgba(52,211,153,0.15)', dot: '#34D399' },
  failed: { label: 'Erro', color: '#F87171', bg: 'rgba(248,113,113,0.15)', dot: '#F87171' },
}

export default function BibliotecaTab({ onScan, onOpenProperty }) {
  const { user, ready, cloudOn } = useAuth()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  // Carregar — funciona tanto cloud quanto local
  useEffect(() => {
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

  // Realtime — cloud + local
  useEffect(() => {
    let cleanupCloud = null
    let cleanupLocal = null

    const refresh = () => {
      listMyProperties().then(setProperties).catch(() => {})
    }

    if (user?.id && isCloudConfigured()) {
      cleanupCloud = subscribeProperties(user.id, {
        onInsert: (row) =>
          setProperties((prev) =>
            prev.some((p) => p.id === row.id) ? prev : [row, ...prev],
          ),
        onUpdate: (next) => {
          setProperties((prev) => prev.map((p) => (p.id === next.id ? next : p)))
          if (next.status === 'published') {
            setToast(`✦ ${next.name} ficou pronto`)
          }
        },
        onDelete: (row) =>
          setProperties((prev) => prev.filter((p) => p.id !== row.id)),
      })
    }
    cleanupLocal = subscribeLocalProperties(refresh)

    return () => {
      cleanupCloud?.()
      cleanupLocal?.()
    }
  }, [user?.id])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2800)
    return () => clearTimeout(t)
  }, [toast])

  const handleDelete = async (id) => {
    if (!confirm('Excluir este imóvel? Esta ação não pode ser desfeita.')) return
    try {
      await deleteProperty(id)
      setProperties((prev) => prev.filter((p) => p.id !== id))
      setToast('Imóvel removido')
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
        setToast('Link copiado')
      }
    } catch {
      /* canceled */
    }
  }

  const handleDownloadFrames = async (property) => {
    setToast('Preparando frames…')
    try {
      const records = await localGetFrames(property.id)
      if (records.length === 0) {
        setToast('Sem frames locais. Use os do servidor.')
        return
      }
      const frames = records
        .sort((a, b) => a.index - b.index)
        .map((r) => ({
          index: r.index,
          blob: r.blob,
        }))
      const manifest = {
        property: {
          id: property.id,
          slug: property.slug,
          name: property.name,
          status: property.status,
          createdAt: property.created_at,
        },
        capture: property.metadata?.capture || null,
        notes: 'Frames JPEG sequenciais capturados pelo MIGLI. Use COLMAP/gaussian-splatting offline pra reconstrução.',
      }
      const zip = await buildFramesZip(frames, manifest)
      downloadBlob(zip, `migli-${property.slug || property.id}.zip`)
      setToast('Frames baixados ✦')
    } catch (err) {
      setError(err.message)
    }
  }

  const handlePublishSplat = (property) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.sog,.ply,.splat,.compressed.ply'
    input.onchange = async (e) => {
      const file = e.target.files?.[0]
      if (!file) return
      try {
        // Em demo: converte o arquivo pra data URL local
        // Em cloud: idealmente subiria pra R2 — mas isso requer um endpoint
        // de upload geral no Worker. Por enquanto, data URL serve como
        // fallback funcional (o ImmersiveViewer carrega de data:, http:, R2)
        const dataUrl = await fileToDataUrl(file)
        const next = await publishPropertyWithSplat(property.id, dataUrl)
        setProperties((prev) => prev.map((p) => (p.id === property.id ? next : p)))
        setToast(`✦ ${property.name} publicado`)
      } catch (err) {
        setError(err.message)
      }
    }
    input.click()
  }

  return (
    <div className="min-h-screen pb-24">
      <AppHeader title="Biblioteca" />

      <section className="px-5 pt-6 md:px-8">
        {!cloudOn && (
          <div className="mb-5 rounded-2xl border border-aqua-400/20 bg-aqua-400/8 p-4 text-[12px] text-aqua-100">
            <strong className="font-semibold text-aqua-200">Modo offline:</strong>{' '}
            seus scans estão salvos no aparelho. Configure a nuvem em
            docs/GO_LIVE.md para compartilhar tours por link.
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-3 text-[12px] text-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingGrid />
        ) : properties.length === 0 ? (
          <EmptyLibrary onScan={onScan} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AnimatePresence>
              {properties.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p}
                  onOpen={() => onOpenProperty?.(p)}
                  onDelete={() => handleDelete(p.id)}
                  onRename={(name) => handleRename(p.id, name)}
                  onShare={() => handleShare(p)}
                  onDownloadFrames={() => handleDownloadFrames(p)}
                  onPublishSplat={() => handlePublishSplat(p)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-white px-5 py-2.5 text-[12px] font-medium text-ink-900 shadow-elevated"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ============================================================
   PropertyCard
   ============================================================ */
function PropertyCard({
  property,
  onOpen,
  onDelete,
  onRename,
  onShare,
  onDownloadFrames,
  onPublishSplat,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(property.name)
  const status = STATUS[property.status] || STATUS.draft

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

  const handleCardClick = () => {
    if (editing) return
    if (property.status === 'published') onOpen?.()
  }

  const isProcessing = property.status === 'processing' || property.status === 'uploading'

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="group overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900/60 backdrop-blur-xl transition-all hover:border-aqua-400/30"
    >
      <button
        type="button"
        onClick={handleCardClick}
        className="relative block aspect-video w-full overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0A1E2F 0%, #103D5A 100%)' }}
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
          <ThumbPlaceholder status={property.status} />
        )}

        {/* Status pill */}
        <div
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-tight backdrop-blur-md"
          style={{ background: status.bg, color: status.color }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: status.dot,
              animation: isProcessing ? 'mig-pulse 1.4s ease-in-out infinite' : 'none',
            }}
          />
          {status.label}
        </div>

        {property.status === 'published' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
            <div className="flex items-center gap-1.5 rounded-full bg-aqua-400 px-3.5 py-1.5 text-[11px] font-semibold text-ink-950">
              <Eye size={12} strokeWidth={2.4} />
              Abrir tour
            </div>
          </div>
        )}
      </button>

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
                className="w-full rounded-md border border-aqua-400/40 bg-white/5 px-2 py-1 font-display text-[14px] font-bold text-white focus:outline-none"
              />
            ) : (
              <h3 className="truncate font-display text-[14px] font-bold tracking-tight text-white">
                {property.name}
              </h3>
            )}
            {property.subtitle && (
              <p className="mt-0.5 truncate text-[11px] text-white/50">
                {property.subtitle}
              </p>
            )}
          </div>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Mais opções"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div
                onMouseLeave={() => setMenuOpen(false)}
                className="absolute right-0 top-9 z-10 w-52 overflow-hidden rounded-2xl border border-white/10 bg-ink-900/95 shadow-elevated backdrop-blur-xl"
              >
                <MenuItem
                  icon={Edit3}
                  label="Renomear"
                  onClick={() => {
                    setMenuOpen(false)
                    setEditing(true)
                  }}
                />
                <MenuItem
                  icon={Download}
                  label="Baixar frames (ZIP)"
                  onClick={() => {
                    setMenuOpen(false)
                    onDownloadFrames()
                  }}
                />
                {property.status !== 'published' && (
                  <MenuItem
                    icon={Upload}
                    label="Subir reconstrução (.sog)"
                    onClick={() => {
                      setMenuOpen(false)
                      onPublishSplat()
                    }}
                    accent="aqua"
                  />
                )}
                <MenuItem
                  icon={Trash2}
                  label="Excluir"
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete()
                  }}
                  accent="danger"
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {property.status === 'published' && property.slug ? (
            <>
              <button
                onClick={onOpen}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-aqua-400 px-3 py-1.5 text-[11px] font-semibold text-ink-950 transition-all hover:bg-aqua-300 active:scale-95"
              >
                <Eye size={11} strokeWidth={2.4} />
                Abrir
              </button>
              <button
                onClick={onShare}
                aria-label="Compartilhar"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/60 transition-all hover:border-aqua-400/60 hover:text-aqua-300"
              >
                <Share2 size={11} />
              </button>
            </>
          ) : isProcessing ? (
            <div className="text-[11px] italic text-white/40">
              {property.status === 'processing' && 'Aguardando reconstrução…'}
              {property.status === 'uploading' && 'Enviando frames…'}
            </div>
          ) : (
            <button
              onClick={onPublishSplat}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-aqua-400/30 bg-aqua-400/10 px-3 py-1.5 text-[11px] font-semibold text-aqua-200 transition-all hover:border-aqua-400 hover:bg-aqua-400/20 active:scale-95"
            >
              <CheckCircle2 size={11} strokeWidth={2.4} />
              Marcar como publicado
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function MenuItem({ icon: Icon, label, onClick, accent }) {
  const color =
    accent === 'danger'
      ? 'text-red-300 hover:bg-red-500/15'
      : accent === 'aqua'
        ? 'text-aqua-200 hover:bg-aqua-400/15'
        : 'text-white/85 hover:bg-white/10'
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 border-b border-white/5 px-3 py-2.5 text-left text-[12px] transition-colors last:border-b-0 ${color}`}
    >
      <Icon size={12} />
      {label}
    </button>
  )
}

function ThumbPlaceholder({ status }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      {status === 'processing' || status === 'uploading' ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 6, ease: 'linear', repeat: Infinity }}
        >
          <Sparkles size={40} strokeWidth={1.2} className="text-aqua-400/60" />
        </motion.div>
      ) : (
        <ImageIcon size={40} strokeWidth={1.2} className="text-aqua-400/40" />
      )}
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900/40">
          <div className="aspect-video animate-pulse bg-white/[0.04]" />
          <div className="p-4">
            <div className="h-3 w-2/3 animate-pulse rounded bg-white/[0.08]" />
            <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmptyLibrary({ onScan }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-3xl border border-dashed border-aqua-400/20 bg-ink-900/40 p-10 text-center backdrop-blur-xl"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2"
        style={{
          background: 'radial-gradient(ellipse, rgba(0,194,255,0.22), transparent 70%)',
          filter: 'blur(24px)',
        }}
      />
      <div className="relative">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-aqua-400/15 border border-aqua-400/30">
          <Camera size={24} strokeWidth={1.7} className="text-aqua-300" />
        </div>
        <h3 className="font-display text-lg font-bold tracking-tight text-white">
          Sua biblioteca está vazia
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-white/55">
          Faça seu primeiro scan e ele aparece aqui automaticamente.
        </p>
        <button
          onClick={onScan}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-aqua-400 px-5 py-2.5 text-[13px] font-semibold text-ink-950 transition-all hover:bg-aqua-300 active:scale-95"
        >
          <Camera size={14} strokeWidth={2.4} />
          Escanear primeiro imóvel
        </button>
      </div>
    </motion.div>
  )
}

/* ────────────────────────────────────────────── */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })
}
