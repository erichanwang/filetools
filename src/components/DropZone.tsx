import { useState, useCallback, type DragEvent, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Upload, File } from 'lucide-react'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  label?: string
  hint?: string
  icon?: ReactNode
  className?: string
}

export default function DropZone({
  onFiles,
  accept,
  multiple = true,
  label = 'Drop files here',
  hint = 'or click to browse',
  icon,
  className = '',
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      const files = Array.from(e.dataTransfer.files)
      if (files.length) onFiles(files)
    },
    [onFiles],
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length) onFiles(files)
    },
    [onFiles],
  )

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        dropzone relative flex flex-col items-center justify-center gap-4
        p-10 border-2 border-dashed rounded-2xl cursor-pointer
        transition-all duration-300 min-h-[200px]
        ${isDragOver
          ? 'border-amber-400 bg-amber-500/5 scale-[1.01]'
          : 'border-stone-700/50 hover:border-stone-500 bg-stone-900/20'
        }
        ${className}
      `}
    >
      {/* Pulsing border glow on drag */}
      {isDragOver && (
        <motion.div
          className="absolute inset-0 rounded-2xl"
          animate={{ boxShadow: ['0 0 0px rgba(217,119,6,0)', '0 0 30px rgba(217,119,6,0.15)', '0 0 0px rgba(217,119,6,0)'] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />

      {icon || (
        <motion.div
          animate={isDragOver ? { scale: [1, 1.1, 1], y: [0, -4, 0] } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isDragOver ? 'bg-amber-600/20 shadow-lg shadow-amber-600/10' : 'bg-stone-800/50'
          }`}
        >
          {isDragOver ? (
            <File className="w-7 h-7 text-amber-400" />
          ) : (
            <Upload className="w-7 h-7 text-stone-500" />
          )}
        </motion.div>
      )}

      <div className="text-center relative z-0">
        <motion.p
          animate={isDragOver ? { color: '#fbbf24' } : { color: '#d6d3d1' }}
          className="text-sm font-medium"
        >
          {isDragOver ? 'Release to upload' : label}
        </motion.p>
        <p className="text-xs text-stone-500 mt-1.5">{hint}</p>
      </div>
    </motion.div>
  )
}
