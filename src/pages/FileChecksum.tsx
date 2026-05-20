import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { Hash, Copy, Check, ClipboardPaste, Shield } from 'lucide-react'

type Algo = 'SHA-256' | 'SHA-384' | 'SHA-512' | 'MD5'

const ALGOS: Algo[] = ['SHA-256', 'SHA-384', 'SHA-512', 'MD5']
const listItem = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } }

export default function FileChecksum() {
  const [files, setFiles] = useState<File[]>([])
  const [results, setResults] = useState<{ name: string; hash: string; algo: Algo }[]>([])
  const [algo, setAlgo] = useState<Algo>('SHA-256')
  const [processing, setProcessing] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const { toast } = useToast()

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles])
    setResults([])
  }, [])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = Array.from(e.clipboardData?.files || [])
      if (items.length) { e.preventDefault(); handleFiles(items); toast(`${items.length} file${items.length > 1 ? 's' : ''} pasted`) }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFiles, toast])

  const compute = useCallback(async () => {
    if (!files.length) return
    setProcessing(true)
    const res: typeof results = []
    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const hashBuffer = await crypto.subtle.digest(algo, buffer)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
      res.push({ name: file.name, hash: hashHex, algo })
    }
    setResults(res)
    setProcessing(false)
    toast(`Computed ${algo} for ${res.length} file${res.length > 1 ? 's' : ''}`)
  }, [files, algo, toast])

  const copyHash = useCallback((hash: string, i: number) => {
    navigator.clipboard.writeText(hash)
    setCopiedIndex(i)
    setTimeout(() => setCopiedIndex(null), 1500)
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 15 }} className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-sky-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">File Checksum</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">Compute SHA-256, SHA-384, SHA-512, MD5 hashes for any file. Paste from clipboard.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-1.5 mb-6 inline-flex gap-1">
        {ALGOS.map(a => (
          <motion.button key={a} onClick={() => setAlgo(a)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
              algo === a ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/25' : 'text-stone-400 hover:text-stone-200'}`}>{a}</motion.button>
        ))}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <DropZone onFiles={handleFiles} accept="*/*" label="Drop files to hash"
          hint="Any file type — or Ctrl+V to paste" className="mb-6" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6">
          <ClipboardPaste className="w-3.5 h-3.5" />
          <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste files</span>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">{files.length} file{files.length > 1 ? 's' : ''}</h3>
              <button onClick={() => { setFiles([]); setResults([]) }} className="text-xs text-stone-500 hover:text-red-400">Clear all</button>
            </div>
            <motion.button onClick={compute} disabled={processing} whileHover={{ scale: processing ? 1 : 1.01 }} whileTap={{ scale: processing ? 1 : 0.99 }}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20">
              <Hash className="w-4 h-4" />Compute {algo}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Results</h3>
            <div className="space-y-3">
              {results.map((r, i) => (
                <motion.div key={i} variants={listItem} initial="hidden" animate="show" transition={{ delay: i * 0.04 }}
                  className="bg-stone-800/50 rounded-xl p-4 group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-stone-300 truncate">{r.name}</span>
                    <motion.button onClick={() => copyHash(r.hash, i)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                      className="p-1.5 rounded-lg bg-stone-700 hover:bg-stone-600 text-stone-400 hover:text-white transition-colors">
                      {copiedIndex === i ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </motion.button>
                  </div>
                  <p className="text-xs font-mono text-stone-400 break-all">{r.hash}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
