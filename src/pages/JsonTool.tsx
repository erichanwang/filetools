import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Braces, Copy, Check, Download, Wand2, Zap, Eye } from 'lucide-react'

export default function JsonTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [indent, setIndent] = useState(2)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const format = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, indent))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
      setOutput('')
    }
  }, [input, indent])

  const minify = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
      setOutput('')
    }
  }, [input])

  const validate = useCallback(() => {
    try {
      const parsed = JSON.parse(input)
      const keys = countKeys(parsed)
      toast(`Valid JSON — ${keys} keys, ${input.length} chars`)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
    }
  }, [input, toast])

  const copyResult = useCallback(() => {
    if (output) { navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500) }
  }, [output])

  const pasteInput = useCallback(async () => {
    try { setInput(await navigator.clipboard.readText()); toast('Pasted from clipboard') }
    catch { toast('Could not read clipboard', 'error') }
  }, [toast])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 15 }} className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Braces className="w-5 h-5 text-yellow-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">JSON Formatter</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">Format, minify, and validate JSON. Press Ctrl+V to paste JSON content.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-stone-400">Input</h3>
            <div className="flex gap-1">
              <motion.button onClick={pasteInput} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="px-2.5 py-1 rounded-lg bg-stone-800 text-[10px] text-stone-400 hover:text-stone-200">
                <Braces className="w-3 h-3 inline mr-1" />Paste
              </motion.button>
            </div>
          </div>
          <textarea value={input} onChange={e => setInput(e.target.value)} placeholder='{"key": "value"}'
            className="w-full h-[400px] px-4 py-3 rounded-xl bg-stone-900/50 border border-stone-700 text-white text-sm font-mono placeholder-stone-600 focus:outline-none focus:border-yellow-500 transition-colors resize-none" />
          <div className="flex flex-wrap gap-2">
            <motion.button onClick={format} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-medium shadow-lg shadow-yellow-600/20">
              <Wand2 className="w-3.5 h-3.5" />Format
            </motion.button>
            <motion.button onClick={minify} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs font-medium">
              <Zap className="w-3.5 h-3.5" />Minify
            </motion.button>
            <motion.button onClick={validate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-700 hover:bg-stone-600 text-stone-300 text-xs font-medium">
              <Eye className="w-3.5 h-3.5" />Validate
            </motion.button>
            <select value={indent} onChange={e => setIndent(Number(e.target.value))}
              className="px-2 py-2 rounded-lg bg-stone-800 border border-stone-700 text-xs text-stone-300">
              {[2, 4, 8, 0].map(n => <option key={n} value={n}>{n === 0 ? 'Tab' : `${n} spaces`}</option>)}
            </select>
          </div>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </motion.div>

        {/* Output */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-stone-400">Output</h3>
            {output && (
              <motion.button onClick={copyResult} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-700 text-xs text-stone-300">
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}{copied ? 'Copied' : 'Copy'}
              </motion.button>
            )}
          </div>
          <textarea readOnly value={output}
            className="w-full h-[400px] px-4 py-3 rounded-xl bg-stone-900/50 border border-stone-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors resize-none" />
          {output && (
            <motion.button onClick={() => { const blob = new Blob([output], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'formatted.json'; a.click(); URL.revokeObjectURL(url); toast('Downloaded') }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium">
              <Download className="w-3.5 h-3.5" />Download
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

function countKeys(obj: unknown): number {
  if (Array.isArray(obj)) return obj.reduce((s, v) => s + countKeys(v), 0)
  if (obj && typeof obj === 'object') return Object.keys(obj).length + Object.values(obj).reduce((s: number, v) => s + countKeys(v), 0)
  return 0
}
