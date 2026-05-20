import { useState, useEffect } from 'react'
import { File as FileIcon, Image, Film, Music, X, Maximize2 } from 'lucide-react'

interface Props {
  file: File
  onRemove?: () => void
}

const typeIcons: Record<string, React.FC<{ className?: string }>> = {
  image: Image,
  video: Film,
  audio: Music,
}

export default function FilePreview({ file, onRemove }: Props) {
  const [url, setUrl] = useState<string>('')
  const [expanded, setExpanded] = useState(false)
  const isImage = file.type.startsWith('image/')

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const TypeIcon = typeIcons[file.type.split('/')[0] as keyof typeof typeIcons] || FileIcon

  return (
    <>
      <div className="relative group shrink-0">
        {/* Preview */}
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/5 border border-white/5">
          {isImage && url ? (
            <img
              src={url}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TypeIcon className="w-7 h-7 text-white/15" />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
            {isImage && (
              <button
                onClick={() => setExpanded(true)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5 text-white/80" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="w-3.5 h-3.5 text-white/80" />
              </button>
            )}
          </div>
        </div>

        {/* Name */}
        <p className="text-[10px] text-white/20 mt-1 truncate w-20 text-center">
          {file.name.length > 12 ? file.name.slice(0, 10) + '…' : file.name}
        </p>
      </div>

      {/* Lightbox */}
      {expanded && isImage && url && (
        <div
          className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-xl flex items-center justify-center p-8"
          onClick={() => setExpanded(false)}
        >
          <img
            src={url}
            alt={file.name}
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
          />
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-6 right-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}
    </>
  )
}
