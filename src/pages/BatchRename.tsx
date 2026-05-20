import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import {
  Pencil, Download, X, File, Hash, CaseUpper,
  Type, ArrowRight, RefreshCw
} from 'lucide-react'

type RenameMode = 'find-replace' | 'prefix' | 'suffix' | 'numbering' | 'case'

const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export default function BatchRename() {
  const [files, setFiles] = useState<File[]>([])
  const [mode, setMode] = useState<RenameMode>('find-replace')
  const [find, setFind] = useState('')
  const [replace, setReplace] = useState('')
  const [prefix, setPrefix] = useState('')
  const [suffix, setSuffix] = useState('')
  const [numberStart, setNumberStart] = useState(1)
  const [numberPad, setNumberPad] = useState(3)
  const [caseMode, setCaseMode] = useState<'upper' | 'lower' | 'title'>('lower')
  const [preview, setPreview] = useState<{ old: string; new: string }[]>([])
  const { toast } = useToast()

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const generatePreview = useCallback(() => {
    const previewArr = files.map((file, i) => {
      const ext = file.name.split('.').pop() || ''
      const nameWithoutExt = file.name.slice(0, file.name.length - ext.length - 1)
      let newName = nameWithoutExt

      switch (mode) {
        case 'find-replace':
          newName = find ? nameWithoutExt.replaceAll(find, replace) : nameWithoutExt
          break
        case 'prefix':
          newName = prefix + nameWithoutExt
          break
        case 'suffix':
          newName = nameWithoutExt + suffix
          break
        case 'numbering':
          newName = String(numberStart + i).padStart(numberPad, '0') + '_' + nameWithoutExt
          break
        case 'case':
          if (caseMode === 'upper') newName = nameWithoutExt.toUpperCase()
          else if (caseMode === 'lower') newName = nameWithoutExt.toLowerCase()
          else newName = nameWithoutExt.replace(/\b\w/g, (c) => c.toUpperCase())
          break
      }

      return { old: file.name, new: `${newName}.${ext}` }
    })
    setPreview(previewArr)
  }, [files, mode, find, replace, prefix, suffix, numberStart, numberPad, caseMode])

  const hasDuplicates = useMemo(() => {
    const names = preview.map((p) => p.new)
    return new Set(names).size !== names.length
  }, [preview])

  const downloadAll = useCallback(() => {
    preview.forEach(({ old, new: newName }) => {
      const file = files.find((f) => f.name === old)
      if (!file) return
      const blob = file.slice(0, file.size, file.type)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = newName
      a.click()
      URL.revokeObjectURL(url)
    })
    toast(`Downloading ${preview.length} renamed file${preview.length > 1 ? 's' : ''}`)
  }, [files, preview, toast])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreview([])
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
            whileHover={{ rotate: -10 }}
            className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center"
          >
            <Pencil className="w-5 h-5 text-amber-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Batch Rename</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">
          Rename multiple files with patterns, find/replace, numbering, and more.
        </p>
      </div>

      {/* Drop zone */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <DropZone
          onFiles={handleFiles}
          accept="*/*"
          label="Drop files to rename"
          hint="Any file type — renaming preserves original extension"
          className="mb-6"
        />
      </motion.div>

      {files.length > 0 && (
        <>
          {/* Mode selector */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-1.5 mb-6 inline-flex gap-1 flex-wrap"
          >
            {([
              { key: 'find-replace' as const, icon: Type, label: 'Find & Replace' },
              { key: 'prefix' as const, icon: ArrowRight, label: 'Prefix' },
              { key: 'suffix' as const, icon: ArrowRight, label: 'Suffix' },
              { key: 'numbering' as const, icon: Hash, label: 'Numbering' },
              { key: 'case' as const, icon: CaseUpper, label: 'Case' },
            ]).map((m) => (
              <motion.button
                key={m.key}
                onClick={() => { setMode(m.key); setPreview([]) }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  mode === m.key
                    ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/25'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <m.icon className="w-3.5 h-3.5" />
                {m.label}
              </motion.button>
            ))}
          </motion.div>

          {/* Mode inputs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-5 mb-6 space-y-4"
          >
            {mode === 'find-replace' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-2">Find</label>
                  <input
                    type="text"
                    value={find}
                    onChange={(e) => setFind(e.target.value)}
                    placeholder="Text to find"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-2">Replace with</label>
                  <input
                    type="text"
                    value={replace}
                    onChange={(e) => setReplace(e.target.value)}
                    placeholder="Replacement text"
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            )}
            {mode === 'prefix' && (
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-2">Prefix to add</label>
                <input
                  type="text"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  placeholder="e.g. draft_"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            )}
            {mode === 'suffix' && (
              <div>
                <label className="block text-xs font-medium text-stone-400 mb-2">Suffix to add (before extension)</label>
                <input
                  type="text"
                  value={suffix}
                  onChange={(e) => setSuffix(e.target.value)}
                  placeholder="e.g. _final"
                  className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            )}
            {mode === 'numbering' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-2">Start at</label>
                  <input
                    type="number"
                    value={numberStart}
                    onChange={(e) => setNumberStart(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-2">Zero padding</label>
                  <input
                    type="number"
                    value={numberPad}
                    min={1}
                    max={10}
                    onChange={(e) => setNumberPad(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            )}
            {mode === 'case' && (
              <div className="flex gap-2">
                {([
                  { key: 'lower' as const, label: 'lowercase' },
                  { key: 'upper' as const, label: 'UPPERCASE' },
                  { key: 'title' as const, label: 'Title Case' },
                ]).map((c) => (
                  <motion.button
                    key={c.key}
                    onClick={() => setCaseMode(c.key)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      caseMode === c.key
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    {c.label}
                  </motion.button>
                ))}
              </div>
            )}

            <motion.button
              onClick={generatePreview}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-all duration-200 shadow-lg shadow-amber-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              Generate Preview
            </motion.button>
          </motion.div>

          {/* Preview */}
          <AnimatePresence>
            {preview.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="glass rounded-2xl p-5 mb-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Preview ({preview.length} file{preview.length > 1 ? 's' : ''})
                    </h3>
                    {hasDuplicates && (
                      <p className="text-xs text-red-400 mt-1">Warning: duplicate names detected!</p>
                    )}
                  </div>
                  <motion.button
                    onClick={downloadAll}
                    disabled={hasDuplicates}
                    whileHover={{ scale: hasDuplicates ? 1 : 1.05 }}
                    whileTap={{ scale: hasDuplicates ? 1 : 0.95 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium transition-all duration-200 shadow-lg shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" />
                    Download Renamed
                  </motion.button>
                </div>
                <motion.div className="space-y-2 max-h-96 overflow-y-auto">
                  {preview.map((p, i) => {
                    const changed = p.old !== p.new
                    return (
                      <motion.div
                        key={i}
                        variants={listItem}
                        initial="hidden"
                        animate="show"
                        transition={{ delay: i * 0.03 }}
                        className={`flex items-center gap-4 rounded-xl px-4 py-3 ${changed ? 'bg-amber-500/5' : 'bg-stone-800/30'}`}
                      >
                        <File className="w-4 h-4 text-stone-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span className={`text-sm truncate ${changed ? 'text-stone-500 line-through' : 'text-stone-300'}`}>
                            {p.old}
                          </span>
                          {changed && (
                            <>
                              <ArrowRight className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                              <span className="text-sm text-amber-400 truncate">{p.new}</span>
                            </>
                          )}
                        </div>
                        <button onClick={() => removeFile(i)} className="p-1 hover:bg-stone-700 rounded-lg flex-shrink-0">
                          <X className="w-4 h-4 text-stone-500" />
                        </button>
                      </motion.div>
                    )
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </motion.div>
  )
}
