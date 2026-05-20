import { useState, useCallback, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import DropZone from '../components/DropZone'
import { useToast } from '../components/Toast'
import { Crop, Download, RefreshCw, Lock, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, ClipboardPaste } from 'lucide-react'

const ASPECTS: Record<string, number | null> = {
  'Free': null,
  '1:1': 1,
  '4:3': 4 / 3,
  '3:2': 3 / 2,
  '16:9': 16 / 9,
  '3:4': 3 / 4,
  '9:16': 9 / 16,
}

export default function ImageCropper() {
  const [source, setSource] = useState<{ file: File; url: string } | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 100, h: 100 })
  const [rot, setRot] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [aspect, setAspect] = useState('Free')
  const [dragging, setDragging] = useState(false)
  const [dragCorner, setDragCorner] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const { toast } = useToast()

  const handleFiles = useCallback((files: File[]) => {
    if (files.length) {
      if (source) { URL.revokeObjectURL(source.url); if (result) URL.revokeObjectURL(result) }
      setSource({ file: files[0], url: URL.createObjectURL(files[0]) })
      setCrop({ x: 0, y: 0, w: 100, h: 100 })
      setRot(0)
      setFlipH(false)
      setFlipV(false)
      setResult(null)
    }
  }, [source, result])

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault()
          const blob = items[i].getAsFile()
          if (blob) {
            handleFiles([new File([blob], `pasted.${blob.type.split('/')[1] || 'png'}`, { type: blob.type })])
            toast('Image pasted from clipboard')
          }
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [handleFiles, toast])

  const startDrag = useCallback((e: React.MouseEvent, corner: string) => {
    e.preventDefault()
    setDragCorner(corner)
    setDragging(true)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: MouseEvent) => {
      const preview = document.getElementById('crop-preview')
      if (!preview) return
      const rect = preview.getBoundingClientRect()
      const rx = (e.clientX - rect.left) / rect.width * 100
      const ry = (e.clientY - rect.top) / rect.height * 100
      setCrop(prev => {
        let { x, y, w, h } = prev
        if (dragCorner === 'move') {
          x = Math.max(0, Math.min(100 - w, rx - w / 2))
          y = Math.max(0, Math.min(100 - h, ry - h / 2))
        } else {
          if (dragCorner?.includes('w')) { x = Math.max(0, Math.min(prev.x + prev.w, rx)); w = prev.x + prev.w - x }
          if (dragCorner?.includes('e')) { w = Math.max(0, Math.min(100 - x, rx - x)) }
          if (dragCorner?.includes('n')) { y = Math.max(0, Math.min(prev.y + prev.h, ry)); h = prev.y + prev.h - y }
          if (dragCorner?.includes('s')) { h = Math.max(0, Math.min(100 - y, ry - y)) }
        }
        const ratio = ASPECTS[aspect]
        if (ratio && (dragCorner?.includes('e') || dragCorner?.includes('w') || dragCorner?.includes('n') || dragCorner?.includes('s'))) {
          h = w / ratio
          if (y + h > 100) { h = 100 - y; w = h * ratio }
          if (w > 100 - x) { w = 100 - x; h = w / ratio }
        }
        return { x, y, w, h }
      })
    }
    const handleUp = () => { setDragging(false); setDragCorner(null) }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp) }
  }, [dragging, dragCorner, aspect])

  const applyCrop = useCallback(() => {
    if (!source || !imgRef.current) return
    const img = imgRef.current
    const canvas = document.createElement('canvas')
    const scale = img.naturalWidth / img.width
    const sx = crop.x / 100 * img.width * scale
    const sy = crop.y / 100 * img.height * scale
    const sw = crop.w / 100 * img.width * scale
    const sh = crop.h / 100 * img.height * scale
    canvas.width = sw * (rot % 180 === 0 ? 1 : (sh / sw))
    canvas.height = sh * (rot % 180 === 0 ? 1 : (sw / sh))
    if (rot % 180 === 0) { canvas.width = sw; canvas.height = sh }
    else { canvas.width = sh; canvas.height = sw }
    const ctx = canvas.getContext('2d')!
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rot * Math.PI) / 180)
    if (flipH) ctx.scale(-1, 1)
    if (flipV) ctx.scale(1, -1)
    ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh)
    canvas.toBlob((blob) => {
      if (!blob) return
      if (result) URL.revokeObjectURL(result)
      setResult(URL.createObjectURL(blob))
      toast('Image cropped')
    }, 'image/png')
  }, [source, crop, rot, flipH, flipV, result, toast])

  const transform = `rotate(${rot}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <motion.div whileHover={{ rotate: 15 }} className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
            <Crop className="w-5 h-5 text-teal-400" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white">Image Cropper</h1>
        </div>
        <p className="text-sm text-stone-400 ml-13">Crop, rotate, and flip images with precision. Paste images from clipboard.</p>
      </div>

      {!source ? (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
          <DropZone onFiles={handleFiles} accept="image/*" multiple={false} label="Drop an image to crop"
            hint="PNG, JPEG, WebP — or Ctrl+V to paste" className="mb-6" />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 text-xs text-stone-600 -mt-3 mb-6">
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Or press <kbd className="px-1.5 py-0.5 rounded bg-stone-800 border border-stone-700 text-[10px]">Ctrl+V</kbd> to paste</span>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Aspect ratio + rotation controls */}
          <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <label className="text-xs text-stone-400 flex items-center gap-1.5"><Lock className="w-3 h-3" />Aspect</label>
            <div className="flex gap-1">
              {Object.keys(ASPECTS).map(a => (
                <motion.button key={a} onClick={() => setAspect(a)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    aspect === a ? 'bg-teal-600 text-white' : 'bg-stone-800 text-stone-400 hover:text-stone-200'}`}>{a}</motion.button>
              ))}
            </div>
            <div className="border-l border-stone-700 pl-3 flex gap-1">
              <motion.button onClick={() => setRot(r => r - 90)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400"><RotateCcw className="w-4 h-4" /></motion.button>
              <motion.button onClick={() => setRot(r => r + 90)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="p-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400"><RotateCw className="w-4 h-4" /></motion.button>
              <motion.button onClick={() => setFlipH(f => !f)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-lg transition-colors ${flipH ? 'bg-teal-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}><FlipHorizontal className="w-4 h-4" /></motion.button>
              <motion.button onClick={() => setFlipV(f => !f)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className={`p-2 rounded-lg transition-colors ${flipV ? 'bg-teal-600 text-white' : 'bg-stone-800 text-stone-400 hover:bg-stone-700'}`}><FlipVertical className="w-4 h-4" /></motion.button>
            </div>
          </div>

          {/* Crop area */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-xs font-medium text-stone-400 mb-3">Crop Area</h3>
            <div id="crop-preview" className="relative inline-block max-w-full overflow-hidden rounded-xl bg-stone-900/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={source.url} alt="Crop" style={{ transform, transition: 'transform 0.2s' }}
                className="max-w-full max-h-[500px] select-none" draggable={false} />
              {source && (
                <div className="absolute inset-0">
                  <div className="absolute inset-0 bg-black/50" />
                  <div className="absolute" style={{ left: `${crop.x}%`, top: `${crop.y}%`, width: `${crop.w}%`, height: `${crop.h}%`,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' }}>
                    <div className="absolute inset-0 border-2 border-teal-400" />
                    {['nw','ne','sw','se'].map(c => (
                      <div key={c} onMouseDown={(e) => startDrag(e, c)}
                        className={`absolute w-4 h-4 bg-teal-400 rounded-full border-2 border-stone-900 cursor-${c}-resize ${
                          c.includes('n') ? 'top-0' : 'bottom-0'} ${c.includes('w') ? 'left-0' : 'right-0'}`}
                        style={{ transform: 'translate(-50%, -50%)' }} />
                    ))}
                    <div onMouseDown={(e) => startDrag(e, 'move')}
                      className="absolute inset-0 cursor-move" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="glass rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <motion.button onClick={applyCrop} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium shadow-lg shadow-teal-600/20">
              <Crop className="w-4 h-4" />Apply Crop
            </motion.button>
            {result && (
              <motion.button onClick={() => { const a = document.createElement('a'); a.href = result; a.download = source.file.name.replace(/\.[^.]+$/, '_cropped.png'); a.click(); toast('Downloaded') }}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium shadow-lg shadow-emerald-600/20">
                <Download className="w-4 h-4" />Download
              </motion.button>
            )}
            <motion.button onClick={() => { if (source) URL.revokeObjectURL(source.url); if (result) URL.revokeObjectURL(result); setSource(null); setResult(null); setRot(0); setFlipH(false); setFlipV(false) }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-sm font-medium">
              <RefreshCw className="w-4 h-4" />New Image
            </motion.button>
          </div>

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4">
              <h3 className="text-xs font-medium text-stone-400 mb-3">Result</h3>
              <img src={result} alt="Cropped" className="max-w-full max-h-[400px] rounded-xl object-contain" />
            </motion.div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
