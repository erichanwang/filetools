import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { recognize } from 'tesseract.js'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { ScanText, Copy, Loader2, Check, Image, FileText, ClipboardPaste } from 'lucide-react'

export default function OcrPage() {
  const [source, setSource] = useState<{ file: File; url: string } | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<{ status: string; progress: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleFiles = useCallback((files: File[]) => {
    if (files.length) {
      if (source) URL.revokeObjectURL(source.url)
      setSource({ file: files[0], url: URL.createObjectURL(files[0]) })
      setText(null)
      setError(null)
      setProgress(null)
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

  const extract = useCallback(async () => {
    if (!source) return
    setProcessing(true)
    setError(null)
    setText(null)
    setProgress({ status: 'Loading OCR engine...', progress: 0 })

    try {
      const result = await recognize(source.url, 'eng', {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === 'recognizing text') {
            setProgress({ status: 'Recognizing text...', progress: Math.round(m.progress * 100) })
          } else {
            setProgress({ status: m.status, progress: m.progress ? Math.round(m.progress * 100) : 0 })
          }
        },
      })

      const extracted = result.data.text || '(No text detected)'
      setText(extracted)
      setProgress(null)
      toast(`Text extracted — ${extracted.length} characters`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OCR failed'
      setError(message)
      setProgress(null)
      toast(message, 'error')
    } finally {
      setProcessing(false)
    }
  }, [source, toast])

  const copyText = useCallback(() => {
    if (text) {
      navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [text])

  const reset = useCallback(() => {
    if (source) URL.revokeObjectURL(source.url)
    setSource(null)
    setText(null)
    setError(null)
    setProgress(null)
  }, [source])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ scale: 1.1 }} className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <ScanText className="w-5 h-5 text-indigo-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">OCR Text Extraction</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">
          Extract text from images using optical character recognition. Supports English. Paste images from clipboard.
        </p>
      </div>

      {!source ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <DropZone onFiles={handleFiles} accept="image/*" multiple={false} label="Drop an image to extract text"
            hint="PNG, JPEG — clearer images yield better results — or Ctrl+V to paste" className="mb-6" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6">
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste an image from clipboard</span>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="glass rounded-2xl p-4">
            <h3 className="text-xs font-medium text-stone-400 mb-3">Source Image</h3>
            <div className="aspect-square rounded-xl overflow-hidden bg-stone-900/50 flex items-center justify-center">
              <img src={source.url} alt="Source" className="max-w-full max-h-full object-contain" />
            </div>
          </motion.div>
          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-stone-400">Extracted Text</h3>
              {text && (
                <motion.button onClick={copyText} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-amber-400 transition-colors">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </motion.button>
              )}
            </div>
            <div className="flex-1 rounded-xl bg-stone-900/50 border border-stone-800 p-4 overflow-y-auto min-h-[300px]">
              {processing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 className="w-8 h-8 text-indigo-400" />
                  </motion.div>
                  {progress && (
                    <div className="text-center">
                      <p className="text-sm text-stone-300">{progress.status}</p>
                      <div className="w-48 h-1.5 bg-stone-700 rounded-full mt-2 overflow-hidden">
                        <motion.div className="h-full bg-indigo-500 rounded-full"
                          animate={{ width: `${progress.progress}%` }} transition={{ duration: 0.3 }} />
                      </div>
                    </div>
                  )}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              ) : text ? (
                <motion.pre initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-stone-300 whitespace-pre-wrap font-sans leading-relaxed">{text}</motion.pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <FileText className="w-10 h-10 text-stone-700" />
                  <p className="text-xs text-stone-500">Click "Extract Text" to begin</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {source && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <motion.button onClick={extract} disabled={processing} whileHover={{ scale: processing ? 1 : 1.03 }} whileTap={{ scale: processing ? 1 : 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-indigo-600/20">
            {processing ? (<><Loader2 className="w-4 h-4 animate-spin" />Extracting...</>) : (<><ScanText className="w-4 h-4" />Extract Text</>)}
          </motion.button>
          <motion.button onClick={reset} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium transition-all duration-200">
            <Image className="w-4 h-4" />New Image
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  )
}
