import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { Image, Eye, Camera, Calendar, Aperture, Download, Trash2, ClipboardPaste } from 'lucide-react'

interface ExifData {
  make?: string; model?: string; dateTime?: string; iso?: number
  aperture?: string; shutterSpeed?: string; focalLength?: string
  gps?: { lat: number; lng: number }; dimensions?: string
  raw: Record<string, string>
}

// Parse basic EXIF from JPEG binary
function parseExifFromJpeg(buffer: ArrayBuffer): Record<string, string> | null {
  const dv = new DataView(buffer)
  if (dv.getUint16(0) !== 0xFFD8) return null
  let offset = 2
  while (offset < buffer.byteLength - 1) {
    const marker = dv.getUint16(offset)
    offset += 2
    if (marker === 0xFFE1) {
      const length = dv.getUint16(offset)
      const exifStart = offset + 2
      const exifString = new TextDecoder().decode(new Uint8Array(buffer, exifStart + 6, length - 2))
      if (exifString !== 'Exif\0\0') { offset += length; continue }
      const tiffOffset = exifStart + 6
      const littleEndian = dv.getUint16(tiffOffset) === 0x4949
      const ifd0Offset = dv.getUint32(tiffOffset + 4, littleEndian) + tiffOffset
      const entries = dv.getUint16(ifd0Offset, littleEndian)
      const result: Record<string, string> = {}
      const tags: Record<number, string> = {
        0x010F: 'Make', 0x0110: 'Model', 0x0132: 'DateTime',
        0x8827: 'ISO', 0x8298: 'Copyright', 0x013B: 'Artist',
        0x920A: 'FocalLength', 0x829D: 'FNumber', 0x829A: 'ExposureTime',
      }
      for (let i = 0; i < entries; i++) {
        const entryOffset = ifd0Offset + 2 + i * 12
        const tag = dv.getUint16(entryOffset, littleEndian)
        const type = dv.getUint16(entryOffset + 2, littleEndian)
        const count = dv.getUint32(entryOffset + 4, littleEndian)
        const valueOffset = entryOffset + 8
        if (tags[tag]) {
          if (type === 2) {
            const strOffset = tiffOffset + dv.getUint32(valueOffset, littleEndian)
            result[tags[tag]] = new TextDecoder().decode(new Uint8Array(buffer, strOffset, count - 1))
          } else if (type === 3 || type === 4) {
            const val = dv.getUint16(valueOffset, littleEndian)
            result[tags[tag]] = String(val)
          } else if (type === 5) {
            const valOffset = tiffOffset + dv.getUint32(valueOffset, littleEndian)
            const num = dv.getUint32(valOffset, littleEndian) / dv.getUint32(valOffset + 4, littleEndian)
            result[tags[tag]] = tag === 0x829D ? `f/${num.toFixed(1)}` : String(num)
          }
        }
      }
      return result
    }
    offset += dv.getUint16(offset)
  }
  return null
}

