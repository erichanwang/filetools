import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { SlidersHorizontal, Download, RefreshCw, Undo2, Contrast, Sun, Droplets, Sparkles, ClipboardPaste, Columns } from 'lucide-react'

interface FilterSettings {
  brightness: number
  contrast: number
  saturation: number
  blur: number
  grayscale: number
  sepia: number
  hueRotate: number
  opacity: number
}

const defaults: FilterSettings = {
  brightness: 100, contrast: 100, saturation: 100, blur: 0,
  grayscale: 0, sepia: 0, hueRotate: 0, opacity: 100,
}

const filters = [
  { key: 'brightness' as const, icon: Sun, label: 'Brightness', min: 0, max: 200, unit: '%' },
  { key: 'contrast' as const, icon: Contrast, label: 'Contrast', min: 0, max: 200, unit: '%' },
  { key: 'saturation' as const, icon: Droplets, label: 'Saturation', min: 0, max: 200, unit: '%' },
  { key: 'blur' as const, icon: Sparkles, label: 'Blur', min: 0, max: 20, unit: 'px' },
  { key: 'grayscale' as const, icon: SlidersHorizontal, label: 'Grayscale', min: 0, max: 100, unit: '%' },
  { key: 'sepia' as const, icon: SlidersHorizontal, label: 'Sepia', min: 0, max: 100, unit: '%' },
  { key: 'hueRotate' as const, icon: SlidersHorizontal, label: 'Hue Rotate', min: 0, max: 360, unit: '°' },
  { key: 'opacity' as const, icon: SlidersHorizontal, label: 'Opacity', min: 0, max: 100, unit: '%' },
]

const presets = [
  { name: 'Normal', values: { ...defaults } },
  { name: 'Vintage', values: { ...defaults, sepia: 50, contrast: 90, brightness: 110, saturation: 80 } },
  { name: 'Cool', values: { ...defaults, hueRotate: 200, saturation: 130 } },
  { name: 'Warm', values: { ...defaults, hueRotate: 330, saturation: 130, brightness: 110 } },
  { name: 'B&W', values: { ...defaults, grayscale: 100, contrast: 120 } },
  { name: 'Dramatic', values: { ...defaults, contrast: 150, brightness: 80, saturation: 120 } },
  { name: 'Fade', values: { ...defaults, brightness: 120, contrast: 80, saturation: 60 } },
  { name: 'Sharp', values: { ...defaults, contrast: 130, brightness: 105, saturation: 110 } },
]

export default function ImageFilters() {
  const [source, setSource] = useState<{ file: File; url: string } | null>(null)
  const [settings, setSettings] = useState<FilterSettings>({ ...defaults })
  const [showOriginal, setShowOriginal] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const { toast } = useToast()

  const handleFiles = useCallback((files: File[]) => {
    if (files.length) {
      if (source) URL.revokeObjectURL(source.url)
      setSource({ file: files[0], url: URL.createObjectURL(files[0]) })
      setSettings({ ...defaults })
    }
  }, [source])

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

  const set = useCallback((key: keyof FilterSettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setSettings({ ...defaults }), [])

  const applyPreset = useCallback((preset: typeof presets[number]) => {
    setSettings({ ...preset.values })
  }, [])

  const filterStyle = `brightness(${settings.brightness}%) contrast(${settings.contrast}%) saturate(${settings.saturation}%) blur(${settings.blur}px) grayscale(${settings.grayscale}%) sepia(${settings.sepia}%) hue-rotate(${settings.hueRotate}deg) opacity(${settings.opacity}%)`

  const download = useCallback(() => {
    if (!source || !imgRef.current) return
    const canvas = document.createElement('canvas')
    const img = imgRef.current
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const ctx = canvas.getContext('2d')!
    ctx.filter = filterStyle
    ctx.drawImage(img, 0, 0)

    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = source.file.name.replace(/\.[^.]+$/, '_filtered.png')
      a.click()
      URL.revokeObjectURL(url)
      toast('Filtered image downloaded')
    }, 'image/png')
  }, [source, filterStyle, toast])

  const clearSource = useCallback(() => {
    if (source) URL.revokeObjectURL(source.url)
    setSource(null)
    setSettings({ ...defaults })
  }, [source])

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.5 }}
            className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"
          >
            <SlidersHorizontal className="w-5 h-5 text-orange-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Image Filters</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">
          Adjust brightness, contrast, saturation, and more. Apply creative presets. Paste images from clipboard.
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
              label="Drop an image to edit"
              hint="PNG, JPEG, WebP — or Ctrl+V to paste"
              className="mb-6"
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6"
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
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="glass rounded-2xl p-4"
              >
                <h3 className="text-xs font-medium text-stone-400 mb-3">Preview</h3>
                <div className="aspect-square rounded-xl overflow-hidden bg-stone-900/50 flex items-center justify-center relative group">
                  <img
                    ref={imgRef}
                    src={source.url}
                    alt="Preview"
                    className="max-w-full max-h-full object-contain transition-all duration-300"
                    style={{ filter: showOriginal ? 'none' : filterStyle }}
                  />
                  <button
                    onMouseDown={() => setShowOriginal(true)}
                    onMouseUp={() => setShowOriginal(false)}
                    onMouseLeave={() => setShowOriginal(false)}
                    onTouchStart={() => setShowOriginal(true)}
                    onTouchEnd={() => setShowOriginal(false)}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900/80 border border-stone-700/50 text-xs text-stone-400 hover:text-stone-200 transition-colors backdrop-blur-sm"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    {showOriginal ? 'Original' : 'Hold to compare'}
                  </button>
                </div>
              </motion.div>

              <motion.div
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-2xl p-4 overflow-y-auto max-h-[600px]"
              >
                <div className="mb-5">
                  <h3 className="text-xs font-medium text-stone-400 mb-3">Presets</h3>
                  <div className="flex flex-wrap gap-2">
                    {presets.map((p) => (
                      <motion.button
                        key={p.name}
                        onClick={() => applyPreset(p)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all duration-200 border border-stone-700 hover:border-stone-600"
                      >
                        {p.name}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <h3 className="text-xs font-medium text-stone-400 mb-3">Adjustments</h3>
                <div className="space-y-4">
                  {filters.map((f) => (
                    <div key={f.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs text-stone-400 flex items-center gap-1.5">
                          <f.icon className="w-3 h-3" />
                          {f.label}
                        </label>
                        <span className="text-xs font-mono text-stone-500">
                          {settings[f.key]}{f.unit}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={f.min}
                        max={f.max}
                        value={settings[f.key]}
                        onChange={(e) => set(f.key, Number(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <motion.button
                  onClick={reset}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium transition-all duration-200"
                >
                  <Undo2 className="w-4 h-4" />
                  Reset all
                </motion.button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3"
            >
              <motion.button
                onClick={download}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-emerald-600/20"
              >
                <Download className="w-4 h-4" />
                Download
              </motion.button>
              <motion.button
                onClick={clearSource}
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
