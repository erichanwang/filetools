import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import {
  Type, CaseUpper, CaseLower, Eye, GitCompare, Copy, Trash2,
  Hash, AlignLeft, ClipboardPaste
} from 'lucide-react'

type Tab = 'counter' | 'case' | 'markdown' | 'diff'

const tabs: { id: Tab; label: string; icon: typeof Type }[] = [
  { id: 'counter', label: 'Word Counter', icon: Hash },
  { id: 'case', label: 'Case Convert', icon: CaseUpper },
  { id: 'markdown', label: 'Markdown', icon: Eye },
  { id: 'diff', label: 'Text Diff', icon: GitCompare },
]

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const }
}

export default function TextTools() {
  const [activeTab, setActiveTab] = useState<Tab>('counter')
  const [text, setText] = useState('')
  const [diffTextB, setDiffTextB] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const pasted = e.clipboardData?.getData('text/plain')
      if (pasted) {
        e.preventDefault()
        if (activeTab === 'diff') {
          setDiffTextB(pasted)
          toast('Pasted to right panel')
        } else {
          setText(pasted)
          toast('Text pasted')
        }
      }
    }
    document.addEventListener('paste', handler)
    return () => document.removeEventListener('paste', handler)
  }, [activeTab, toast])

  const stats = {
    chars: text.length,
    charsNoSpaces: text.replace(/\s/g, '').length,
    words: text.trim() ? text.trim().split(/\s+/).length : 0,
    lines: text ? text.split(/\n/).length : 0,
    sentences: text ? text.split(/[.!?]+/).filter(Boolean).length : 0,
    readingTime: text.trim() ? Math.ceil(text.trim().split(/\s+/).length / 200) : 0,
  }

  const toTitleCase = (s: string) =>
    s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

  const toSentenceCase = (s: string) =>
    s.replace(/(^\w|[.!?]\s+\w)/g, (c) => c.toUpperCase())

  const copyText = useCallback((t: string) => {
    navigator.clipboard.writeText(t)
    toast('Copied to clipboard')
  }, [toast])

  const clearText = () => { setText(''); setDiffTextB('') }

  // Simple line diff
  const diffResult = (() => {
    if (!text || !diffTextB) return null
    const a = text.split('\n')
    const b = diffTextB.split('\n')
    const result: { type: 'same' | 'added' | 'removed'; text: string }[] = []
    const max = Math.max(a.length, b.length)
    for (let i = 0; i < max; i++) {
      const la = a[i] ?? ''
      const lb = b[i] ?? ''
      if (la === lb) {
        if (la || i < a.length || i < b.length) result.push({ type: 'same', text: la })
      } else {
        if (i < a.length && la !== '') result.push({ type: 'removed', text: la })
        if (i < b.length && lb !== '') result.push({ type: 'added', text: lb })
      }
    }
    return result
  })()

  // Simple markdown → HTML
  const markdownHtml = text
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-1">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-white/10 px-1.5 py-0.5 rounded text-sm">$1</code>')
    .replace(/^\- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal">$1. $2</li>')
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')

  return (
    <motion.div {...fadeIn} className="max-w-6xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Text Tools</h1>
        <p className="text-white/50 text-sm">Word counter, case conversion, markdown preview & text diff</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Text area */}
      {activeTab === 'diff' ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-white/40 font-medium">ORIGINAL</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste or type original text…"
              className="w-full h-80 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 resize-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-white/40 font-medium">MODIFIED</label>
            <textarea
              value={diffTextB}
              onChange={(e) => setDiffTextB(e.target.value)}
              placeholder="Paste or type modified text…"
              className="w-full h-80 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/30 resize-none transition-all"
            />
          </div>
        </div>
      ) : (
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`Paste or type text here…${
              activeTab === 'markdown' ? ' Supports # Headings, **bold**, *italic*, `code`, - lists' : ''
            }`}
            className="w-full h-64 bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30 resize-none transition-all"
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button
              onClick={() => copyText(text)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              title="Copy"
            >
              <Copy className="w-4 h-4 text-white/50" />
            </button>
            <button
              onClick={clearText}
              className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 transition-colors"
              title="Clear"
            >
              <Trash2 className="w-4 h-4 text-white/50" />
            </button>
          </div>
        </div>
      )}

      {/* Results panel */}
      {activeTab === 'counter' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 sm:grid-cols-6 gap-3"
        >
          {[
            { label: 'Characters', value: stats.chars },
            { label: 'No Spaces', value: stats.charsNoSpaces },
            { label: 'Words', value: stats.words },
            { label: 'Lines', value: stats.lines },
            { label: 'Sentences', value: stats.sentences },
            { label: 'Read Time', value: `${stats.readingTime}m` },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'case' && text && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {[
            { label: 'uppercase', fn: (s: string) => s.toUpperCase(), icon: CaseUpper },
            { label: 'lowercase', fn: (s: string) => s.toLowerCase(), icon: CaseLower },
            { label: 'Title Case', fn: toTitleCase, icon: Type },
            { label: 'Sentence case', fn: toSentenceCase, icon: AlignLeft },
          ].map(({ label, fn, icon: _Icon }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</span>
                <button
                  onClick={() => copyText(fn(text))}
                  className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs text-white/50 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </button>
              </div>
              <p className="text-sm text-white/80 font-mono break-all line-clamp-4">{fn(text)}</p>
            </div>
          ))}
        </motion.div>
      )}

      {activeTab === 'markdown' && text && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Preview</span>
            <button
              onClick={() => copyText(markdownHtml)}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 text-xs text-white/50 transition-colors"
            >
              <Copy className="w-3 h-3" />
              Copy HTML
            </button>
          </div>
          <div
            className="prose prose-invert prose-sm max-w-none text-white/80"
            dangerouslySetInnerHTML={{ __html: markdownHtml }}
          />
        </motion.div>
      )}

      {activeTab === 'diff' && diffResult && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4 font-mono text-sm max-h-80 overflow-auto"
        >
          {diffResult.map((line, i) => (
            <div
              key={i}
              className={`px-3 py-0.5 -mx-4 ${
                line.type === 'added'
                  ? 'bg-green-500/10 text-green-400'
                  : line.type === 'removed'
                  ? 'bg-red-500/10 text-red-400'
                  : 'text-white/60'
              }`}
            >
              <span className="mr-3 text-white/20 w-5 inline-block">
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              {line.text}
            </div>
          ))}
        </motion.div>
      )}

      {/* Paste hint */}
      <div className="text-center text-xs text-white/20 flex items-center justify-center gap-1.5">
        <ClipboardPaste className="w-3 h-3" />
        Press Ctrl+V to paste text
      </div>
    </motion.div>
  )
}
