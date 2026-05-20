import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { Binary, Copy, Download, Check, ClipboardPaste, File as FileIcon } from 'lucide-react'

type Mode = 'encode' | 'decode'

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [source, setSource] = useState<{ file: File; url: string } | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [resultBlob, setResultBlob] = useState<Blob | null>(null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleFiles = useCallback((files: File[]) => {
    if (!files.length) return
    if (source) { URL.revokeObjectURL(source.url); if (resultBlob) resultBlob.text().then(() => {}) }
    setSource({ file: files[0], url: URL.createObjectURL(files[0]) })
    setResult(null)
    setResultBlob(null)
  }, [source, resultBlob])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/') || !items[i].type) {
          e.preventDefault()
          const blob = items[i].getAsFile()
          if (blob) {
            handleFiles([new File([blob], 'pasted.' + (blob.type.split('/')[1] || 'png'), { type: blob.type || 'image/png' })])
            toast('File pasted from clipboard')
          }
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFiles, toast])

  const encode = useCallback(async () => {
    if (!source) return
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1]
      setResult(base64)
      toast('Encoded to Base64')
    }
    reader.readAsDataURL(source.file)
  }, [source, toast])

  const decode = useCallback(async () => {
    if (!source) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result as string
        const mimeMatch = text.match(/^data:(.*?);base64,/)
        const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
        const base64 = text.split(',')[1] || text
        const binaryStr = atob(base64)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
        const blob = new Blob([bytes], { type: mime })
        setResultBlob(blob)
        toast('Decoded from Base64')
      } catch {
        toast('Invalid Base64 string', 'error')
      }
    }
    reader.readAsText(source.file)
  }, [source, toast])

  const copyResult = useCallback(() => {
    if (result) { navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  }, [result])

  const downloadResult = useCallback(() => {
    if (result) {
      const blob = new Blob([result], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = source!.file.name + '.b64'; a.click()
      URL.revokeObjectURL(url); toast('Downloaded')
    } else if (resultBlob) {
      const url = URL.createObjectURL(resultBlob)
      const a = document.createElement('a'); a.href = url; a.download = source!.file.name.replace('.b64', ''); a.click()
      URL.revokeObjectURL(url); toast('Downloaded')
    }
  }, [result, resultBlob, source, toast])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.4 }} className="w-10 h-10 rounded-xl bg-fuchsia-500/10 flex items-center justify-center">
            <Binary className="w-5 h-5 text-fuchsia-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Base64 Tool</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">Encode files to Base64 or decode Base64 back to files. Paste from clipboard.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-1.5 mb-6 inline-flex gap-1">
        {([{ key: 'encode' as const, label: 'Encode' }, { key: 'decode' as const, label: 'Decode' }]).map(m => (
          <motion.button key={m.key} onClick={() => { setMode(m.key); setResult(null); setResultBlob(null) }}
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              mode === m.key ? 'bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-600/25' : 'text-stone-400 hover:text-stone-200'}`}>{m.label}</motion.button>
        ))}
      </motion.div>

      {!source ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <DropZone onFiles={handleFiles} accept="*/*" multiple={false} label={mode === 'encode' ? 'Drop a file to encode' : 'Drop a Base64 file to decode'}
            hint="Any file — or Ctrl+V to paste" className="mb-6" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6">
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste</span>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass rounded-2xl p-4 flex items-center gap-3">
            <FileIcon className="w-5 h-5 text-stone-500" />
            <span className="text-sm text-stone-300 truncate">{source.file.name}</span>
            <button onClick={() => { URL.revokeObjectURL(source.url); setSource(null); setResult(null); setResultBlob(null) }}
              className="ml-auto text-xs text-stone-500 hover:text-red-400">Remove</button>
          </div>

          <motion.button onClick={() => mode === 'encode' ? encode() : decode()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-fuchsia-600/20">
            <Binary className="w-4 h-4" />{mode === 'encode' ? 'Encode to Base64' : 'Decode from Base64'}
          </motion.button>

          {(result || resultBlob) && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-medium text-stone-400">Result</h3>
                <div className="flex gap-2">
                  {result && (
                    <motion.button onClick={copyResult} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-700 text-xs text-stone-300">
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}{copied ? 'Copied' : 'Copy'}
                    </motion.button>
                  )}
                  <motion.button onClick={downloadResult} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium">
                    <Download className="w-3 h-3" />Download
                  </motion.button>
                </div>
              </div>
              {result && (
                <div className="bg-stone-800/50 rounded-xl p-4 max-h-80 overflow-y-auto">
                  <p className="text-xs font-mono text-stone-400 break-all select-all">{result}</p>
                </div>
              )}
              {resultBlob && (
                <p className="text-sm text-stone-300">Decoded file ready — {(resultBlob.size / 1024).toFixed(1)} KB</p>
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
