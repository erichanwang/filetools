import { useState, useCallback, type DragEvent } from 'react'
import { Upload, File } from 'lucide-react'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  label?: string
  hint?: string
  icon?: React.ReactNode
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
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        dropzone relative flex flex-col items-center justify-center gap-3
        p-10 border-2 border-dashed rounded-2xl cursor-pointer
        transition-all duration-200 min-h-[200px]
        ${isDragOver ? 'active border-blue-400 bg-blue-500/5' : 'border-slate-700 hover:border-slate-500'}
        ${className}
      `}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      {icon || (
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${isDragOver ? 'bg-blue-600/20' : 'bg-slate-800'}`}>
          {isDragOver ? (
            <File className="w-7 h-7 text-blue-400" />
          ) : (
            <Upload className="w-7 h-7 text-slate-400" />
          )}
        </div>
      )}
      <div className="text-center">
        <p className={`text-sm font-medium transition-colors ${isDragOver ? 'text-blue-400' : 'text-slate-300'}`}>
          {isDragOver ? 'Release to upload' : label}
        </p>
        <p className="text-xs text-slate-500 mt-1">{hint}</p>
      </div>
    </div>
  )
}
