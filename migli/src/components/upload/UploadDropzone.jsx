import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, Camera, FileVideo } from 'lucide-react'
import { useUploadQueue } from '@hooks/useUploadQueue'
import { UPLOAD_FORMATS } from '@lib/constants'
import Button from '@components/ui/Button'

/**
 * Real file dropzone. Hands off to the global UploadQueue.
 *
 * Accepts video, image, and 3D file formats. Multiple files welcome.
 * The CaptureScreen entry button only appears on devices that look mobile.
 */
export default function UploadDropzone({ onOpenCapture }) {
  const { enqueue } = useUploadQueue()
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const isLikelyMobile =
    typeof window !== 'undefined' &&
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

  const handleFiles = (fileList) => {
    if (!fileList?.length) return
    const arr = Array.from(fileList)
    enqueue(arr, { source: 'upload' })
  }

  return (
    <motion.div
      onClick={() => fileInputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      className="group relative cursor-pointer overflow-hidden rounded-[28px] border border-dashed p-10 text-center transition-all duration-300 md:p-16"
      data-hover
      style={{
        borderColor: dragOver ? '#00C2FF' : 'rgba(0, 194, 255, 0.3)',
        background: `radial-gradient(ellipse at 50% 0%, rgba(0,194,255,${dragOver ? 0.14 : 0.05}) 0%, transparent 70%)`,
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,image/*,.ply,.splat,.obj,.glb,.zip"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Top scanning line */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[1px] left-1/2 h-[2px] w-[60%] -translate-x-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent, #00C2FF, transparent)',
          opacity: 0.6,
        }}
      />

      {/* Hover glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle, rgba(0,194,255,0.18), transparent 70%)',
        }}
      />

      <div className="relative">
        <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-3xl glass-aqua">
          <Upload size={32} strokeWidth={1.5} className="text-aqua-300" />
        </div>
        <div className="font-display text-2xl font-bold">
          Arraste seus arquivos aqui
        </div>
        <div className="mt-3 text-sm font-light text-white/45">
          ou clique para selecionar · Suporta vídeos, fotos e scans
        </div>

        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="primary"
            size="md"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileVideo size={14} className="mr-1.5 inline" />
            Selecionar arquivos
          </Button>
          {isLikelyMobile && onOpenCapture && (
            <Button variant="secondary" size="md" onClick={onOpenCapture}>
              <Camera size={14} className="mr-1.5 inline" />
              Capturar com câmera
            </Button>
          )}
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-2">
          {UPLOAD_FORMATS.map((f) => (
            <div
              key={f}
              className="rounded-lg border border-white/[0.06] bg-white/[0.025] px-3 py-1.5 text-[11px] tracking-wider text-white/50"
            >
              {f}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
