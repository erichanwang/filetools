import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const nameMap: Record<string, string> = {
  'file-converter': 'File Converter',
  'background-remover': 'Background Remover',
  'image-compressor': 'Image Compressor',
  'image-filters': 'Image Filters',
  'image-cropper': 'Image Cropper',
  'image-to-pdf': 'Image to PDF',
  'qr-generator': 'QR Generator',
  'color-palette': 'Color Palette',
  'ascii-art': 'ASCII Art',
  'pdf-operations': 'PDF Tools',
  'ocr': 'OCR',
  'metadata-viewer': 'Metadata Viewer',
  'batch-rename': 'Batch Rename',
  'exif-tool': 'EXIF Tool',
  'file-checksum': 'File Checksum',
  'base64': 'Base64',
  'json-tool': 'JSON Tool',
  'csv-viewer': 'CSV Viewer',
  'jwt-decoder': 'JWT Decoder',
  'text-tools': 'Text Tools',
  'password-generator': 'Password Generator',
  'color-converter': 'Color Converter',
  'unit-converter': 'Unit Converter',
}

export default function Breadcrumbs() {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm mb-6">
      <Link
        to="/"
        className="p-1 rounded-lg hover:bg-white/5 transition-colors text-white/20 hover:text-white/40"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1
        const label = nameMap[seg] || seg.replace(/-/g, ' ')
        return (
          <div key={seg} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-white/10" />
            <Link
              to={`/${segments.slice(0, i + 1).join('/')}`}
              className={`capitalize transition-colors ${
                isLast
                  ? 'text-white/40 pointer-events-none'
                  : 'text-white/20 hover:text-white/40'
              }`}
            >
              {label}
            </Link>
          </div>
        )
      })}
    </nav>
  )
}
