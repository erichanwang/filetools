import { useState, useCallback } from 'react'
import DropZone from '../components/DropZone'
import { ArrowRightLeft, Download, X, Image, CheckCircle2, Loader2 } from 'lucide-react'

const formats = ['PNG', 'JPEG', 'WebP', 'BMP', 'GIF', 'ICO']

const mimeMap: Record<string, string> = {
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  WebP: 'image/webp',
  BMP: 'image/bmp',
  GIF: 'image/gif',
  ICO: 'image/x-icon',
}

export default function FileConverter() {
  const [files, setFiles] = useState<File[]>([])
  const [targetFormat, setTargetFormat] = useState('PNG')
  const [converting, setConverting] = useState(false)
  const [converted, setConverted] = useState<{ name: string; blob: Blob }[]>([])

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setConverted([])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setConverted([])
  }, [])

  const convert = useCallback(async () => {
    if (!files.length) return
    setConverting(true)
    setConverted([])

    const results: { name: string; blob: Blob }[] = []

    for (const file of files) {
      const img = new window.Image()
      const url = URL.createObjectURL(file)

      await new Promise<void>((resolve) => {
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')!
          ctx.drawImage(img, 0, 0)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const nameWithoutExt = file.name.replace(/\.[^.]+$/, '')
                results.push({ name: `${nameWithoutExt}.${targetFormat.toLowerCase()}`, blob })
              }
              URL.revokeObjectURL(url)
              resolve()
            },
            mimeMap[targetFormat],
            0.95,
          )
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          resolve()
        }
        img.src = url
      })
    }

    setConverted(results)
    setConverting(false)
  }, [files, targetFormat])

  const downloadAll = useCallback(() => {
    converted.forEach(({ name, blob }) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    })
  }, [converted])

  const downloadOne = useCallback((item: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(item.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.name
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <ArrowRightLeft className="w-5 h-5 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">File Converter</h1>
        </div>
        <p className="text-sm text-slate-400 ml-13">
          Convert images between formats instantly in your browser.
        </p>
      </div>

      {/* Target format selector */}
      <div className="glass rounded-2xl p-5 mb-6">
        <label className="block text-xs font-medium text-slate-400 mb-3">Convert to</label>
        <div className="flex flex-wrap gap-2">
          {formats.map((fmt) => (
            <button
              key={fmt}
              onClick={() => { setTargetFormat(fmt); setConverted([]) }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                targetFormat === fmt
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <DropZone
        onFiles={handleFiles}
        accept="image/*"
        label="Drop image files here"
        hint="PNG, JPEG, WebP, BMP, TIFF, GIF, ICO, SVG"
        className="mb-6"
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="glass rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              {files.length} file{files.length > 1 ? 's' : ''} selected
            </h3>
            <button
              onClick={() => { setFiles([]); setConverted([]) }}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {files.map((file, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Image className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="text-sm text-slate-300 truncate">{file.name}</span>
                  <span className="text-xs text-slate-600 flex-shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button onClick={() => removeFile(i)} className="p-1 hover:bg-slate-700 rounded-lg">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={convert}
            disabled={converting || !files.length}
            className="mt-4 w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            {converting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Converting...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                Convert to {targetFormat}
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {converted.length > 0 && (
        <div className="glass rounded-2xl p-5 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">
                {converted.length} file{converted.length > 1 ? 's' : ''} converted
              </h3>
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
            {converted.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-slate-300">{item.name}</span>
                  <span className="text-xs text-slate-500">
                    {(item.blob.size / 1024).toFixed(1)} KB
                  </span>
                </div>
                <button
                  onClick={() => downloadOne(item)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
