import { useState, useCallback } from 'react'
import DropZone from '../components/DropZone'
import { Info, File, Image, FileText, Film, Music, Archive, Eye, Clock, HardDrive, Hash } from 'lucide-react'

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
    case 'Image': return <Image className="w-5 h-5 text-blue-400" />
    case 'Video': return <Film className="w-5 h-5 text-purple-400" />
    case 'Audio': return <Music className="w-5 h-5 text-emerald-400" />
    case 'PDF': return <FileText className="w-5 h-5 text-red-400" />
    case 'Archive': return <Archive className="w-5 h-5 text-orange-400" />
    default: return <File className="w-5 h-5 text-slate-400" />
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

export default function MetadataViewer() {
  const [metas, setMetas] = useState<FileMeta[]>([])
  const [selectedMeta, setSelectedMeta] = useState<FileMeta | null>(null)

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
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        extension: file.name.split('.').pop()?.toUpperCase() || 'N/A',
        category: cat,
        details,
      }

      // Get image dimensions
      if (cat === 'Image') {
        try {
          const img = new window.Image()
          const url = URL.createObjectURL(file)
          await new Promise<void>((resolve) => {
            img.onload = () => {
              meta.dimensions = { width: img.naturalWidth, height: img.naturalHeight }
              details.push({
                label: 'Dimensions',
                value: `${img.naturalWidth} × ${img.naturalHeight}`,
                icon: <Eye className="w-3.5 h-3.5" />,
              })
              resolve()
            }
            img.onerror = () => resolve()
            img.src = url
          })
          URL.revokeObjectURL(url)
        } catch { /* skip */ }
      }

      // PDF page count estimate
      if (cat === 'PDF') {
        details.push({
          label: 'Pages',
          value: '?',
          icon: <FileText className="w-3.5 h-3.5" />,
        })
      }

      metaArr.push(meta)
    }

    setMetas(metaArr)
    if (metaArr.length) setSelectedMeta(metaArr[0])
  }, [])

  const reset = useCallback(() => {
    setMetas([])
    setSelectedMeta(null)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
            <Info className="w-5 h-5 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Metadata Viewer</h1>
        </div>
        <p className="text-sm text-slate-400 ml-13">
          View detailed file metadata — size, type, dimensions, and more.
        </p>
      </div>

      <DropZone
        onFiles={processFiles}
        accept="*/*"
        label="Drop files to view metadata"
        hint="Any file type — details depend on browser support"
        className="mb-6"
      />

      {metas.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* File list */}
          <div className="glass rounded-2xl p-4 lg:col-span-1 max-h-[500px] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-slate-400">Files</h3>
              <button onClick={reset} className="text-xs text-slate-500 hover:text-red-400 transition-colors">
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {metas.map((meta, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedMeta(meta)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all duration-200 ${
                    selectedMeta === meta
                      ? 'bg-slate-700/50 text-slate-200 border border-slate-600'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  {getCategoryIcon(meta.category)}
                  <span className="truncate">{meta.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          {selectedMeta && (
            <div className="glass rounded-2xl p-5 lg:col-span-2">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center">
                  {getCategoryIcon(selectedMeta.category)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white truncate">{selectedMeta.name}</h3>
                  <span className="text-xs text-slate-400">{selectedMeta.category} · {formatSize(selectedMeta.size)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedMeta.details.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3">
                    <span className="text-slate-500">{d.icon}</span>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">{d.label}</p>
                      <p className="text-sm text-slate-200 truncate">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedMeta.dimensions && (
                <div className="mt-4 p-4 bg-slate-800/30 rounded-xl">
                  <p className="text-xs text-slate-500 mb-1">Megapixels</p>
                  <p className="text-sm text-slate-300">
                    {((selectedMeta.dimensions.width * selectedMeta.dimensions.height) / 1000000).toFixed(2)} MP
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