export default function ExifTool() {
  const [source, setSource] = useState<{ file: File; url: string } | null>(null)
  const [exif, setExif] = useState<ExifData | null>(null)
  const [stripped, setStripped] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFiles = useCallback(async (files: File[]) => {
    if (!files.length) return
    if (source) { URL.revokeObjectURL(source.url); if (stripped) URL.revokeObjectURL(stripped) }
    const file = files[0]
    setSource({ file, url: URL.createObjectURL(file) })
    setExif(null); setStripped(null)

    // Get dimensions
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    await new Promise<void>(resolve => { img.onload = () => resolve(); img.onerror = () => resolve(); img.src = url })

    // Parse EXIF
    const buffer = await file.arrayBuffer()
    const raw = parseExifFromJpeg(buffer) || {}
    const data: ExifData = { raw }

    if (raw.Make) data.make = raw.Make
    if (raw.Model) data.model = raw.Model
    if (raw.DateTime) data.dateTime = raw.DateTime
    if (raw.ISO) data.iso = parseInt(raw.ISO)
    if (raw.FNumber) data.aperture = raw.FNumber
    if (raw.ExposureTime) data.shutterSpeed = `1/${Math.round(parseFloat(raw.ExposureTime) ? 1 / parseFloat(raw.ExposureTime) : 0)}s`
    if (raw.FocalLength) data.focalLength = `${raw.FocalLength}mm`
    if (img.naturalWidth) data.dimensions = `${img.naturalWidth} × ${img.naturalHeight}`

    setExif(data)
    URL.revokeObjectURL(url)
    toast('EXIF data loaded')
  }, [source, stripped])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault()
          const blob = items[i].getAsFile()
          if (blob) { handleFiles([new File([blob], 'pasted.jpg', { type: 'image/jpeg' })]); toast('Image pasted') }
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFiles, toast])

  const stripExif = useCallback(async () => {
    if (!source || !exif) return
    const img = new window.Image()
    await new Promise<void>(resolve => { img.onload = () => resolve(); img.src = source.url })
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight
    canvas.getContext('2d')!.drawImage(img, 0, 0)
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95))
    if (blob) {
      if (stripped) URL.revokeObjectURL(stripped)
      setStripped(URL.createObjectURL(blob))
      toast('EXIF data stripped — download the clean image')
    }
  }, [source, exif, stripped, toast])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 15 }} className="w-10 h-10 rounded-xl bg-lime-500/10 flex items-center justify-center">
            <Camera className="w-5 h-5 text-lime-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">EXIF Tool</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">View and strip EXIF metadata from images. Paste from clipboard.</p>
      </div>

      {!source ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <DropZone onFiles={handleFiles} accept="image/jpeg,image/tiff" multiple={false}
            label="Drop a JPEG or TIFF image" hint="Best with JPEG — or Ctrl+V to paste" className="mb-6" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6">
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste</span>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass rounded-2xl p-4 flex items-center gap-4">
            <img src={source.url} alt="Source" className="w-20 h-20 rounded-xl object-cover" />
            <div className="min-w-0"><p className="text-sm font-medium text-white truncate">{source.file.name}</p><p className="text-xs text-stone-400">{exif?.dimensions || 'Loading...'}</p></div>
          </div>

          {exif && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
              <h3 className="text-xs font-medium text-stone-400 mb-4">EXIF Metadata</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {exif.make && <MetaRow icon={<Camera className="w-3.5 h-3.5" />} label="Make" value={exif.make} />}
                {exif.model && <MetaRow icon={<Camera className="w-3.5 h-3.5" />} label="Model" value={exif.model} />}
                {exif.dateTime && <MetaRow icon={<Calendar className="w-3.5 h-3.5" />} label="Date" value={exif.dateTime} />}
                {exif.iso && <MetaRow icon={<Aperture className="w-3.5 h-3.5" />} label="ISO" value={String(exif.iso)} />}
                {exif.aperture && <MetaRow icon={<Aperture className="w-3.5 h-3.5" />} label="Aperture" value={exif.aperture} />}
                {exif.shutterSpeed && <MetaRow icon={<Aperture className="w-3.5 h-3.5" />} label="Shutter" value={exif.shutterSpeed} />}
                {exif.focalLength && <MetaRow icon={<Eye className="w-3.5 h-3.5" />} label="Focal" value={exif.focalLength} />}
                {exif.dimensions && <MetaRow icon={<Image className="w-3.5 h-3.5" />} label="Dimensions" value={exif.dimensions} />}
                {Object.keys(exif.raw).length === 0 && <p className="text-xs text-stone-500 col-span-2">No EXIF data found in this image.</p>}
              </div>
            </motion.div>
          )}

          <div className="flex flex-wrap gap-3">
            <motion.button onClick={stripExif} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lime-600 hover:bg-lime-500 text-white text-sm font-medium shadow-lg shadow-lime-600/20">
              <Trash2 className="w-4 h-4" />Strip EXIF
            </motion.button>
            {stripped && (
              <motion.button onClick={() => { const a = document.createElement('a'); a.href = stripped; a.download = source.file.name.replace(/\.[^.]+$/, '_clean.jpg'); a.click(); toast('Downloaded clean image') }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-600/20">
                <Download className="w-4 h-4" />Download Clean
              </motion.button>
            )}
            <motion.button onClick={() => { if (source) URL.revokeObjectURL(source.url); if (stripped) URL.revokeObjectURL(stripped); setSource(null); setExif(null); setStripped(null) }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium">New Image</motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

function MetaRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 bg-stone-800/30 rounded-xl px-4 py-3">
      <span className="text-stone-500">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-stone-500">{label}</p>
        <p className="text-sm text-stone-200 truncate">{value}</p>
      </div>
    </div>
  )
}
