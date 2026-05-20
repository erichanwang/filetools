import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Copy, ArrowLeftRight, Ruler, Thermometer, Weight, Clock, Droplets, History, Trash2 } from 'lucide-react'

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const }
}

type Category = 'length' | 'temperature' | 'weight' | 'time' | 'data'

const categories: { id: Category; label: string; icon: typeof Ruler }[] = [
  { id: 'length', label: 'Length', icon: Ruler },
  { id: 'weight', label: 'Weight', icon: Weight },
  { id: 'temperature', label: 'Temp', icon: Thermometer },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'data', label: 'Data', icon: Droplets },
]

const units: Record<Category, { id: string; label: string }[]> = {
  length: [
    { id: 'mm', label: 'Millimeters' }, { id: 'cm', label: 'Centimeters' },
    { id: 'm', label: 'Meters' }, { id: 'km', label: 'Kilometers' },
    { id: 'in', label: 'Inches' }, { id: 'ft', label: 'Feet' },
    { id: 'yd', label: 'Yards' }, { id: 'mi', label: 'Miles' },
  ],
  weight: [
    { id: 'mg', label: 'Milligrams' }, { id: 'g', label: 'Grams' },
    { id: 'kg', label: 'Kilograms' }, { id: 't', label: 'Tons' },
    { id: 'oz', label: 'Ounces' }, { id: 'lb', label: 'Pounds' },
  ],
  temperature: [
    { id: 'c', label: 'Celsius' }, { id: 'f', label: 'Fahrenheit' },
    { id: 'k', label: 'Kelvin' },
  ],
  time: [
    { id: 'ms', label: 'Milliseconds' }, { id: 's', label: 'Seconds' },
    { id: 'min', label: 'Minutes' }, { id: 'hr', label: 'Hours' },
    { id: 'day', label: 'Days' }, { id: 'wk', label: 'Weeks' },
    { id: 'yr', label: 'Years' },
  ],
  data: [
    { id: 'b', label: 'Bytes' }, { id: 'kb', label: 'Kilobytes' },
    { id: 'mb', label: 'Megabytes' }, { id: 'gb', label: 'Gigabytes' },
    { id: 'tb', label: 'Terabytes' }, { id: 'pb', label: 'Petabytes' },
  ],
}

// All conversions via base unit
function toBase(value: number, from: string): number {
  switch (from) {
    case 'mm': return value / 1000; case 'cm': return value / 100
    case 'km': return value * 1000; case 'in': return value * 0.0254
    case 'ft': return value * 0.3048; case 'yd': return value * 0.9144
    case 'mi': return value * 1609.344; case 'm': return value
    case 'mg': return value / 1000; case 'kg': return value * 1000
    case 't': return value * 1_000_000; case 'oz': return value * 28.3495
    case 'lb': return value * 453.592; case 'g': return value
    case 'c': return value; case 'f': return (value - 32) * 5/9
    case 'k': return value - 273.15
    case 'ms': return value / 1000; case 'min': return value * 60
    case 'hr': return value * 3600; case 'day': return value * 86400
    case 'wk': return value * 604800; case 'yr': return value * 31536000
    case 's': return value
    case 'kb': return value * 1024; case 'mb': return value * 1024 * 1024
    case 'gb': return value * 1024 * 1024 * 1024
    case 'tb': return value * 1024 * 1024 * 1024 * 1024
    case 'pb': return value * 1024 * 1024 * 1024 * 1024 * 1024
    case 'b': return value
    default: return value
  }
}

function fromBase(value: number, to: string): number {
  switch (to) {
    case 'mm': return value * 1000; case 'cm': return value * 100
    case 'km': return value / 1000; case 'in': return value / 0.0254
    case 'ft': return value / 0.3048; case 'yd': return value / 0.9144
    case 'mi': return value / 1609.344; case 'm': return value
    case 'mg': return value * 1000; case 'kg': return value / 1000
    case 't': return value / 1_000_000; case 'oz': return value / 28.3495
    case 'lb': return value / 453.592; case 'g': return value
    case 'c': return value; case 'f': return value * 9/5 + 32
    case 'k': return value + 273.15
    case 'ms': return value * 1000; case 'min': return value / 60
    case 'hr': return value / 3600; case 'day': return value / 86400
    case 'wk': return value / 604800; case 'yr': return value / 31536000
    case 's': return value
    case 'kb': return value / 1024; case 'mb': return value / 1024 / 1024
    case 'gb': return value / 1024 / 1024 / 1024
    case 'tb': return value / 1024 / 1024 / 1024 / 1024
    case 'pb': return value / 1024 / 1024 / 1024 / 1024 / 1024
    case 'b': return value
    default: return value
  }
}

