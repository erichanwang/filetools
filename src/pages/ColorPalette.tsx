import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { Palette, ClipboardPaste, Droplets } from 'lucide-react'

interface Swatch { hex: string; pct: number }

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')
}

function hexToRgb(hex: string) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i)
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : null
}

function extractPalette(imageData: ImageData, count: number): Swatch[] {
  const data = imageData.data
  const colorMap = new Map<string, number>()
  const step = Math.max(1, Math.floor(data.length / 4 / 50000))
  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a < 128) continue
    const hex = rgbToHex(r, g, b)
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1)
  }
  const total = Array.from(colorMap.values()).reduce((a, b) => a + b, 0)
  const sorted = Array.from(colorMap.entries()).sort((a, b) => b[1] - a[1])

  // K-means-like color distance filtering
  const result: Swatch[] = []
  for (const [hex, cnt] of sorted) {
    const rgb = hexToRgb(hex)
    if (!rgb) continue
    const tooClose = result.some(s => {
      const sr = hexToRgb(s.hex)
      if (!sr) return false
      const dr = rgb.r - sr.r, dg = rgb.g - sr.g, db = rgb.b - sr.b
      return Math.sqrt(dr * dr + dg * dg + db * db) < 50
    })
    if (!tooClose) result.push({ hex, pct: Math.round((cnt / total) * 1000) / 10 })
    if (result.length >= count) break
  }
  return result
}

export default function ColorPalette() {
  const [source, setSource] = useState<string | null>(null)
  const [palette, setPalette] = useState<Swatch[]>([])
  const [count, setCount] = useState(8)
  const [copiedColor, setCopiedColor] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFiles = useCallback((files: File[]) => {
    if (!files.length) return
    if (source) URL.revokeObjectURL(source)
    const url = URL.createObjectURL(files[0])
    setSource(url)
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const maxDim = 512
      let w = img.naturalWidth, h = img.naturalHeight
      if (w > maxDim || h > maxDim) { const r = Math.min(maxDim / w, maxDim / h); w = Math.round(w * r); h = Math.round(h * r) }
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      const imageData = ctx.getImageData(0, 0, w, h)
      setPalette(extractPalette(imageData, count))
    }
    img.src = url
  }, [source, count])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault()
          const blob = items[i].getAsFile()
          if (blob) { handleFiles([new File([blob], 'pasted.png', { type: 'image/png' })]); toast('Image pasted') }
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFiles, toast])

  const copyHex = useCallback((hex: string) => {
    navigator.clipboard.writeText(hex)
    setCopiedColor(hex)
    setTimeout(() => setCopiedColor(null), 1500)
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 15 }} className="w-10 h-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
            <Palette className="w-5 h-5 text-pink-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Color Palette Extractor</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">Extract dominant colors from any image. Paste from clipboard.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <DropZone onFiles={handleFiles} accept="image/*" multiple={false} label="Drop an image to extract colors"
          hint="PNG, JPEG, WebP — or Ctrl+V to paste" className="mb-6" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6">
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste</span>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {source && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-stone-400">Source</h3>
                <select value={count} onChange={e => setCount(Number(e.target.value))}
                  className="text-xs px-2 py-1 rounded-lg bg-stone-800 border border-stone-700 text-stone-300">
                  {[4, 6, 8, 10, 12].map(n => <option key={n} value={n}>{n} colors</option>)}
                </select>
              </div>
              <img src={source} alt="Source" className="max-h-64 rounded-xl object-contain" />
            </div>

            {palette.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
                <h3 className="text-xs font-medium text-stone-400 mb-4">Dominant Colors</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {palette.map((s, i) => (
                    <motion.button key={s.hex} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                      onClick={() => copyHex(s.hex)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="text-left rounded-xl overflow-hidden border border-stone-700 hover:border-white/20 transition-all">
                      <div className="h-16" style={{ background: s.hex }} />
                      <div className="p-2.5 bg-stone-800/80">
                        <p className="text-sm font-mono text-white">{s.hex.toUpperCase()}</p>
                        <p className="text-[10px] text-stone-400 flex items-center gap-1">
                          <Droplets className="w-2.5 h-2.5" />{s.pct}%
                          {copiedColor === s.hex && <span className="text-emerald-400 ml-1">Copied!</span>}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
