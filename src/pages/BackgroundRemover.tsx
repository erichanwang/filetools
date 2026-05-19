import { useState, useCallback } from 'react'
import DropZone from '../components/DropZone'
import { Scissors, Download, Image, RefreshCw, Loader2 } from 'lucide-react'

export default function BackgroundRemover() {
  const [source, setSource] = useState<{ file: File; url: string } | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = useCallback((files: File[]) => {
    if (files.length) {
      setSource({ file: files[0], url: URL.createObjectURL(files[0]) })
      setResult(null)
      setError(null)
    }
  }, [])

  const removeBg = useCallback(async () => {
    if (!source) return
    setProcessing(true)
    setError(null)

    try {
      const img = new window.Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = source.url
      })

      // Process at full native resolution for maximum quality.
      // Upper bound of 8192px prevents browser memory issues with extreme images
      // (the AI model operates at its own internal resolution regardless)
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

      // Dynamic import of @imgly/background-removal
      const { removeBackground } = await import('@imgly/background-removal')
      const blob = await removeBackground(canvas, {
        model: 'isnet_quint8',
        output: { format: 'image/png' },
      })

      const url = URL.createObjectURL(blob)
      setResult(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Background removal failed')
      setResult(null)
    } finally {
      setProcessing(false)
    }
  }, [source])

  const download = useCallback(() => {
    if (!result || !source) return
    const a = document.createElement('a')
    a.href = result
    const name = source.file.name.replace(/\.[^.]+$/, '_nobg.png')
    a.download = name
    a.click()
  }, [result, source])

  const reset = useCallback(() => {
    if (source) URL.revokeObjectURL(source.url)
    if (result) URL.revokeObjectURL(result)
    setSource(null)
    setResult(null)
    setError(null)
  }, [source, result])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Background Remover</h1>
        </div>
        <p className="text-sm text-slate-400 ml-13">
          Remove image backgrounds using AI — all processing happens locally. Up to 8K native resolution.
        </p>
      </div>

      {!source ? (
        <DropZone
          onFiles={handleFiles}
          accept="image/*"
          multiple={false}
          label="Drop an image here"
          hint="PNG, JPEG, WebP — first load downloads the AI model (~80MB)"
          className="mb-6"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Original */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-xs font-medium text-slate-400 mb-3">Original</h3>
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-900/50 flex items-center justify-center">
              <img
                src={source.url}
                alt="Original"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          {/* Result */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-xs font-medium text-slate-400 mb-3">Background Removed</h3>
            <div
              className="aspect-square rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                backgroundImage: 'repeating-conic-gradient(#1e293b 0% 25%, #0f172a 0% 50%)',
                backgroundSize: '20px 20px',
              }}
            >
              {processing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                  <p className="text-xs text-slate-400">Processing...</p>
                </div>
              ) : result ? (
                <img
                  src={result}
                  alt="Background removed"
                  className="max-w-full max-h-full object-contain"
                />
              ) : error ? (
                <div className="text-center p-4">
                  <p className="text-sm text-red-400 mb-2">Error</p>
                  <p className="text-xs text-slate-400">{error}</p>
                </div>
              ) : (
                <Image className="w-12 h-12 text-slate-700" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {source && (
        <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <button
            onClick={removeBg}
            disabled={processing || !source}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium transition-all duration-200"
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
          </button>
          {result && (
            <button
              onClick={download}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            New Image
          </button>
        </div>
      )}

    </div>
  )
}