const HISTORY_KEY = 'unitconverter-history'
const MAX_HISTORY = 10

interface HistoryEntry {
  from: string
  to: string
  input: string
  result: string
  category: Category
}

export default function UnitConverter() {
  const [category, setCategory] = useState<Category>('length')
  const [fromUnit, setFromUnit] = useState('cm')
  const [toUnit, setToUnit] = useState('in')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
  })
  const { toast } = useToast()

  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)) }, [history])

  const result = (() => {
    const val = parseFloat(input)
    if (isNaN(val)) return ''
    const base = toBase(val, fromUnit)
    const converted = fromBase(base, toUnit)
    const formatted = Math.round(converted * 1_000_000) / 1_000_000
    return String(formatted)
  })()

  const swap = () => {
    setFromUnit(toUnit)
    setToUnit(fromUnit)
  }

  const copyResult = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    toast('Copied')
    // Add to history
    setHistory((prev) => {
      const entry: HistoryEntry = { from: fromUnit, to: toUnit, input, result, category }
      return [entry, ...prev.filter((e) => e.input !== input || e.from !== fromUnit || e.to !== toUnit)].slice(0, MAX_HISTORY)
    })
  }

  return (
    <motion.div {...fadeIn} className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Unit Converter</h1>
        <p className="text-white/50 text-sm">Convert between length, weight, temperature, time &amp; data units</p>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-1.5 bg-white/5 rounded-xl p-1 border border-white/10">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCategory(c.id)
              const unitIds = units[c.id].map((u) => u.id)
              setFromUnit(unitIds[0])
              setToUnit(unitIds.length > 1 ? unitIds[1] : unitIds[0])
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              category === c.id
                ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <c.icon className="w-3.5 h-3.5" />
            {c.label}
          </button>
        ))}
      </div>

      {/* Converter card */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
        {/* From */}
        <div className="space-y-2">
          <label className="text-xs text-white/30 font-medium uppercase tracking-wider">From</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter value…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500/50 font-mono"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white/80 focus:outline-none focus:border-amber-500/50 appearance-none min-w-[110px]"
            >
              {units[category].map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap */}
        <div className="flex justify-center">
          <motion.button
            onClick={swap}
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="p-2 rounded-full bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 transition-all text-white/30 hover:text-amber-300"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </motion.button>
        </div>

        {/* To */}
        <div className="space-y-2">
          <label className="text-xs text-white/30 font-medium uppercase tracking-wider">To</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white flex items-center">
              {result || <span className="text-white/20 font-sans">Result</span>}
            </div>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white/80 focus:outline-none focus:border-amber-500/50 appearance-none min-w-[110px]"
            >
              {units[category].map((u) => (
                <option key={u.id} value={u.id}>{u.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Copy result */}
        {result && (
          <button
            onClick={copyResult}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white/50 hover:text-white/80 transition-all"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy result
          </button>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/30">
              <History className="w-3.5 h-3.5" />
              Recent conversions
            </div>
            <button
              onClick={() => { setHistory([]); localStorage.removeItem(HISTORY_KEY) }}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
              title="Clear history"
            >
              <Trash2 className="w-3 h-3 text-white/20" />
            </button>
          </div>
          <div className="space-y-1.5">
            <AnimatePresence>
              {history.map((entry, i) => (
                <motion.button
                  key={`${entry.input}-${entry.from}-${entry.to}-${i}`}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => {
                    setCategory(entry.category)
                    setFromUnit(entry.from)
                    setToUnit(entry.to)
                    setInput(entry.input)
                  }}
                  className="w-full flex items-center gap-3 bg-white/5 border border-white/5 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors text-left"
                >
                  <span className="text-xs font-mono text-white/60">
                    {entry.input} {entry.from}
                  </span>
                  <ArrowLeftRight className="w-3 h-3 text-white/20" />
                  <span className="text-xs font-mono text-amber-300">
                    {entry.result} {entry.to}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(entry.result)
                      toast('Copied')
                    }}
                    className="ml-auto p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    <Copy className="w-3 h-3 text-white/20" />
                  </button>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  )
}
