import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Copy, ArrowLeftRight } from 'lucide-react'

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const }
}

type Format = 'hex' | 'rgb' | 'hsl'

function hexToRgb(hex: string) {
  hex = hex.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('')
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToRgb(h: number, s: number, l: number) {
  s /= 100; l /= 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs((h / 60) % 2 - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) }
}

function parseRgb(input: string) {
  const match = input.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i)
    || input.match(/^(\d+),\s*(\d+),\s*(\d+)$/)
  if (match) return { r: +match[1], g: +match[2], b: +match[3] }
  return null
}

function parseHsl(input: string) {
  const match = input.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/i)
    || input.match(/^(\d+),\s*(\d+)%?,\s*(\d+)%?$/)
  if (match) return { h: +match[1], s: +match[2], l: +match[3] }
  return null
}

export default function ColorConverter() {
  const [input, setInput] = useState('')
  const [fromFormat, setFromFormat] = useState<Format>('hex')
  const [color, setColor] = useState<{ hex: string; rgb: string; hsl: string; r: number; g: number; b: number } | null>(null)
  const { toast } = useToast()

  const parse = useCallback(() => {
    try {
      if (fromFormat === 'hex') {
        const rgb = hexToRgb(input.trim())
        if (!rgb) { toast('Invalid hex color'); return }
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
        setColor({
          hex: rgbToHex(rgb.r, rgb.g, rgb.b),
          rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
          ...rgb
        })
      } else if (fromFormat === 'rgb') {
        const rgb = parseRgb(input.trim())
        if (!rgb) { toast('Use format: rgb(R, G, B) or R, G, B'); return }
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
        setColor({
          hex: rgbToHex(rgb.r, rgb.g, rgb.b),
          rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
          ...rgb
        })
      } else {
        const hsl = parseHsl(input.trim())
        if (!hsl) { toast('Use format: hsl(H, S%, L%) or H, S, L'); return }
        const rgb = hslToRgb(hsl.h, hsl.s, hsl.l)
        setColor({
          hex: rgbToHex(rgb.r, rgb.g, rgb.b),
          rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
          ...rgb
        })
      }
    } catch { toast('Invalid color input') }
  }, [input, fromFormat, toast])

  const copyValue = (v: string) => { navigator.clipboard.writeText(v); toast('Copied') }

  return (
    <motion.div {...fadeIn} className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Color Converter</h1>
        <p className="text-white/50 text-sm">Convert between HEX, RGB, and HSL color formats</p>
      </div>

      {/* Input */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
        <div className="flex gap-2">
          {([{ id: 'hex' as const, label: 'HEX' }, { id: 'rgb' as const, label: 'RGB' }, { id: 'hsl' as const, label: 'HSL' }]).map((f) => (
            <button
              key={f.id}
              onClick={() => { setFromFormat(f.id); setColor(null); setInput('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                fromFormat === f.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-white/40 hover:text-white/60 border border-transparent'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && parse()}
            placeholder={
              fromFormat === 'hex' ? '#ff6600 or ff6600' :
              fromFormat === 'rgb' ? 'rgb(255, 102, 0) or 255,102,0' :
              'hsl(25, 100%, 50%) or 25,100,50'
            }
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 font-mono"
          />
          <button
            onClick={parse}
            className="px-5 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium transition-all border border-amber-500/20"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Results */}
      {color && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
        >
          {/* Color preview */}
          <div
            className="h-32 w-full"
            style={{ backgroundColor: color.hex }}
          />
          <div className="p-5 space-y-3">
            {[
              { label: 'HEX', value: color.hex },
              { label: 'RGB', value: color.rgb },
              { label: 'HSL', value: color.hsl },
              { label: 'R', value: String(color.r) },
              { label: 'G', value: String(color.g) },
              { label: 'B', value: String(color.b) },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-xs text-white/30 font-mono w-8">{item.label}</span>
                <span className="flex-1 font-mono text-sm text-white/80 ml-4">{item.value}</span>
                <button
                  onClick={() => copyValue(item.value)}
                  className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-white/30" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
