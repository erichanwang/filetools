import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { Scissors, Download, Image, RefreshCw, Loader2, ClipboardPaste, Feather, Cpu } from 'lucide-react'

export default function BackgroundRemover() {
  const [source, setSource] = useState<{ file: File; url: string } | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<{ status: string; current: number; total: number } | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [model, setModel] = useState<'isnet_quint8' | 'isnet_fp16' | 'isnet'>('isnet_quint8')
  const [edgeFeather, setEdgeFeather] = useState(1)
  const rawResultRef = useRef<Blob | null>(null)
  const { toast } = useToast()

  const processImage = useCallback((file: File) => {
    if (source) URL.revokeObjectURL(source.url)
    if (result) URL.revokeObjectURL(result)
    setSource({ file, url: URL.createObjectURL(file) })
    setResult(null)
    setError(null)
    setDownloadProgress(null)
    rawResultRef.current = null
  }, [source, result])

  const handleFiles = useCallback((files: File[]) => {
    if (files.length) processImage(files[0])
  }, [processImage])

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
            processImage(file)
            toast('Image pasted from clipboard')
          }
          break
        }
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [processImage, toast])

  // Apply edge feathering (blur alpha channel)
  const applyEdgeFeather = useCallback(async (blob: Blob, featherRadius: number): Promise<Blob> => {
    if (featherRadius < 1) return blob

    const img = new window.Image()
    const url = URL.createObjectURL(blob)
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Failed to load result'))
      img.src = url
    })

    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    const w = canvas.width
    const h = canvas.height

    // Simple box blur on alpha channel
    const alphaCopy = new Uint8Array(data.length / 4)
    for (let i = 0; i < alphaCopy.length; i++) {
      alphaCopy[i] = data[i * 4 + 3]
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let sum = 0
        let count = 0
        for (let dy = -featherRadius; dy <= featherRadius; dy++) {
          for (let dx = -featherRadius; dx <= featherRadius; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              sum += alphaCopy[ny * w + nx]
              count++
            }
          }
        }
        data[(y * w + x) * 4 + 3] = Math.round(sum / count)
      }
    }

    ctx.putImageData(imageData, 0, 0)

    return new Promise((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('Failed to apply edge feather'))
      }, 'image/png')
    })
  }, [])

  const removeBg = useCallback(async () => {
    if (!source) return
    setProcessing(true)
    setError(null)
    setDownloadProgress(null)
    rawResultRef.current = null

    try {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = source.url
      })

      const maxDim = 8192
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)

      const imageBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to convert image'))
        }, 'image/png')
      })

      const { removeBackground } = await import('@imgly/background-removal')

      const blob = await removeBackground(imageBlob, {
        model,
        output: { format: 'image/png' },
        progress: (status: string, current: number, total: number) => {
          setDownloadProgress({
            status: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            current,
            total,
          })
        },
      })

      rawResultRef.current = blob

      // Apply edge feathering if needed
      const finalBlob = edgeFeather > 0 ? await applyEdgeFeather(blob, edgeFeather) : blob
      const url = URL.createObjectURL(finalBlob)
      setResult(url)
      toast('Background removed successfully')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Background removal failed'
      setError(message)
      setResult(null)
      toast(message, 'error')
    } finally {
      setProcessing(false)
    }
  }, [source, toast, model, edgeFeather, applyEdgeFeather])

  const handleEdgeFeatherChange = useCallback(async (value: number) => {
    setEdgeFeather(value)
    if (rawResultRef.current) {
      if (result) URL.revokeObjectURL(result)
      const featheredBlob = value > 0 ? await applyEdgeFeather(rawResultRef.current, value) : rawResultRef.current
      setResult(URL.createObjectURL(featheredBlob))
    }
  }, [result, applyEdgeFeather])

  const download = useCallback(() => {
    if (!result || !source) return
    const a = document.createElement('a')
    a.href = result
    const name = source.file.name.replace(/\.[^.]+$/, '_nobg.png')
    a.download = name
    a.click()
    toast('Image downloaded')
  }, [result, source, toast])

  const reset = useCallback(() => {
    if (source) URL.revokeObjectURL(source.url)
    if (result) URL.revokeObjectURL(result)
    setSource(null)
    setResult(null)
    setError(null)
    setDownloadProgress(null)
    rawResultRef.current = null
  }, [source, result])

  const progressPct = downloadProgress ? Math.round((downloadProgress.current / downloadProgress.total) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            whileHover={{ rotate: -10 }}
            className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center"
          >
            <Scissors className="w-5 h-5 text-rose-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Background Remover</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">
          Remove image backgrounds using AI — all processing happens locally. Up to 8K native resolution. Paste images from clipboard.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!source ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
          >
            <DropZone
              onFiles={handleFiles}
              accept="image/*"
              multiple={false}
              label="Drop an image here"
              hint="PNG, JPEG, WebP — first load downloads the AI model (~80MB). You can also Ctrl+V to paste!"
              className="mb-6"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 text-xs text-stone-600 mt-3"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste an image from clipboard</span>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="editor"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Advanced settings */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4"
            >
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-200 transition-colors"
              >
                <Cpu className="w-3.5 h-3.5" />
                Advanced Settings
                <motion.span
                  animate={{ rotate: showAdvanced ? 180 : 0 }}
                  className="text-[10px]"
                >
                  ▼
                </motion.span>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 pt-4 border-t border-stone-800/50 space-y-4">
                      {/* Model selector */}
                      <div>
                        <label className="block text-xs font-medium text-stone-400 mb-2">AI Model</label>
                        <div className="flex gap-2">
                          {([
                            { key: 'isnet_quint8' as const, label: 'Fast (quint8)', desc: 'Smallest, fastest download' },
                            { key: 'isnet_fp16' as const, label: 'Balanced (fp16)', desc: 'Better quality, ~160MB' },
                            { key: 'isnet' as const, label: 'Best (fp32)', desc: 'Highest quality, ~320MB' },
                          ]).map((m) => (
                            <motion.button
                              key={m.key}
                              onClick={() => setModel(m.key)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`flex-1 p-3 rounded-xl text-left transition-all duration-200 ${
                                model === m.key
                                  ? 'bg-rose-600/30 border border-rose-500/50 text-white'
                                  : 'bg-stone-800/50 border border-stone-700/50 text-stone-400 hover:text-stone-200'
                              }`}
                            >
                              <p className="text-xs font-medium">{m.label}</p>
                              <p className="text-[10px] opacity-70 mt-0.5">{m.desc}</p>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Edge feather */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-stone-400 flex items-center gap-1.5">
                            <Feather className="w-3 h-3" />
                            Edge Refinement
                          </label>
                          <span className="text-xs font-mono text-rose-400">{edgeFeather}px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={8}
                          value={edgeFeather}
                          onChange={(e) => handleEdgeFeatherChange(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-[10px] text-stone-600 mt-1">
                          <span>Sharp</span>
                          <span>Smooth</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Original */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-2xl p-4"
              >
                <h3 className="text-xs font-medium text-stone-400 mb-3">Original</h3>
                <div className="aspect-square rounded-xl overflow-hidden bg-stone-900/50 flex items-center justify-center">
                  <img
                    src={source.url}
                    alt="Original"
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </motion.div>

              {/* Result */}
              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="glass rounded-2xl p-4"
              >
                <h3 className="text-xs font-medium text-stone-400 mb-3">Background Removed</h3>
                <div
                  className="aspect-square rounded-xl overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundImage: 'repeating-conic-gradient(#292524 0% 25%, #1c1917 0% 50%)',
                    backgroundSize: '20px 20px',
                  }}
                >
                  {processing ? (
                    <div className="flex flex-col items-center gap-3 px-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="w-8 h-8 text-rose-400" />
                      </motion.div>
                      {downloadProgress ? (
                        <div className="text-center w-full">
                          <p className="text-xs text-stone-300 mb-2">{downloadProgress.status}</p>
                          <div className="w-full max-w-48 h-2 bg-stone-700 rounded-full overflow-hidden mx-auto">
                            <motion.div
                              className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full"
                              animate={{ width: `${progressPct}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <p className="text-[10px] text-stone-500 mt-1">
                            {progressPct > 0 ? `${progressPct}%` : 'Starting...'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-stone-400">Processing...</p>
                      )}
                    </div>
                  ) : result ? (
                    <motion.img
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={result}
                      alt="Background removed"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : error ? (
                    <div className="text-center p-4">
                      <p className="text-sm text-red-400 mb-2">Error</p>
                      <p className="text-xs text-stone-400">{error}</p>
                    </div>
                  ) : (
                    <Image className="w-12 h-12 text-stone-700" />
                  )}
                </div>
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3"
            >
              <motion.button
                onClick={removeBg}
                disabled={processing || !source}
                whileHover={{ scale: processing ? 1 : 1.03 }}
                whileTap={{ scale: processing ? 1 : 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-rose-600/20"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Scissors className="w-4 h-4" />
                    Remove Background
                  </>
                )}
              </motion.button>
              {result && (
                <motion.button
                  onClick={download}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  Download
                </motion.button>
              )}
              <motion.button
                onClick={reset}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                New Image
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
