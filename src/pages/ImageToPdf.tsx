import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PDFDocument } from 'pdf-lib'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { FileText, Image, Download, X, Loader2, CheckCircle2, ClipboardPaste } from 'lucide-react'

const listItem = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }

export default function ImageToPdf() {
  const [images, setImages] = useState<{ file: File; url: string }[]>([])
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState<{ name: string; blob: Blob; url: string } | null>(null)
  const { toast } = useToast()

  const handleFiles = useCallback((newFiles: File[]) => {
    setImages(prev => [...prev, ...newFiles.map(f => ({ file: f, url: URL.createObjectURL(f) }))])
    setResult(null)
  }, [])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault()
          const blob = items[i].getAsFile()
          if (blob) {
            handleFiles([new File([blob], `pasted.${blob.type.split('/')[1] || 'png'}`, { type: blob.type })])
            toast('Image pasted from clipboard')
          }
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFiles, toast])

  const convert = useCallback(async () => {
    if (!images.length) return
    setProcessing(true)
    try {
      const pdf = await PDFDocument.create()
      for (const { url } of images) {
        const img = new window.Image()
        await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('Failed')); img.src = url })
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        canvas.getContext('2d')!.drawImage(img, 0, 0)
        const jpegBlob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92))
        if (!jpegBlob) continue
        const jpegBytes = await jpegBlob.arrayBuffer()
        const pg = pdf.addPage([img.naturalWidth, img.naturalHeight])
        pg.drawImage(await pdf.embedJpg(jpegBytes), { x: 0, y: 0, width: img.naturalWidth, height: img.naturalHeight })
      }
      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      setResult({ name: 'converted.pdf', blob, url: URL.createObjectURL(blob) })
      toast(`PDF created from ${images.length} image${images.length > 1 ? 's' : ''}`)
    } catch (err) {
      toast('Failed to create PDF', 'error')
    } finally { setProcessing(false) }
  }, [images, toast])

  const removeImage = useCallback((i: number) => {
    setImages(prev => { URL.revokeObjectURL(prev[i].url); return prev.filter((_, idx) => idx !== i) })
    setResult(null)
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 10 }} className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-rose-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Image to PDF</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">Convert one or more images into a single PDF. Paste images from clipboard.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <DropZone onFiles={handleFiles} accept="image/*" label="Drop images to convert to PDF"
          hint="PNG, JPEG, WebP — or Ctrl+V to paste" className="mb-6" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6">
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste</span>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {images.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-5 mb-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">{images.length} image{images.length > 1 ? 's' : ''}</h3>
              <button onClick={() => { images.forEach(i => URL.revokeObjectURL(i.url)); setImages([]); setResult(null) }}
                className="text-xs text-stone-500 hover:text-red-400">Clear all</button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {images.map((img, i) => (
                <motion.div key={i} variants={listItem} initial="hidden" animate="show" transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between bg-stone-800/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-3"><Image className="w-4 h-4 text-stone-500" /><span className="text-sm text-stone-300 truncate">{img.file.name}</span></div>
                  <button onClick={() => removeImage(i)} className="p-1 hover:bg-stone-700 rounded-lg"><X className="w-4 h-4 text-stone-500" /></button>
                </motion.div>
              ))}
            </div>
            <motion.button onClick={convert} disabled={processing} whileHover={{ scale: processing ? 1 : 1.01 }} whileTap={{ scale: processing ? 1 : 0.99 }}
              className="mt-4 w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-600/20">
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" />Creating PDF...</> : <><FileText className="w-4 h-4" />Create PDF</>}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div><p className="text-sm font-semibold text-white">{result.name}</p><p className="text-xs text-stone-400">{(result.blob.size / 1024).toFixed(1)} KB</p></div>
              </div>
<motion.button onClick={() => { const a = document.createElement('a'); a.href = result.url; a.download = result.name; a.click(); toast('PDF downloaded') }}
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-lg shadow-emerald-600/20">
                <Download className="w-4 h-4" />Download
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
