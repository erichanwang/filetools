import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Shuffle, Eraser, Zap, Palette, FileText, Eye,
  FileType, Pencil, FileImage, FileJson, QrCode,
  SwatchBook, Camera, Fingerprint, Code, Table,
  Shield, Keyboard, Type, ArrowLeftRight, Sparkles,
  Crop, Layout, Cpu, Download
} from 'lucide-react'

const categories = [
  {
    label: 'Image Tools',
    features: [
      { to: '/file-converter', icon: Shuffle, title: 'File Converter', desc: 'Convert between PNG, JPEG, WebP, BMP, GIF, ICO formats' },
      { to: '/background-remover', icon: Eraser, title: 'Background Remover', desc: 'AI-powered background removal with progress tracking' },
      { to: '/image-compressor', icon: Zap, title: 'Image Compressor', desc: 'Compress & resize images with quality control' },
      { to: '/image-filters', icon: Palette, title: 'Image Filters', desc: 'Brightness, contrast, saturation & creative presets' },
      { to: '/image-cropper', icon: Crop, title: 'Image Cropper', desc: 'Interactive crop with aspect ratio presets' },
      { to: '/image-to-pdf', icon: FileImage, title: 'Image to PDF', desc: 'Convert images directly to PDF documents' },
      { to: '/ascii-art', icon: Type, title: 'ASCII Art', desc: 'Transform images into ASCII text art' },
      { to: '/color-palette', icon: SwatchBook, title: 'Color Palette', desc: 'Extract color palettes from images' },
    ],
  },
  {
    label: 'Document Tools',
    features: [
      { to: '/pdf-operations', icon: FileText, title: 'PDF Tools', desc: 'Merge, split & compress PDFs' },
      { to: '/ocr', icon: Eye, title: 'OCR', desc: 'Extract text from images with progress tracking' },
      { to: '/metadata-viewer', icon: FileType, title: 'Metadata Viewer', desc: 'View file size, type, dimensions & EXIF' },
      { to: '/batch-rename', icon: Pencil, title: 'Batch Rename', desc: 'Rename files with find/replace, prefixes & numbering' },
      { to: '/exif-tool', icon: Camera, title: 'EXIF Tool', desc: 'View and extract camera metadata from photos' },
      { to: '/file-checksum', icon: Fingerprint, title: 'File Checksum', desc: 'Calculate MD5, SHA-1, SHA-256 & more' },
    ],
  },
  {
    label: 'Data & Text',
    features: [
      { to: '/json-tool', icon: FileJson, title: 'JSON Tool', desc: 'Format, validate & prettify JSON' },
      { to: '/csv-viewer', icon: Table, title: 'CSV Viewer', desc: 'View CSV as a sortable table with filtering' },
      { to: '/jwt-decoder', icon: Shield, title: 'JWT Decoder', desc: 'Decode and inspect JWT tokens' },
      { to: '/text-tools', icon: Type, title: 'Text Tools', desc: 'Word counter, case convert, markdown & diff' },
      { to: '/base64', icon: Code, title: 'Base64', desc: 'Encode/decode text, files & images to Base64' },
    ],
  },
  {
    label: 'Generators & Converters',
    features: [
      { to: '/qr-generator', icon: QrCode, title: 'QR Generator', desc: 'Create QR codes from URLs, text & more' },
      { to: '/color-converter', icon: Palette, title: 'Color Converter', desc: 'Convert between HEX, RGB & HSL' },
      { to: '/unit-converter', icon: ArrowLeftRight, title: 'Unit Converter', desc: 'Length, weight, temperature, time & data' },
      { to: '/password-generator', icon: Keyboard, title: 'Password Generator', desc: 'Crypto-random secure passwords with strength check' },
    ],
  },
]

const stats = [
  { icon: Layout, value: '24', label: 'Tools' },
  { icon: Cpu, value: '100%', label: 'Client‑side' },
  { icon: Download, value: '0', label: 'Uploads' },
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-5 py-8"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium">
          <Sparkles className="w-3 h-3" />
          24 local‑first tools
        </div>
        <div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-amber-400 via-rose-400 to-amber-500 bg-clip-text text-transparent animate-shimmer [background-size:200%_auto]">
              FileTools
            </span>
          </h1>
          <p className="text-white/30 mt-4 text-sm sm:text-base max-w-lg mx-auto font-light">
            Everything you need for files, images, PDFs, and data — all processed securely in your browser.
          </p>
        </div>

        {/* Stats */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="flex justify-center gap-4 pt-2"
        >
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={item}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/5"
            >
              <s.icon className="w-4 h-4 text-white/20" />
              <span className="text-sm font-medium text-white/60">{s.value}</span>
              <span className="text-xs text-white/20">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Feature categories */}
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-12">
        {categories.map((cat) => (
          <div key={cat.label}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/15 mb-4 px-1">
              {cat.label}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {cat.features.map((f) => (
                <motion.div
                  key={f.to}
                  variants={item}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(f.to)}
                  className="group relative bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 cursor-pointer
                    hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.04] to-rose-500/[0.04]" />
                  </div>
                  <div className="relative space-y-3">
                    <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center
                      group-hover:bg-amber-500/10 group-hover:border-amber-500/20 transition-all duration-300">
                      <f.icon className="w-4 h-4 text-white/25 group-hover:text-amber-300 transition-colors duration-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-white/70 group-hover:text-white/90 transition-colors duration-300">
                        {f.title}
                      </h3>
                      <p className="text-xs text-white/20 mt-1 leading-relaxed group-hover:text-white/30 transition-colors duration-300">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center pb-8"
      >
        <p className="text-xs text-white/10">
          No servers. No uploads. Your files never leave your device.
        </p>
      </motion.div>
    </div>
  )
}
