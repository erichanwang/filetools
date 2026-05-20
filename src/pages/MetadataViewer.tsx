import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { Info, File, Image, FileText, Film, Music, Archive, Eye, Clock, HardDrive, Hash, ClipboardPaste } from 'lucide-react'

interface FileMeta {
  name: string
  size: number
  type: string
  lastModified: number
  extension: string
  category: string
  dimensions?: { width: number; height: number }
  duration?: number
  pages?: number
  details: { label: string; value: string; icon: React.ReactNode }[]
}

function getCategory(file: File): string {
  if (file.type.startsWith('image/')) return 'Image'
  if (file.type.startsWith('video/')) return 'Video'
  if (file.type.startsWith('audio/')) return 'Audio'
  if (file.type === 'application/pdf') return 'PDF'
  if (file.type.startsWith('text/')) return 'Text'
  if (file.name.match(/\.(zip|tar|gz|rar|7z)$/i)) return 'Archive'
  return 'Other'
}

function getCategoryIcon(cat: string) {
  switch (cat) {
    case 'Image': return <Image className="w-5 h-5 text-amber-400" />
    case 'Video': return <Film className="w-5 h-5 text-rose-400" />
    case 'Audio': return <Music className="w-5 h-5 text-emerald-400" />
    case 'PDF': return <FileText className="w-5 h-5 text-red-400" />
    case 'Archive': return <Archive className="w-5 h-5 text-orange-400" />
    default: return <File className="w-5 h-5 text-stone-400" />
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString()
}

const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export default function MetadataViewer() {
  const [metas, setMetas] = useState<FileMeta[]>([])
  const [selectedMeta, setSelectedMeta] = useState<FileMeta | null>(null)
  const { toast } = useToast()

  const processFiles = useCallback(async (newFiles: File[]) => {
    const metaArr: FileMeta[] = []

    for (const file of newFiles) {
      const cat = getCategory(file)
      const details: FileMeta['details'] = [
        { label: 'Size', value: formatSize(file.size), icon: <HardDrive className="w-3.5 h-3.5" /> },
        { label: 'Type', value: file.type || 'Unknown', icon: <Hash className="w-3.5 h-3.5" /> },
        { label: 'Extension', value: file.name.split('.').pop()?.toUpperCase() || 'N/A', icon: <File className="w-3.5 h-3.5" /> },
        { label: 'Last Modified', value: formatDate(file.lastModified), icon: <Clock className="w-3.5 h-3.5" /> },
      ]

      const meta: FileMeta = {
        name: file.name, size: file.size, type: file.type,
        lastModified: file.lastModified,
        extension: file.name.split('.').pop()?.toUpperCase() || 'N/A',
        category: cat, details,
      }

      if (cat === 'Image') {
        try {
          const img = new window.Image()
          const url = URL.createObjectURL(file)
          await new Promise<void>((resolve) => {
            img.onload = () => {
              meta.dimensions = { width: img.naturalWidth, height: img.naturalHeight }
              details.push({ label: 'Dimensions', value: `${img.naturalWidth} × ${img.naturalHeight}`, icon: <Eye className="w-3.5 h-3.5" /> })
              resolve()
            }
            img.onerror = () => resolve()
            img.src = url
          })
          URL.revokeObjectURL(url)
        } catch { /* skip */ }
      }

      if (cat === 'PDF') {
        details.push({ label: 'Pages', value: '?', icon: <FileText className="w-3.5 h-3.5" /> })
      }

      metaArr.push(meta)
    }

    setMetas(metaArr)
    if (metaArr.length) setSelectedMeta(metaArr[0])
    toast(`Loaded metadata for ${metaArr.length} file${metaArr.length > 1 ? 's' : ''}`)
  }, [toast])

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.files || [])
      if (items.length) {
        e.preventDefault()
        processFiles(items)
        toast(`${items.length} file${items.length > 1 ? 's' : ''} pasted from clipboard`)
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [processFiles, toast])

  const reset = useCallback(() => { setMetas([]); setSelectedMeta(null) }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 15 }} className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Info className="w-5 h-5 text-cyan-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Metadata Viewer</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">
          View detailed file metadata — size, type, dimensions, and more. Paste files from clipboard.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <DropZone onFiles={processFiles} accept="*/*" label="Drop files to view metadata"
          hint="Any file type — details depend on browser support — or Ctrl+V to paste" className="mb-6" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6">
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste files from clipboard</span>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {metas.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="glass rounded-2xl p-4 lg:col-span-1 max-h-[500px] overflow-y-auto">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-stone-400">Files</h3>
                <button onClick={reset} className="text-xs text-stone-500 hover:text-red-400 transition-colors">Clear</button>
              </div>
              <div className="space-y-1">
                {metas.map((meta, i) => (
                  <motion.button key={i} variants={listItem} initial="hidden" animate="show" transition={{ delay: i * 0.04 }}
                    onClick={() => setSelectedMeta(meta)} whileHover={{ x: 4 }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-200 ${
                      selectedMeta === meta ? 'bg-white/5 text-stone-200 border border-white/10' : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.02] border border-transparent'}`}>
                    {getCategoryIcon(meta.category)}
                    <span className="truncate">{meta.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {selectedMeta && (
              <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass rounded-2xl p-5 lg:col-span-2">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                    {getCategoryIcon(selectedMeta.category)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{selectedMeta.name}</h3>
                    <span className="text-xs text-stone-400">{selectedMeta.category} · {formatSize(selectedMeta.size)}</span>
                  </div>
                </div>
                <motion.div variants={{ show: { transition: { staggerChildren: 0.04 } } }} initial="hidden" animate="show"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedMeta.details.map((d, i) => (
                    <motion.div key={i} variants={listItem} className="flex items-center gap-3 bg-white/[0.02] rounded-xl px-4 py-3">
                      <span className="text-stone-500">{d.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-stone-500">{d.label}</p>
                        <p className="text-sm text-stone-200 truncate">{d.value}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                {selectedMeta.dimensions && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="mt-4 p-4 bg-white/[0.02] rounded-xl">
                    <p className="text-xs text-stone-500 mb-1">Megapixels</p>
                    <p className="text-sm text-stone-300">
                      {((selectedMeta.dimensions.width * selectedMeta.dimensions.height) / 1000000).toFixed(2)} MP
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
