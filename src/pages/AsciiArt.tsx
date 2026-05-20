import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import CopyButton from '../components/CopyButton'
import { Monitor, Download, ClipboardPaste, SlidersHorizontal } from 'lucide-react'

const CHARS = ['@', '#', 'S', '%', '?', '*', '+', ';', ':', ',', '.', ' ']
const CHARS2 = ['█', '▓', '▒', '░', ' ']

export default function AsciiArt() {
  const [source, setSource] = useState<{ file: File; url: string } | null>(null)
  const [ascii, setAscii] = useState('')
  const [width, setWidth] = useState(80)
  const [inverted, setInverted] = useState(false)

  const { toast } = useToast()

  const handleFiles = useCallback((files: File[]) => {
    if (!files.length) return
    if (source) URL.revokeObjectURL(source.url)
    const file = files[0]
    setSource({ file, url: URL.createObjectURL(file) })

    const img = new window.Image()
    img.onload = () => {
      const h = Math.round(width * (img.naturalHeight / img.naturalWidth) * 0.45)
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, h)
      const data = ctx.getImageData(0, 0, width, h).data
      let result = ''
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4
          const gray = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
          const ci = inverted ? Math.floor(gray * (CHARS.length - 1)) : Math.floor((1 - gray) * (CHARS.length - 1))
          result += CHARS2[Math.min(ci, CHARS2.length - 1)]
        }
        result += '\n'
      }
      setAscii(result)
    }
    img.src = URL.createObjectURL(file)
  }, [source, width, inverted])

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



  const downloadAscii = useCallback(() => {
    const blob = new Blob([ascii], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = source!.file.name.replace(/\.[^.]+$/, '.txt'); a.click()
    URL.revokeObjectURL(url); toast('ASCII art downloaded')
  }, [ascii, source, toast])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 15 }} className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-green-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">ASCII Art</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">Convert images to ASCII art. Adjust width and inversion. Paste from clipboard.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5 mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-stone-400 mb-2 flex items-center gap-1.5"><SlidersHorizontal className="w-3 h-3" />Width: {width} chars</label>
            <input type="range" min={20} max={200} value={width} onChange={e => setWidth(Number(e.target.value))} className="w-full" />
          </div>
          <div className="flex items-end pb-1">
            <motion.button onClick={() => { setInverted(!inverted); if (source) handleFiles([source.file]) }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                inverted ? 'bg-green-600 text-white' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}>Invert</motion.button>
          </div>
        </div>
      </motion.div>

      {!source ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <DropZone onFiles={handleFiles} accept="image/*" multiple={false} label="Drop an image for ASCII art"
            hint="PNG, JPEG — or Ctrl+V to paste" className="mb-6" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6">
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste</span>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass rounded-2xl p-4 flex items-center gap-3">
            <img src={source.url} alt="Source" className="w-12 h-12 rounded-lg object-cover" />
            <span className="text-sm text-stone-300 truncate">{source.file.name}</span>
            <button onClick={() => { URL.revokeObjectURL(source.url); setSource(null); setAscii('') }}
              className="ml-auto text-xs text-stone-500 hover:text-red-400">Remove</button>
          </div>

          {ascii && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-stone-400">ASCII Art</h3>
                <div className="flex gap-2">
                  <CopyButton text={ascii} label="Copy" />
                  <motion.button onClick={downloadAscii} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium">
                    <Download className="w-3 h-3" />Download
                  </motion.button>
                </div>
              </div>
              <div className="bg-stone-900 rounded-xl p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
                <pre className="text-[6px] leading-[6px] font-mono text-green-400 whitespace-pre select-all">{ascii}</pre>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
