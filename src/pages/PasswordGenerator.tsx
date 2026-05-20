import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Key, Copy, RefreshCw } from 'lucide-react'

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: 'easeOut' as const }
}

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz'
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const AMBIGUOUS = 'il1Lo0O'

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: 'Empty', color: 'text-white/20' }
  let score = 0
  if (pw.length >= 12) score += 2
  else if (pw.length >= 8) score += 1
  if (/[a-z]/.test(pw)) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^a-zA-Z0-9]/.test(pw)) score++
  if (pw.length >= 16) score++
  if (score >= 6) return { score, label: 'Very Strong', color: 'text-green-400' }
  if (score >= 4) return { score, label: 'Strong', color: 'text-amber-400' }
  if (score >= 3) return { score, label: 'Medium', color: 'text-yellow-400' }
  return { score, label: 'Weak', color: 'text-red-400' }
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(20)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [password, setPassword] = useState('')
  const { toast } = useToast()

  const generate = useCallback(() => {
    let chars = LOWERCASE
    if (includeUppercase) chars += UPPERCASE
    if (includeNumbers) chars += NUMBERS
    if (includeSymbols) chars += SYMBOLS
    if (excludeAmbiguous) {
      AMBIGUOUS.split('').forEach((c) => {
        chars = chars.replace(new RegExp(c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '')
      })
    }
    if (!chars) { toast('Enable at least one character set'); return }

    const array = new Uint32Array(length)
    crypto.getRandomValues(array)
    const pw = Array.from(array, (v) => chars[v % chars.length]).join('')
    setPassword(pw)
  }, [length, includeUppercase, includeNumbers, includeSymbols, excludeAmbiguous, toast])

  const copyPassword = useCallback(() => {
    if (!password) return
    navigator.clipboard.writeText(password)
    toast('Password copied to clipboard')
  }, [password, toast])

  const strength = getStrength(password)
  const strengthBar = Math.min(strength.score / 7 * 100, 100)

  return (
    <motion.div {...fadeIn} className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Password Generator</h1>
        <p className="text-white/50 text-sm">
          Cryptographically secure passwords with real‑time strength check
        </p>
      </div>

      {/* Output */}
      <div className="relative">
        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-3">
          <Key className="w-5 h-5 text-white/30 shrink-0" />
          <span className="flex-1 text-lg font-mono text-white truncate">
            {password || (
              <span className="text-white/20 text-base font-sans">Click generate to create a password</span>
            )}
          </span>
          <button
            onClick={copyPassword}
            disabled={!password}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-30"
          >
            <Copy className="w-4 h-4 text-white/50" />
          </button>
          <button
            onClick={generate}
            className="p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors border border-amber-500/20"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Strength meter */}
        {password && (
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">Strength</span>
              <span className={`text-xs font-medium ${strength.color}`}>{strength.label}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${strengthBar}%` }}
                className={`h-full rounded-full ${
                  strength.score >= 6 ? 'bg-green-400' :
                  strength.score >= 4 ? 'bg-amber-400' :
                  strength.score >= 3 ? 'bg-yellow-400' :
                  'bg-red-400'
                }`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70 font-medium">Length</label>
            <span className="text-sm font-mono text-white/40">{length}</span>
          </div>
          <input
            type="range"
            min={4}
            max={64}
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:shadow-lg"
          />
        </div>

        <div className="space-y-3">
          {[
            { label: 'Uppercase (A-Z)', value: includeUppercase, setter: setIncludeUppercase },
            { label: 'Numbers (0-9)', value: includeNumbers, setter: setIncludeNumbers },
            { label: 'Symbols (!@#$…)', value: includeSymbols, setter: setIncludeSymbols },
            { label: 'Exclude ambiguous (i, l, 1, L, o, 0, O)', value: excludeAmbiguous, setter: setExcludeAmbiguous },
          ].map((opt) => (
            <label key={opt.label} className="flex items-center justify-between cursor-pointer group">
              <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                {opt.label}
              </span>
              <button
                onClick={() => opt.setter(!opt.value)}
                className={`w-10 h-6 rounded-full transition-colors relative ${
                  opt.value ? 'bg-amber-500' : 'bg-white/10'
                }`}
              >
                <motion.div
                  animate={{ x: opt.value ? 18 : 2 }}
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </button>
            </label>
          ))}
        </div>

        <button
          onClick={generate}
          className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-sm transition-all border border-amber-500/20 hover:border-amber-500/40"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Generate Password
        </button>
      </div>
    </motion.div>
  )
}
