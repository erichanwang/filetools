import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { Shrink, Download, X, Image, Loader2, Maximize2, FileImage, ClipboardPaste, FileType } from 'lucide-react'

const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export default function ImageCompressor() {
  const [files, setFiles] = useState<{ file: File; url: string }[]>([])
  const [quality, setQuality] = useState(80)
  const [maxWidth, setMaxWidth] = useState(16384)
  const [maxHeight, setMaxHeight] = useState(16384)
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg')
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<{ name: string; originalSize: number; compressedSize: number; url: string }[]>([])
  const { toast } = useToast()

  const handleFiles = useCallback((newFiles: File[]) => {
    const mapped = newFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) }))
    setFiles((prev) => [...prev, ...mapped])
    setResults([])
  }, [])

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          e.preventDefault()
          const blob = item.getAsFile()
          if (blob) {
            const file = new File([blob], `pasted-image.${blob.type.split('/')[1] || 'png'}`, { type: blob.type })
            handleFiles([file])
            toast('Image pasted from clipboard')
          }
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFiles, toast])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].url)
      return prev.filter((_, i) => i !== index)
    })
    setResults([])
  }, [])

  const compress = useCallback(async () => {
    if (!files.length) return
    setProcessing(true)
    setResults([])

    const resultsArr: typeof results = []

    for (const { file, url } of files) {
      try {
        const img = new window.Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new Error('Failed to load'))
          img.src = url
        })

        let w = img.naturalWidth
        let h = img.naturalHeight

        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h)
          w = Math.round(w * ratio)
          h = Math.round(h * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, format, quality / 100)
        })

        if (blob) {
          const ext = format.split('/')[1] || 'jpg'
          const name = file.name.replace(/\.[^.]+$/, `_compressed.${ext}`)
          resultsArr.push({
            name,
            originalSize: file.size,
            compressedSize: blob.size,
            url: URL.createObjectURL(blob),
          })
        }
      } catch {
        // skip failed files
      }
    }

    setResults(resultsArr)
    setProcessing(false)

    const totalSaved = resultsArr.reduce((acc, r) => acc + (r.originalSize - r.compressedSize), 0)
    toast(`Compressed ${resultsArr.length} file${resultsArr.length > 1 ? 's' : ''} — saved ${(totalSaved / 1024).toFixed(1)} KB`)
  }, [files, quality, maxWidth, maxHeight, format, toast])

  const downloadAll = useCallback(() => {
    results.forEach((r) => {
      const a = document.createElement('a')
      a.href = r.url
      a.download = r.name
      a.click()
    })
    toast(`Downloading ${results.length} file${results.length > 1 ? 's' : ''}`)
  }, [results, toast])

  const downloadOne = useCallback((result: typeof results[number]) => {
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.name
    a.click()
  }, [])

  const totalSavings = results.reduce((acc, r) => acc + (r.originalSize - r.compressedSize), 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center"
          >
            <Shrink className="w-5 h-5 text-emerald-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Image Compressor</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">
          Compress images while preserving full native resolution. Only resizes if dimensions exceed the limits below. Paste images from clipboard.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-5 mb-6 space-y-5"
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-stone-400">Quality</label>
            <span className="text-xs font-mono font-semibold text-emerald-400">{quality}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-stone-600 mt-1">
            <span>Smaller</span>
            <span>{format === 'image/png' ? 'N/A for PNG' : 'Better'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-2">
              <FileType className="w-3 h-3 inline mr-1" />
              Output Format
            </label>
            <select value={format} onChange={e => setFormat(e.target.value as typeof format)}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors">
              <option value="image/jpeg">JPEG — smaller, lossy</option>
              <option value="image/png">PNG — lossless, larger</option>
              <option value="image/webp">WebP — best compression</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-2">
              <Maximize2 className="w-3 h-3 inline mr-1" />
              Max Width (px)<span className="text-[10px] text-stone-500 ml-1">(default: no limit)</span>
            </label>
            <input
              type="number"
              value={maxWidth}
              onChange={(e) => setMaxWidth(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 mb-2">
              <Maximize2 className="w-3 h-3 inline mr-1" />
              Max Height (px)<span className="text-[10px] text-stone-500 ml-1">(default: no limit)</span>
            </label>
            <input
              type="number"
              value={maxHeight}
              onChange={(e) => setMaxHeight(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <DropZone
          onFiles={handleFiles}
          accept="image/*"
          label="Drop images to compress"
          hint="PNG, JPEG, WebP — multiple files supported — or Ctrl+V to paste"
          className="mb-6"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6"
        >
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste images from clipboard</span>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass rounded-2xl p-5 mb-6 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">
                {files.length} image{files.length > 1 ? 's' : ''}
              </h3>
              <button
                onClick={() => { files.forEach((f) => URL.revokeObjectURL(f.url)); setFiles([]); setResults([]) }}
                className="text-xs text-stone-500 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>
            <motion.div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((f, i) => (
                <motion.div
                  key={i}
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between bg-stone-800/50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Image className="w-4 h-4 text-stone-500 flex-shrink-0" />
                    <span className="text-sm text-stone-300 truncate">{f.file.name}</span>
                    <span className="text-xs text-stone-600 flex-shrink-0">
                      {(f.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button onClick={() => removeFile(i)} className="p-1 hover:bg-stone-700 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-stone-500" />
                  </button>
                </motion.div>
              ))}
            </motion.div>

            <motion.button
              onClick={compress}
              disabled={processing || !files.length}
              whileHover={{ scale: processing ? 1 : 1.01 }}
              whileTap={{ scale: processing ? 1 : 0.99 }}
              className="mt-4 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Compressing...
                </>
              ) : (
                <>
                  <Shrink className="w-4 h-4" />
                  Compress {files.length} image{files.length > 1 ? 's' : ''}
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Compressed</h3>
                <p className="text-xs text-emerald-400">
                  Saved {(totalSavings / 1024).toFixed(1)} KB ({results.length} file{results.length > 1 ? 's' : ''})
                </p>
              </div>
              <motion.button
                onClick={downloadAll}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all duration-200 shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" />
                Download all
              </motion.button>
            </div>
            <motion.div className="space-y-2">
              {results.map((r, i) => {
                const pct = Math.round((1 - r.compressedSize / r.originalSize) * 100)
                return (
                  <motion.div
                    key={i}
                    variants={listItem}
                    initial="hidden"
                    animate="show"
                    transition={{ delay: i * 0.04 }}
                    className="flex items-center justify-between bg-stone-800/50 rounded-xl px-4 py-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileImage className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-stone-300 truncate">{r.name}</p>
                        <p className="text-xs text-stone-500">
                          {(r.originalSize / 1024).toFixed(1)} KB → {(r.compressedSize / 1024).toFixed(1)} KB
                          <span className="text-emerald-400 ml-2">-{pct}%</span>
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => downloadOne(r)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 hover:bg-stone-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                    </motion.button>
                  </motion.div>
                )
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
