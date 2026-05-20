import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DropZone from '../components/DropZone'
import FilePreview from '../components/FilePreview'
import { useToast } from '../components/Toast'
import { ArrowRightLeft, Download, X, Image, CheckCircle2, Loader2, ClipboardPaste } from 'lucide-react'

const formats = ['PNG', 'JPEG', 'WebP', 'BMP', 'GIF', 'ICO']

const mimeMap: Record<string, string> = {
  PNG: 'image/png',
  JPEG: 'image/jpeg',
  WebP: 'image/webp',
  BMP: 'image/bmp',
  GIF: 'image/gif',
  ICO: 'image/x-icon',
}

const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export default function FileConverter() {
  const [files, setFiles] = useState<File[]>([])
  const [targetFormat, setTargetFormat] = useState('PNG')
  const [converting, setConverting] = useState(false)
  const [converted, setConverted] = useState<{ name: string; blob: Blob }[]>([])
  const { toast } = useToast()

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setConverted([])
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
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setConverted([])
  }, [])

  const convert = useCallback(async () => {
    if (!files.length) return
    setConverting(true)
    setConverted([])

    const results: { name: string; blob: Blob }[] = []
    let failed = 0

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
              } else {
                failed++
              }
              URL.revokeObjectURL(url)
              resolve()
            },
            mimeMap[targetFormat],
            0.95,
          )
        }
        img.onerror = () => {
          failed++
          URL.revokeObjectURL(url)
          resolve()
        }
        img.src = url
      })
    }

    setConverted(results)
    setConverting(false)

    if (results.length > 0) {
      toast(`Converted ${results.length} file${results.length > 1 ? 's' : ''} to ${targetFormat}`)
    }
    if (failed > 0) {
      toast(`${failed} file${failed > 1 ? 's' : ''} failed to convert`, 'error')
    }
  }, [files, targetFormat, toast])

  const downloadAll = useCallback(() => {
    converted.forEach(({ name, blob }) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      a.click()
      URL.revokeObjectURL(url)
    })
    toast(`Downloading ${converted.length} file${converted.length > 1 ? 's' : ''}`)
  }, [converted, toast])

  const downloadOne = useCallback((item: { name: string; blob: Blob }) => {
    const url = URL.createObjectURL(item.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = item.name
    a.click()
    URL.revokeObjectURL(url)
  }, [])

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
            transition={{ duration: 0.4 }}
            className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"
          >
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">File Converter</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">
          Convert images between formats instantly in your browser. Paste images from clipboard.
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass rounded-2xl p-5 mb-6"
      >
        <label className="block text-xs font-medium text-stone-400 mb-3">Convert to</label>
        <div className="flex flex-wrap gap-2">
          {formats.map((fmt) => (
            <motion.button
              key={fmt}
              onClick={() => { setTargetFormat(fmt); setConverted([]) }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                targetFormat === fmt
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                  : 'bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
              }`}
            >
              {fmt}
            </motion.button>
          ))}
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
          label="Drop image files here"
          hint="PNG, JPEG, WebP, BMP, GIF, ICO — or Ctrl+V to paste"
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
                {files.length} file{files.length > 1 ? 's' : ''} selected
              </h3>
              <button
                onClick={() => { setFiles([]); setConverted([]) }}
                className="text-xs text-stone-500 hover:text-red-400 transition-colors"
              >
                Clear all
              </button>
            </div>
            <motion.div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((file, i) => (
                <motion.div
                  key={`${file.name}-${i}`}
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between bg-stone-800/50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Image className="w-4 h-4 text-stone-500 flex-shrink-0" />
                    <span className="text-sm text-stone-300 truncate">{file.name}</span>
                    <span className="text-xs text-stone-600 flex-shrink-0">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button onClick={() => removeFile(i)} className="p-1 hover:bg-stone-700 rounded-lg transition-colors">
                    <X className="w-4 h-4 text-stone-500" />
                  </button>
                </motion.div>
              ))}
            </motion.div>

            {/* File previews */}
            {files.length > 0 && (
              <div className="flex gap-3 flex-wrap mt-3">
                {files.map((file, i) => (
                  <FilePreview key={`${file.name}-${i}`} file={file} onRemove={() => removeFile(i)} />
                ))}
              </div>
            )}

            <motion.button
              onClick={convert}
              disabled={converting || !files.length}
              whileHover={{ scale: converting ? 1 : 1.01 }}
              whileTap={{ scale: converting ? 1 : 0.99 }}
              className="mt-4 w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
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
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {converted.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">
                  {converted.length} file{converted.length > 1 ? 's' : ''} converted
                </h3>
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
              {converted.map((item, i) => (
                <motion.div
                  key={i}
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between bg-stone-800/50 rounded-xl px-4 py-3 group"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-stone-300">{item.name}</span>
                    <span className="text-xs text-stone-500">
                      {(item.blob.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <motion.button
                    onClick={() => downloadOne(item)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 hover:bg-stone-700 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                  </motion.button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
