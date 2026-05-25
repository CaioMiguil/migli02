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
} from 'lucide-react'
import AppHeader from '@components/shell/AppHeader'
import { useAuth } from '@hooks/useAuth'
import { isCloudConfigured } from '@lib/cloud/config'
import {
  listMyProperties,
  updateProperty,
  deleteProperty,
} from '@lib/cloud/propertyService'
import { subscribeProperties } from '@lib/cloud/propertyRealtime'
import { navigate } from '@hooks/useAppRoute'

const STATUS = {
  draft: { label: 'Rascunho', color: '#6B7280', bg: '#F4F7FB', dot: '#9CA3AF' },
  uploading: { label: 'Enviando', color: '#0E8AC4', bg: '#DCEFFA', dot: '#0E8AC4' },
  processing: { label: 'Processando', color: '#D97706', bg: '#FEF3C7', dot: '#F59E0B' },
  published: { label: 'Pronto', color: '#047857', bg: '#D1FAE5', dot: '#10B981' },
  failed: { label: 'Erro', color: '#DC2626', bg: '#FEE2E2', dot: '#EF4444' },
}

/**
 * BibliotecaTab — biblioteca de imóveis escaneados.
 *
 * Carrega via Supabase + se inscreve em updates realtime. Quando o
 * pipeline (real ou simulado) marca um imóvel como pronto, o card
 * atualiza na hora.
 */
export default function BibliotecaTab({ onScan, onOpenProperty }) {
  const { user, ready, cloudOn } = useAuth()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!ready || !user) {
      setLoading(false)
      return
    }
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

  useEffect(() => {
    if (!user?.id) return
    return subscribeProperties(user.id, {
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

  return (
    <div className="min-h-screen">
      <AppHeader title="Biblioteca" />

      <section className="px-5 pt-6 pb-12 md:px-8">
        {/* Banner cloud-off */}
        {!cloudOn && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-900">
            <strong className="font-semibold">Modo demo:</strong> cloud não
            configurado. Seus scans não estão sendo salvos no servidor.
          </div>
        )}
        {cloudOn && !user && (
          <div className="mb-5 rounded-2xl border border-ocean-100 bg-ocean-50 p-4 text-[12px] text-ocean-800">
            Faça login na aba <strong>Perfil</strong> para salvar seus
            escaneamentos na nuvem.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-[12px] text-red-700">
            {error}
          </div>
        )}

        {/* Empty / loading / grid */}
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
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 z-[1000] -translate-x-1/2 rounded-full bg-ink-900 px-5 py-2.5 text-[12px] font-medium text-white shadow-elevated"
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
function PropertyCard({ property, onOpen, onDelete, onRename, onShare }) {
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
    if (property.status === 'published') {
      onOpen?.()
    }
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="card overflow-hidden transition-shadow hover:shadow-elevated"
    >
      {/* Thumb */}
      <button
        type="button"
        onClick={handleCardClick}
        className="group block aspect-video w-full overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #DCEFFA 0%, #B3DEF3 70%)',
        }}
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
          className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-tight backdrop-blur"
          style={{
            background: status.bg + 'EE',
            color: status.color,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: status.dot,
              animation:
                property.status === 'processing' || property.status === 'uploading'
                  ? 'mig-pulse 1.4s ease-in-out infinite'
                  : 'none',
            }}
          />
          {status.label}
        </div>

        {property.status === 'published' && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/30 group-hover:opacity-100">
            <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-3.5 py-1.5 text-[11px] font-semibold text-ink-900">
              <Eye size={12} strokeWidth={2.2} />
              Abrir tour
            </div>
          </div>
        )}
      </button>

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
                className="w-full rounded-md border border-ocean-300 bg-paper-50 px-2 py-1 font-display text-[14px] font-bold text-ink-900 focus:outline-none"
              />
            ) : (
              <h3 className="truncate font-display text-[14px] font-bold tracking-tight text-ink-900">
                {property.name}
              </h3>
            )}
            {property.subtitle && (
              <p className="mt-0.5 truncate text-[11px] text-ink-500">
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
              className="flex h-7 w-7 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-paper-100 hover:text-ink-700"
              aria-label="Mais opções"
            >
              <MoreVertical size={14} />
            </button>
            {menuOpen && (
              <div
                onMouseLeave={() => setMenuOpen(false)}
                className="absolute right-0 top-9 z-10 w-44 overflow-hidden rounded-xl border border-paper-200 bg-paper-50 shadow-elevated"
              >
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    setEditing(true)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] text-ink-700 hover:bg-paper-100"
                >
                  <Edit3 size={12} />
                  Renomear
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onDelete()
                  }}
                  className="flex w-full items-center gap-2 border-t border-paper-200 px-3 py-2 text-left text-[12px] text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={12} />
                  Excluir
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {property.status === 'published' && property.slug ? (
            <>
              <button
                onClick={onOpen}
                data-hover
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-ocean-500 px-3 py-1.5 text-[11px] font-semibold text-white transition-all hover:bg-ocean-600 active:scale-95"
              >
                <Eye size={11} strokeWidth={2.4} />
                Abrir
              </button>
              <button
                onClick={onShare}
                data-hover
                aria-label="Compartilhar"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-paper-300 text-ink-500 transition-all hover:border-ocean-400 hover:text-ocean-600"
              >
                <Share2 size={11} />
              </button>
            </>
          ) : (
            <div className="text-[11px] italic text-ink-400">
              {property.status === 'processing' && 'Reconstruindo em 3D…'}
              {property.status === 'uploading' && 'Enviando frames…'}
              {property.status === 'draft' && 'Aguardando captura'}
              {property.status === 'failed' && 'Tentar novamente?'}
            </div>
          )}
        </div>
      </div>
    </motion.article>
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
          <Sparkles size={40} strokeWidth={1.2} className="text-ocean-300" />
        </motion.div>
      ) : (
        <ImageIcon size={40} strokeWidth={1.2} className="text-ocean-300/60" />
      )}
    </div>
  )
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="aspect-video animate-pulse bg-paper-100" />
          <div className="p-4">
            <div className="h-3 w-2/3 animate-pulse rounded bg-paper-200" />
            <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded bg-paper-100" />
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
      className="relative overflow-hidden rounded-3xl border border-dashed border-ocean-200 bg-paper-50 p-10 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 left-1/2 h-40 w-80 -translate-x-1/2"
        style={{
          background:
            'radial-gradient(ellipse, rgba(14,138,196,0.16), transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      <div className="relative">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-ocean-100">
          <Camera size={24} strokeWidth={1.7} className="text-ocean-600" />
        </div>
        <h3 className="font-display text-lg font-bold tracking-tight text-ink-900">
          Sua biblioteca está vazia
        </h3>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-600">
          Faça seu primeiro scan e ele aparece aqui automaticamente.
        </p>
        <button
          onClick={onScan}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-ocean-500 px-5 py-2.5 text-[13px] font-semibold text-white shadow-ocean transition-all hover:bg-ocean-600 active:scale-95"
        >
          <Camera size={14} strokeWidth={2.4} />
          Escanear primeiro imóvel
        </button>
      </div>
    </motion.div>
  )
}

void navigate
