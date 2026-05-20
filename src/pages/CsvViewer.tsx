import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { Table, ClipboardPaste, FileText, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface CsvData { headers: string[]; rows: string[][] }

function parseCSV(text: string): CsvData {
  const lines = text.trim().split('\n')
  const headers = lines[0]?.split(',').map(h => h.trim().replace(/^"|"$/g, '')) || []
  const rows = lines.slice(1).map(line => {
    const cells: string[] = []
    let current = '', inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === ',' && !inQuotes) { cells.push(current.trim().replace(/^"|"$/g, '')); current = '' }
      else current += ch
    }
    cells.push(current.trim().replace(/^"|"$/g, ''))
    return cells
  })
  return { headers, rows }
}

export default function CsvViewer() {
  const [data, setData] = useState<CsvData | null>(null)
  const [fileName, setFileName] = useState('')
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<number | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const { toast } = useToast()

  const filteredRows = (data?.rows || []).filter(row =>
    !search || row.some(cell => cell.toLowerCase().includes(search.toLowerCase()))
  )

  const sortedRows = sortCol !== null
    ? [...filteredRows].sort((a, b) => {
        const va = a[sortCol] || '', vb = b[sortCol] || ''
        const cmp = va.localeCompare(vb, undefined, { numeric: true })
        return sortDir === 'asc' ? cmp : -cmp
      })
    : filteredRows

  const toggleSort = (colIdx: number) => {
    if (sortCol === colIdx) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(colIdx); setSortDir('asc') }
  }

  const handleFiles = useCallback((files: File[]) => {
    if (!files.length) return
    const file = files[0]
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = parseCSV(reader.result as string)
        setData(parsed)
        toast(`Loaded ${parsed.rows.length} rows, ${parsed.headers.length} columns`)
      } catch { toast('Failed to parse CSV', 'error') }
    }
    reader.readAsText(file)
  }, [toast])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.kind === 'file') {
          e.preventDefault()
          const file = item.getAsFile()
          if (file) handleFiles([file])
          break
        }
        if (item.type === 'text/plain') {
          item.getAsString(text => {
            try {
              const parsed = parseCSV(text)
              setData(parsed)
              setFileName('pasted.csv')
              toast(`Pasted CSV — ${parsed.rows.length} rows`)
            } catch { /* not CSV */ }
          })
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFiles, toast])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 15 }} className="w-10 h-10 rounded-xl bg-stone-500/10 flex items-center justify-center">
            <Table className="w-5 h-5 text-stone-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">CSV Viewer</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">View and inspect CSV files. Paste CSV content directly from clipboard.</p>
      </div>

      {!data ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <DropZone onFiles={handleFiles} accept=".csv,text/csv,text/plain" multiple={false}
            label="Drop a CSV file" hint="CSV or tabular text — or Ctrl+V to paste CSV content" className="mb-6" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6">
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste CSV data</span>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-stone-400" />
              <div><p className="text-sm text-white">{fileName}</p><p className="text-xs text-stone-400">{filteredRows.length}/{data.rows.length} rows × {data.headers.length} cols</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Filter rows..."
                  className="w-48 pl-8 pr-3 py-2 rounded-lg bg-stone-800/50 border border-stone-700 text-xs text-stone-200 placeholder-stone-600 focus:outline-none focus:border-emerald-500/40 transition-colors" />
              </div>
              <motion.button onClick={() => { setData(null); setFileName(''); setSearch(''); setSortCol(null) }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className="text-xs text-stone-500 hover:text-red-400">Clear</motion.button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl overflow-hidden">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-800/80">
                    <th className="sticky left-0 bg-stone-800/80 px-4 py-3 text-stone-400 font-medium w-12">#</th>
                    {data.headers.map((h, i) => (
                      <th key={i} onClick={() => toggleSort(i)}
                        className="px-4 py-3 text-stone-300 font-medium whitespace-nowrap cursor-pointer hover:text-stone-100 select-none group transition-colors">
                        <span className="inline-flex items-center gap-1">
                          {h || `Col ${i + 1}`}
                          {sortCol === i ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3 text-emerald-400" /> : <ArrowDown className="w-3 h-3 text-emerald-400" />)
                            : <ArrowUpDown className="w-3 h-3 text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, ri) => (
                    <tr key={ri} className="border-t border-stone-800/50 hover:bg-white/[0.02] transition-colors">
                      <td className="sticky left-0 bg-stone-950/90 px-4 py-2.5 text-stone-600 font-mono">{ri + 1}</td>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-4 py-2.5 text-stone-300 whitespace-nowrap max-w-[300px] truncate">{cell}</td>
                      ))}
                    </tr>
                  ))}
                  {sortedRows.length === 0 && (
                    <tr><td colSpan={data.headers.length + 1} className="px-4 py-12 text-center text-stone-600">No matching rows</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}
