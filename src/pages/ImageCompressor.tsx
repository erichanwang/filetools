import { useState, useCallback } from 'react'
import DropZone from '../components/DropZone'
import { Shrink, Download, X, Image, Loader2, Maximize2, FileImage } from 'lucide-react'

export default function ImageCompressor() {
  const [files, setFiles] = useState<{ file: File; url: string }[]>([])
  const [quality, setQuality] = useState(80)
  const [maxWidth, setMaxWidth] = useState(1920)
  const [maxHeight, setMaxHeight] = useState(1920)
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<{ name: string; originalSize: number; compressedSize: number; url: string }[]>([])

  const handleFiles = useCallback((newFiles: File[]) => {
    const mapped = newFiles.map((f) => ({ file: f, url: URL.createObjectURL(f) }))
    setFiles((prev) => [...prev, ...mapped])
    setResults([])
  }, [])

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
          canvas.toBlob(resolve, 'image/jpeg', quality / 100)
        })

        if (blob) {
          const name = file.name.replace(/\.[^.]+$/, '_compressed.jpg')
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
  }, [files, quality, maxWidth, maxHeight])

  const downloadAll = useCallback(() => {
    results.forEach((r) => {
      const a = document.createElement('a')
      a.href = r.url
      a.download = r.name
      a.click()
    })
  }, [results])

  const downloadOne = useCallback((result: typeof results[number]) => {
    const a = document.createElement('a')
    a.href = result.url
    a.download = result.name
    a.click()
  }, [])

  const totalSavings = results.reduce((acc, r) => acc + (r.originalSize - r.compressedSize), 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Shrink className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Image Compressor</h1>
        </div>
        <p className="text-sm text-slate-400 ml-13">
          Compress and resize images while preserving visual quality.
        </p>
      </div>

      {/* Settings */}
      <div className="glass rounded-2xl p-5 mb-6 space-y-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-400">Quality</label>
            <span className="text-xs font-mono text-slate-300">{quality}%</span>
          </div>
          <input
            type="range"
            min={10}
            max={100}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-slate-600 mt-1">
            <span>Smaller</span>
            <span>Better</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              <Maximize2 className="w-3 h-3 inline mr-1" />
              Max Width (px)
            </label>
            <input
              type="number"
              value={maxWidth}
              onChange={(e) => setMaxWidth(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              <Maximize2 className="w-3 h-3 inline mr-1" />
              Max Height (px)
            </label>
            <input
              type="number"
              value={maxHeight}
              onChange={(e) => setMaxHeight(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Drop zone */}
      <DropZone
        onFiles={handleFiles}
        accept="image/*"
        label="Drop images to compress"
        hint="PNG, JPEG, WebP — multiple files supported"
        className="mb-6"
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {files.length} image{files.length > 1 ? 's' : ''}
            </h3>
            <button
              onClick={() => { files.forEach((f) => URL.revokeObjectURL(f.url)); setFiles([]); setResults([]) }}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Image className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-300 truncate">{f.file.name}</span>
                  <span className="text-xs text-slate-600 flex-shrink-0">
                    {(f.file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button onClick={() => removeFile(i)} className="p-1 hover:bg-slate-700 rounded-lg">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={compress}
            disabled={processing || !files.length}
            className="mt-4 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
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
          </button>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="glass rounded-2xl p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Compressed</h3>
              <p className="text-xs text-emerald-400">
                Saved {(totalSavings / 1024).toFixed(1)} KB ({results.length} file{results.length > 1 ? 's' : ''})
              </p>
            </div>
            <button
              onClick={downloadAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              Download all
            </button>
          </div>
          <div className="space-y-2">
            {results.map((r, i) => {
              const pct = Math.round((1 - r.compressedSize / r.originalSize) * 100)
              return (
                <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileImage className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-300 truncate">{r.name}</p>
                      <p className="text-xs text-slate-500">
                        {(r.originalSize / 1024).toFixed(1)} KB → {(r.compressedSize / 1024).toFixed(1)} KB
                        <span className="text-emerald-400 ml-2">-{pct}%</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadOne(r)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="w-4 h-4 text-blue-400" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
