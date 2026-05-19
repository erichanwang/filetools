import { useState, useCallback } from 'react'
import { recognize } from 'tesseract.js'
import DropZone from '../components/DropZone'
import { ScanText, Copy, Loader2, Check, Image, FileText } from 'lucide-react'

export default function OcrPage() {
  const [source, setSource] = useState<{ file: File; url: string } | null>(null)
  const [text, setText] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState<{ status: string; progress: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleFiles = useCallback((files: File[]) => {
    if (files.length) {
      if (source) URL.revokeObjectURL(source.url)
      setSource({ file: files[0], url: URL.createObjectURL(files[0]) })
      setText(null)
      setError(null)
      setProgress(null)
    }
  }, [source])

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
            setProgress({
              status: 'Recognizing text...',
              progress: Math.round(m.progress * 100),
            })
          } else {
            setProgress({ status: m.status, progress: m.progress ? Math.round(m.progress * 100) : 0 })
          }
        },
      })

      setText(result.data.text || '(No text detected)')
      setProgress(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR failed')
      setProgress(null)
    } finally {
      setProcessing(false)
    }
  }, [source])

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
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <ScanText className="w-5 h-5 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">OCR Text Extraction</h1>
        </div>
        <p className="text-sm text-slate-400 ml-13">
          Extract text from images using optical character recognition. Supports English.
        </p>
      </div>

      {!source ? (
        <DropZone
          onFiles={handleFiles}
          accept="image/*"
          multiple={false}
          label="Drop an image to extract text"
          hint="PNG, JPEG — clearer images yield better results"
          className="mb-6"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Image preview */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-xs font-medium text-slate-400 mb-3">Source Image</h3>
            <div className="aspect-square rounded-xl overflow-hidden bg-slate-900/50 flex items-center justify-center">
              <img
                src={source.url}
                alt="Source"
                className="max-w-full max-h-full object-contain"
              />
            </div>
          </div>

          {/* Text output */}
          <div className="glass rounded-2xl p-4 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-slate-400">Extracted Text</h3>
              {text && (
                <button
                  onClick={copyText}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-400 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}
            </div>
            <div className="flex-1 rounded-xl bg-slate-900/50 border border-slate-800 p-4 overflow-y-auto min-h-[300px]">
              {processing ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  {progress && (
                    <div className="text-center">
                      <p className="text-sm text-slate-300">{progress.status}</p>
                      <div className="w-48 h-1.5 bg-slate-700 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              ) : text ? (
                <pre className="text-sm text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                  {text}
                </pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-3">
                  <FileText className="w-10 h-10 text-slate-700" />
                  <p className="text-xs text-slate-500">Click "Extract Text" to begin</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      {source && (
        <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <button
            onClick={extract}
            disabled={processing}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium transition-all duration-200"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Extracting...
              </>
            ) : (
              <>
                <ScanText className="w-4 h-4" />
                Extract Text
              </>
            )}
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-all duration-200"
          >
            <Image className="w-4 h-4" />
            New Image
          </button>
        </div>
      )}
    </div>
  )
}
