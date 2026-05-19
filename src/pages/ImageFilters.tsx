import { useState, useCallback, useRef, useEffect } from 'react'
import DropZone from '../components/DropZone'
import { SlidersHorizontal, Download, RefreshCw, Undo2, Loader2, Contrast, Sun, Droplets, Sparkles } from 'lucide-react'

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
  brightness: 100,
  contrast: 100,
  saturation: 100,
  blur: 0,
  grayscale: 0,
  sepia: 0,
  hueRotate: 0,
  opacity: 100,
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
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const handleFiles = useCallback((files: File[]) => {
    if (files.length) {
      if (source) URL.revokeObjectURL(source.url)
      setSource({ file: files[0], url: URL.createObjectURL(files[0]) })
      setSettings({ ...defaults })
    }
  }, [source])

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
    }, 'image/png')
  }, [source, filterStyle])

  const clearSource = useCallback(() => {
    if (source) URL.revokeObjectURL(source.url)
    setSource(null)
    setSettings({ ...defaults })
  }, [source])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Image Filters</h1>
        </div>
        <p className="text-sm text-slate-400 ml-13">
          Adjust brightness, contrast, saturation, and more. Apply creative presets.
        </p>
      </div>

      {!source ? (
        <DropZone
          onFiles={handleFiles}
          accept="image/*"
          multiple={false}
          label="Drop an image to edit"
          hint="PNG, JPEG, WebP"
          className="mb-6"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Preview */}
            <div className="glass rounded-2xl p-4">
              <h3 className="text-xs font-medium text-slate-400 mb-3">Preview</h3>
              <div className="aspect-square rounded-xl overflow-hidden bg-slate-900/50 flex items-center justify-center relative">
                <img
                  ref={imgRef}
                  src={source.url}
                  alt="Preview"
                  className="max-w-full max-h-full object-contain transition-all duration-300"
                  style={{ filter: filterStyle }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="glass rounded-2xl p-4 overflow-y-auto max-h-[600px]">
              {/* Presets */}
              <div className="mb-5">
                <h3 className="text-xs font-medium text-slate-400 mb-3">Presets</h3>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => applyPreset(p)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all duration-200 border border-slate-700 hover:border-slate-600"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <h3 className="text-xs font-medium text-slate-400 mb-3">Adjustments</h3>
              <div className="space-y-4">
                {filters.map((f) => (
                  <div key={f.key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs text-slate-400 flex items-center gap-1.5">
                        <f.icon className="w-3 h-3" />
                        {f.label}
                      </label>
                      <span className="text-xs font-mono text-slate-500">
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

              <button
                onClick={reset}
                className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all duration-200"
              >
                <Undo2 className="w-4 h-4" />
                Reset all
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <button
              onClick={download}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={clearSource}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              New Image
            </button>
          </div>
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
