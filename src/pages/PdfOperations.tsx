import { useState, useCallback } from 'react'
import DropZone from '../components/DropZone'
import {
  FileText, Download, X, Combine, Scissors, FileArchive, Loader2,
  CheckCircle2, GripVertical
} from 'lucide-react'
import { PDFDocument } from 'pdf-lib'

type PdfMode = 'merge' | 'split' | 'compress'

type PdfResult = { name: string; blob: Blob; originalSize?: number }

export default function PdfOperations() {
  const [mode, setMode] = useState<PdfMode>('merge')
  const [files, setFiles] = useState<File[]>([])
  const [processing, setProcessing] = useState(false)
  const [results, setResults] = useState<PdfResult[]>([])
  const [splitRange, setSplitRange] = useState('')

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
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }, [files])

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
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }, [files, splitRange])

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
    } catch (err) {
      console.error(err)
    } finally {
      setProcessing(false)
    }
  }, [files])

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
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">PDF Tools</h1>
        </div>
        <p className="text-sm text-slate-400 ml-13">
          Merge, split, and compress PDFs — all in your browser.
        </p>
      </div>

      {/* Mode selector */}
      <div className="glass rounded-2xl p-1.5 mb-6 inline-flex gap-1">
        {([
          { key: 'merge' as const, icon: Combine, label: 'Merge' },
          { key: 'split' as const, icon: Scissors, label: 'Split' },
          { key: 'compress' as const, icon: FileArchive, label: 'Compress' },
        ]).map((m) => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setFiles([]); setResults([]) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              mode === m.key
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Mode-specific UI */}
      {mode === 'merge' && (
        <div className="space-y-6">
          <DropZone
            onFiles={handleFiles}
            accept=".pdf"
            label="Drop PDF files to merge"
            hint={`${files.length} file${files.length !== 1 ? 's' : ''} selected`}
            className="mb-0"
          />
          {sortedFiles.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h3 className="text-xs font-medium text-slate-400 mb-3">Files (sorted by name)</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sortedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-slate-600" />
                      <FileText className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-slate-300">{file.name}</span>
                    </div>
                    <button onClick={() => removeFile(files.indexOf(file))} className="p-1 hover:bg-slate-700 rounded-lg">
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'split' && (
        <div className="space-y-6">
          <DropZone
            onFiles={handleFiles}
            accept=".pdf"
            multiple={false}
            label="Drop a PDF to split"
            hint="Select one PDF file"
            className="mb-0"
          />
          {files.length > 0 && (
            <div className="glass rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Pages to extract (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1-3,5,7-10 (leave empty for all)"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3">
                <FileText className="w-4 h-4 text-red-400" />
                <span className="text-sm text-slate-300">{files[0].name}</span>
                <button onClick={() => { setFiles([]); setResults([]) }} className="ml-auto p-1 hover:bg-slate-700 rounded-lg">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'compress' && (
        <div className="space-y-6">
          <DropZone
            onFiles={handleFiles}
            accept=".pdf"
            label="Drop PDFs to compress"
            hint="Select one or more PDF files"
            className="mb-0"
          />
          {files.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-slate-300">{file.name}</span>
                      <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button onClick={() => removeFile(i)} className="p-1 hover:bg-slate-700 rounded-lg">
                      <X className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Process button */}
      {files.length > 0 && (
        <button
          onClick={process}
          disabled={processing || (mode === 'merge' && files.length < 2)}
          className="mt-6 w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2"
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
        </button>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="glass rounded-2xl p-5 mt-6 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">
                {results.length} file{results.length > 1 ? 's' : ''} processed
              </h3>
            </div>
            {results.length > 1 && (
              <button
                onClick={downloadAll}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-all duration-200"
              >
                <Download className="w-4 h-4" />
                Download all
              </button>
            )}
          </div>
          <div className="space-y-2">
            {results.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-300 truncate">{r.name}</p>
                    <p className="text-xs text-slate-500">
                      {(r.blob.size / 1024).toFixed(1)} KB
                      {r.originalSize && (
                        <span className="text-emerald-400 ml-2">
                          (was {(r.originalSize / 1024).toFixed(1)} KB)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => downloadOne(r)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
