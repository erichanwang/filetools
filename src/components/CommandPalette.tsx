import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Shuffle, Eraser, Zap, Palette, FileText, Eye,
  FileType, Pencil, FileImage, FileJson, QrCode,
  SwatchBook, Camera, Fingerprint, Code, Table,
  Shield, Keyboard, Type, ArrowLeftRight, Crop
} from 'lucide-react'

interface Tool {
  name: string
  path: string
  icon: React.FC<{ className?: string }>
  category: string
}

const tools: Tool[] = [
  { name: 'File Converter', path: '/file-converter', icon: Shuffle, category: 'Image' },
  { name: 'Background Remover', path: '/background-remover', icon: Eraser, category: 'Image' },
  { name: 'Image Compressor', path: '/image-compressor', icon: Zap, category: 'Image' },
  { name: 'Image Filters', path: '/image-filters', icon: Palette, category: 'Image' },
  { name: 'Image Cropper', path: '/image-cropper', icon: Crop, category: 'Image' },
  { name: 'Image to PDF', path: '/image-to-pdf', icon: FileImage, category: 'Image' },
  { name: 'ASCII Art', path: '/ascii-art', icon: Type, category: 'Image' },
  { name: 'Color Palette', path: '/color-palette', icon: SwatchBook, category: 'Image' },
  { name: 'PDF Tools', path: '/pdf-operations', icon: FileText, category: 'Document' },
  { name: 'OCR', path: '/ocr', icon: Eye, category: 'Document' },
  { name: 'Metadata Viewer', path: '/metadata-viewer', icon: FileType, category: 'Document' },
  { name: 'Batch Rename', path: '/batch-rename', icon: Pencil, category: 'Document' },
  { name: 'EXIF Tool', path: '/exif-tool', icon: Camera, category: 'Document' },
  { name: 'File Checksum', path: '/file-checksum', icon: Fingerprint, category: 'Document' },
  { name: 'JSON Tool', path: '/json-tool', icon: FileJson, category: 'Data' },
  { name: 'CSV Viewer', path: '/csv-viewer', icon: Table, category: 'Data' },
  { name: 'JWT Decoder', path: '/jwt-decoder', icon: Shield, category: 'Data' },
  { name: 'Text Tools', path: '/text-tools', icon: Type, category: 'Data' },
  { name: 'Base64', path: '/base64', icon: Code, category: 'Data' },
  { name: 'QR Generator', path: '/qr-generator', icon: QrCode, category: 'Generator' },
  { name: 'Color Converter', path: '/color-converter', icon: Palette, category: 'Generator' },
  { name: 'Unit Converter', path: '/unit-converter', icon: ArrowLeftRight, category: 'Generator' },
  { name: 'Password Generator', path: '/password-generator', icon: Keyboard, category: 'Generator' },
  { name: 'Home', path: '/', icon: Search, category: 'Navigation' },
]

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!query.trim()) return tools
    const q = query.toLowerCase()
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.path.toLowerCase().includes(q)
    )
  }, [query])

  // Clamp index
  const safeIndex = Math.min(index, Math.max(0, filtered.length - 1))

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((p) => {
          if (!p) {
            setQuery('')
            setIndex(0)
          }
          return !p
        })
      }
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const tool = filtered[safeIndex]
      if (tool) {
        navigate(tool.path)
        setOpen(false)
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -12 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-lg"
          >
            <div className="mx-4 glass rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
                <Search className="w-5 h-5 text-white/20 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value)
                    setIndex(0)
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search tools..."
                  aria-label="Search tools"
                  className="flex-1 bg-transparent text-white text-sm placeholder-white/20 outline-none"
                />
                <kbd className="text-[10px] text-white/15 bg-white/5 px-1.5 py-0.5 rounded font-mono">
                  ESC
                </kbd>
              </div>

              {/* Results */}
              <div className="max-h-72 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-white/20 text-sm">
                    No tools found
                  </div>
                ) : (
                  filtered.map((tool, i) => (
                    <button
                      key={tool.path}
                      onClick={() => {
                        navigate(tool.path)
                        setOpen(false)
                      }}
                      onMouseEnter={() => setIndex(i)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all text-left ${
                        i === safeIndex
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <tool.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1">{tool.name}</span>
                      <span className="text-[10px] text-white/15 font-mono">{tool.category}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
