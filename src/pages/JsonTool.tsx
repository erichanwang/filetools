import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import CopyButton from '../components/CopyButton'
import { Braces, Download, Wand2, Zap, Eye, ChevronRight, ChevronDown, Layers, AlignLeft } from 'lucide-react'

export default function JsonTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [indent, setIndent] = useState(2)
  const [viewMode, setViewMode] = useState<'raw' | 'tree'>('raw')
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
            <div className="flex items-center gap-1">
              <h3 className="text-xs font-medium text-stone-400 mr-2">Output</h3>
              {output && (
                <div className="glass rounded-lg p-0.5 inline-flex gap-0.5">
                  <button onClick={() => setViewMode('raw')}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${viewMode === 'raw' ? 'bg-stone-700 text-stone-200' : 'text-stone-500 hover:text-stone-300'}`}>
                    <AlignLeft className="w-3 h-3 inline mr-1" />Raw
                  </button>
                  <button onClick={() => setViewMode('tree')}
                    className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${viewMode === 'tree' ? 'bg-stone-700 text-stone-200' : 'text-stone-500 hover:text-stone-300'}`}>
                    <Layers className="w-3 h-3 inline mr-1" />Tree
                  </button>
                </div>
              )}
            </div>
            {output && <CopyButton text={output} />}
          </div>
          {viewMode === 'raw' ? (
            <textarea readOnly value={output}
              className="w-full h-[400px] px-4 py-3 rounded-xl bg-stone-900/50 border border-stone-700 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors resize-none" />
          ) : (
            <div className="h-[400px] overflow-y-auto rounded-xl bg-stone-900/50 border border-stone-700 p-4">
              <JsonTreeView json={output} />
            </div>
          )}
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

function JsonTreeView({ json }: { json: string }) {
  let parsed: unknown
  try { parsed = JSON.parse(json) } catch { return <p className="text-xs text-red-400">Invalid JSON</p> }
  return <TreeNode value={parsed} depth={0} label="root" />
}

function TreeNode({ value, depth, label }: { value: unknown; depth: number; label: string }) {
  const [open, setOpen] = useState(depth < 3)
  const isExpandable = value !== null && typeof value === 'object'
  const isArray = Array.isArray(value)
  const entries = isExpandable ? Object.entries(value as Record<string, unknown>) : []
  const typeLabel = isArray ? `[${entries.length}]` : isExpandable ? `{${entries.length}}` : ''
  const valStr = !isExpandable ? (typeof value === 'string' ? `"${value}"` : String(value)) : ''

  const typeColors: Record<string, string> = {
    string: 'text-emerald-400', number: 'text-amber-400', boolean: 'text-violet-400',
    object: 'text-stone-400', undefined: 'text-stone-600',
  }
  const valColor = isExpandable ? 'text-stone-400' : (typeColors[typeof value] || 'text-stone-300')
  const keyColor = depth === 0 ? 'text-yellow-400' : 'text-stone-300'

  return (
    <div className="font-mono text-xs" style={{ paddingLeft: depth * 16 }}>
      <div
        className={`flex items-center gap-1 py-0.5 cursor-pointer hover:bg-white/[0.03] rounded px-1 -ml-1 ${isExpandable ? '' : 'cursor-default'}`}
        onClick={() => isExpandable && setOpen(!open)}
      >
        {isExpandable ? (
          open ? <ChevronDown className="w-3 h-3 text-stone-500 shrink-0" /> : <ChevronRight className="w-3 h-3 text-stone-500 shrink-0" />
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {depth > 0 && <span className={keyColor}>{label}</span>}
        {depth > 0 && <span className="text-stone-600">: </span>}
        <span className={valColor}>{valStr || typeLabel}</span>
      </div>
      <AnimatePresence>
        {open && isExpandable && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }} className="overflow-hidden">
            {entries.map(([k, v]) => (
              <TreeNode key={k} value={v} depth={depth + 1} label={k} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
