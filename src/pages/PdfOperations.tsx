import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import {
  FileText, Download, X, Combine, Scissors, FileArchive, Loader2,
  CheckCircle2, GripVertical
} from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

type PdfMode = 'merge' | 'split' | 'compress'
type PdfResult = { name: string; blob: Blob; originalSize?: number }

const listItem = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
}

export default function PdfOperations() {
  const [mode, setMode] = useState<PdfMode>('merge')
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<PdfResult[]>([])
  const [splitRange, setSplitRange] = useState('')
  const { toast } = useToast()

  const handleFiles = useCallback((newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    setResults([])
  }, [])

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setResults([])
  }, [])

  const merge = useCallback(async () => {
    if (files.length < 2) return
    setProcessing(true)
    setResults([])

    try {
      const mergedPdf = await PDFDocument.create()
      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const pdf = await PDFDocument.load(bytes)
        const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        pages.forEach((page) => mergedPdf.addPage(page))
      }
      const pdfBytes = await mergedPdf.save()
      setResults([{ name: 'merged.pdf', blob: new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }) }])
      toast(`Merged ${files.length} PDFs successfully`)
    } catch (err) {
      toast('Failed to merge PDFs', 'error')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }, [files, toast])

  const split = useCallback(async () => {
    if (!files.length) return
    setProcessing(true)
    setResults([])

    try {
      const bytes = await files[0].arrayBuffer()
      const pdf = await PDFDocument.load(bytes)
      const totalPages = pdf.getPageCount()

      let pagesToExtract: number[] = []
      if (splitRange.trim()) {
        const parts = splitRange.split(',')
        for (const part of parts) {
          const range = part.trim().split('-')
          if (range.length === 2) {
            const start = Math.max(1, parseInt(range[0]))
            const end = Math.min(totalPages, parseInt(range[1]))
            for (let i = start; i <= end; i++) pagesToExtract.push(i - 1)
          } else {
            const p = parseInt(range[0])
            if (p >= 1 && p <= totalPages) pagesToExtract.push(p - 1)
          }
        }
      } else {
        pagesToExtract = Array.from({ length: totalPages }, (_, i) => i)
      }

      const newPdf = await PDFDocument.create()
      const pages = await newPdf.copyPages(pdf, pagesToExtract)
      pages.forEach((page) => newPdf.addPage(page))
      const pdfBytes = await newPdf.save()
      setResults([{ name: 'split.pdf', blob: new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' }) }])
      toast(`Split PDF — extracted ${pagesToExtract.length} page${pagesToExtract.length > 1 ? 's' : ''}`)
    } catch (err) {
      toast('Failed to split PDF', 'error')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }, [files, splitRange, toast])

  const compress = useCallback(async () => {
    if (!files.length) return
    setProcessing(true)
    setResults([])

    try {
      const compressedResults: PdfResult[] = []
      for (const file of files) {
        const bytes = await file.arrayBuffer()
        const pdf = await PDFDocument.load(bytes)
        const compressed = await pdf.save({ useObjectStreams: true })
        const name = file.name.replace('.pdf', '_compressed.pdf')
        compressedResults.push({
          name,
          blob: new Blob([compressed as unknown as BlobPart], { type: 'application/pdf' }),
          originalSize: file.size,
        })
      }
      setResults(compressedResults)
      const totalSaved = compressedResults.reduce((a, r) => a + (r.originalSize || 0) - r.blob.size, 0)
      toast(`Compressed ${compressedResults.length} PDF${compressedResults.length > 1 ? 's' : ''} — saved ${(totalSaved / 1024).toFixed(1)} KB`)
    } catch (err) {
      toast('Failed to compress PDF', 'error')
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }, [files, toast])

  const process = useCallback(() => {
    if (mode === 'merge') merge()
    else if (mode === 'split') split()
    else compress()
  }, [mode, merge, split, compress])

  const downloadOne = useCallback((result: PdfResult) => {
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.name
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const downloadAll = useCallback(() => {
    results.forEach((r) => downloadOne(r))
  }, [results, downloadOne])

  const sortedFiles = [...files].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto px-4 py-8"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div
            whileHover={{ rotate: 10 }}
            className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center"
          >
            <FileText className="w-5 h-5 text-red-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">PDF Tools</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">
          Merge, split, and compress PDFs — all in your browser.
        </p>
      </div>

      {/* Mode selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-1.5 mb-6 inline-flex gap-1"
      >
        {([
          { key: 'merge' as const, icon: Combine, label: 'Merge' },
          { key: 'split' as const, icon: Scissors, label: 'Split' },
          { key: 'compress' as const, icon: FileArchive, label: 'Compress' },
        ]).map((m) => (
          <motion.button
            key={m.key}
            onClick={() => { setMode(m.key); setFiles([]); setResults([]) }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              mode === m.key
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Mode-specific UI */}
      <AnimatePresence mode="wait">
        {mode === 'merge' && (
          <motion.div
            key="merge"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <DropZone
              onFiles={handleFiles}
              accept=".pdf"
              label="Drop PDF files to merge"
              hint={`${files.length} file${files.length !== 1 ? 's' : ''} selected`}
              className="mb-0"
            />
            {sortedFiles.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-5"
              >
                <h3 className="text-xs font-medium text-stone-400 mb-3">Files (sorted by name)</h3>
                <motion.div className="space-y-2 max-h-60 overflow-y-auto">
                  {sortedFiles.map((file, i) => (
                    <motion.div
                      key={i}
                      variants={listItem}
                      initial="hidden"
                      animate="show"
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between bg-stone-800/50 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-stone-600" />
                        <FileText className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-stone-300">{file.name}</span>
                      </div>
                      <button onClick={() => removeFile(files.indexOf(file))} className="p-1 hover:bg-stone-700 rounded-lg">
                        <X className="w-4 h-4 text-stone-500" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}

        {mode === 'split' && (
          <motion.div
            key="split"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <DropZone
              onFiles={handleFiles}
              accept=".pdf"
              multiple={false}
              label="Drop a PDF to split"
              hint="Select one PDF file"
              className="mb-0"
            />
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-5 space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-stone-400 mb-2">
                    Pages to extract (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1-3,5,7-10 (leave empty for all)"
                    value={splitRange}
                    onChange={(e) => setSplitRange(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-sm placeholder-stone-500 focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-3 bg-stone-800/50 rounded-xl px-4 py-3">
                  <FileText className="w-4 h-4 text-red-400" />
                  <span className="text-sm text-stone-300">{files[0].name}</span>
                  <button onClick={() => { setFiles([]); setResults([]) }} className="ml-auto p-1 hover:bg-stone-700 rounded-lg">
                    <X className="w-4 h-4 text-stone-500" />
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {mode === 'compress' && (
          <motion.div
            key="compress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <DropZone
              onFiles={handleFiles}
              accept=".pdf"
              label="Drop PDFs to compress"
              hint="Select one or more PDF files"
              className="mb-0"
            />
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass rounded-2xl p-5"
              >
                <motion.div className="space-y-2 max-h-60 overflow-y-auto">
                  {files.map((file, i) => (
                    <motion.div
                      key={i}
                      variants={listItem}
                      initial="hidden"
                      animate="show"
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center justify-between bg-stone-800/50 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-stone-300">{file.name}</span>
                        <span className="text-xs text-stone-500">{(file.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <button onClick={() => removeFile(i)} className="p-1 hover:bg-stone-700 rounded-lg">
                        <X className="w-4 h-4 text-stone-500" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Process button */}
      {files.length > 0 && (
        <motion.button
          onClick={process}
          disabled={processing || (mode === 'merge' && files.length < 2)}
          whileHover={{ scale: processing ? 1 : 1.01 }}
          whileTap={{ scale: processing ? 1 : 0.99 }}
          className="mt-6 w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </>
          ) : mode === 'merge' ? (
            <>
              <Combine className="w-4 h-4" />
              Merge {files.length} PDFs
            </>
          ) : mode === 'split' ? (
            <>
              <Scissors className="w-4 h-4" />
              Split PDF
            </>
          ) : (
            <>
              <FileArchive className="w-4 h-4" />
              Compress {files.length} PDF{files.length > 1 ? 's' : ''}
            </>
          )}
        </motion.button>
      )}

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass rounded-2xl p-5 mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {results.length} file{results.length > 1 ? 's' : ''} processed
                </h3>
              </div>
              {results.length > 1 && (
                <motion.button
                  onClick={downloadAll}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all duration-200 shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  Download all
                </motion.button>
              )}
            </div>
            <motion.div className="space-y-2">
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  variants={listItem}
                  initial="hidden"
                  animate="show"
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between bg-stone-800/50 rounded-xl px-4 py-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-stone-300 truncate">{r.name}</p>
                      <p className="text-xs text-stone-500">
                        {(r.blob.size / 1024).toFixed(1)} KB
                        {r.originalSize && (
                          <span className="text-emerald-400 ml-2">
                            (was {(r.originalSize / 1024).toFixed(1)} KB)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => downloadOne(r)}
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
