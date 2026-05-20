import { useState, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { toCanvas as qrToCanvas } from 'qrcode'
import { useToast } from '../components/Toast'
import { QrCode, Download, Copy, Type, Palette, RefreshCw, FileImage } from 'lucide-react'

export default function QrGenerator() {
  const [text, setText] = useState('')
  const [fg, setFg] = useState('#ffffff')
  const [bg, setBg] = useState('#1c1917')
  const [size, setSize] = useState(300)
  const [generated, setGenerated] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { toast } = useToast()

  const generate = useCallback(async () => {
    if (!text.trim() || !canvasRef.current) return
    try {
      await qrToCanvas(canvasRef.current, text.trim(), {
        width: size,
        margin: 2,
        color: { dark: fg + 'ff', light: bg + 'ff' },
      })
      setGenerated(true)
    } catch {
      toast('Failed to generate QR code', 'error')
    }
  }, [text, size, fg, bg, toast])

  const download = useCallback(() => {
    if (!canvasRef.current) return
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'qrcode.png'; a.click()
      URL.revokeObjectURL(url)
      toast('QR code downloaded')
    }, 'image/png')
  }, [toast])

  const downloadSvg = useCallback(() => {
    if (!canvasRef.current || !generated) return
    // Convert canvas to base64 PNG and embed in SVG wrapper
    const dataUrl = canvasRef.current.toDataURL('image/png')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <image width="${size}" height="${size}" xlink:href="${dataUrl}"/>
</svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'qrcode.svg'; a.click()
    URL.revokeObjectURL(url)
    toast('SVG downloaded')
  }, [canvasRef, generated, size, toast])

  const copyDataUrl = useCallback(() => {
    if (!canvasRef.current) return
    navigator.clipboard.writeText(canvasRef.current.toDataURL('image/png'))
    toast('Copied as data URL')
  }, [toast])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 20 }} className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-violet-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">QR Code Generator</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">Generate customizable QR codes. Download as PNG or SVG. Copy as data URL.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-5">
          <div className="glass rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-400 mb-2 flex items-center gap-1.5"><Type className="w-3 h-3" />Content</label>
              <textarea value={text} onChange={e => { setText(e.target.value); setGenerated(false) }}
                placeholder="Enter text, URL, or data to encode..." rows={4}
                className="w-full px-4 py-3 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-2 flex items-center gap-1.5"><Palette className="w-3 h-3" />Foreground</label>
                <input type="color" value={fg} onChange={e => { setFg(e.target.value); setGenerated(false) }}
                  className="w-full h-10 rounded-xl bg-stone-800 border border-stone-700 cursor-pointer" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-2 flex items-center gap-1.5"><Palette className="w-3 h-3" />Background</label>
                <input type="color" value={bg} onChange={e => { setBg(e.target.value); setGenerated(false) }}
                  className="w-full h-10 rounded-xl bg-stone-800 border border-stone-700 cursor-pointer" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-400 mb-2">Size: {size}px</label>
              <input type="range" min={128} max={1024} value={size} onChange={e => { setSize(Number(e.target.value)); setGenerated(false) }} className="w-full" />
            </div>
          </div>

          <motion.button onClick={generate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20">
            <QrCode className="w-4 h-4" />Generate QR Code
          </motion.button>
        </motion.div>

        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass rounded-2xl p-5 flex flex-col items-center justify-center min-h-[400px] gap-4">
          <canvas ref={canvasRef} className={`rounded-xl ${generated ? '' : 'hidden'}`} style={{ background: bg }} />
          {!generated && (
            <div className="flex flex-col items-center gap-3 text-center">
              <QrCode className="w-12 h-12 text-stone-700" />
              <p className="text-xs text-stone-500">Enter content and click Generate</p>
            </div>
          )}
          {generated && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 flex-wrap justify-center">
              <motion.button onClick={download} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium">
                <Download className="w-3.5 h-3.5" />PNG
              </motion.button>
              <motion.button onClick={downloadSvg} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-medium">
                <FileImage className="w-3.5 h-3.5" />SVG
              </motion.button>
              <motion.button onClick={copyDataUrl} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-700 text-stone-300 text-xs font-medium">
                <Copy className="w-3.5 h-3.5" />Copy
              </motion.button>
              <motion.button onClick={() => setGenerated(false)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-800 text-stone-400 text-xs font-medium">
                <RefreshCw className="w-3.5 h-3.5" />Reset
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
