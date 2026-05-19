import { useNavigate } from 'react-router-dom'
import {
  FileUp, Scissors, Shrink, SlidersHorizontal,
  FileText, ScanText, Info, Pencil, ArrowRight, Sparkles, Shield, Zap
} from 'lucide-react'

const features = [
  {
    to: '/convert',
    icon: FileUp,
    title: 'File Converter',
    desc: 'Convert between image formats — PNG, JPEG, WebP, BMP, and more.',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
  },
  {
    to: '/remove-bg',
    icon: Scissors,
    title: 'Background Remover',
    desc: 'Remove image backgrounds instantly with AI-powered detection.',
    color: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500/10',
  },
  {
    to: '/compress',
    icon: Shrink,
    title: 'Image Compressor',
    desc: 'Compress and resize images while maintaining quality. Supports batch processing.',
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
  },
  {
    to: '/filters',
    icon: SlidersHorizontal,
    title: 'Image Filters',
    desc: 'Apply brightness, contrast, saturation, blur, and more adjustments.',
    color: 'from-orange-500 to-yellow-500',
    bg: 'bg-orange-500/10',
  },
  {
    to: '/pdf',
    icon: FileText,
    title: 'PDF Tools',
    desc: 'Merge multiple PDFs, split pages, compress, and extract pages.',
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-500/10',
  },
  {
    to: '/ocr',
    icon: ScanText,
    title: 'OCR Text Extraction',
    desc: 'Extract text from images using optical character recognition.',
    color: 'from-indigo-500 to-violet-500',
    bg: 'bg-indigo-500/10',
  },
  {
    to: '/metadata',
    icon: Info,
    title: 'Metadata Viewer',
    desc: 'View detailed metadata for images, documents, and other file types.',
    color: 'from-cyan-500 to-sky-500',
    bg: 'bg-cyan-500/10',
  },
  {
    to: '/rename',
    icon: Pencil,
    title: 'Batch Rename',
    desc: 'Rename multiple files at once with patterns, numbering, and find/replace.',
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
  },
]

const highlights = [
  { icon: Shield, title: 'Private & Secure', desc: 'All processing happens locally in your browser. Files never leave your device.' },
  { icon: Zap, title: 'Fast & Efficient', desc: 'Optimized algorithms for quick processing, even with large files.' },
  { icon: Sparkles, title: 'No Signup Required', desc: 'Start using all features immediately — no account needed.' },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-sm text-slate-300 mb-6">
          <Sparkles className="w-4 h-4 text-blue-400" />
          All-in-one file operations toolkit
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold mb-4">
          <span className="gradient-text">FileTools</span>
          <span className="text-white"> — Your File Swiss Army Knife</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Convert, compress, edit, extract, and manage your files — all from the browser.
          No uploads to any server. Private. Fast. Free.
        </p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {highlights.map((h) => (
          <div key={h.title} className="glass rounded-2xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
              <h.icon className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">{h.title}</h3>
              <p className="text-xs text-slate-400">{h.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feature grid */}
      <h2 className="text-xl font-bold text-white mb-6">Features</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((f, i) => (
          <button
            key={f.to}
            onClick={() => navigate(f.to)}
            className="group glass rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:border-slate-600 hover:shadow-lg hover:shadow-blue-500/5"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
              <f.icon className={`w-6 h-6 bg-gradient-to-br ${f.color} bg-clip-text text-transparent`} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-semibold text-white">{f.title}</h3>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
