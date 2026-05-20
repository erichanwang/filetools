import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../components/Toast'
import { Key, Copy, RefreshCw, History, Trash2, Sparkles } from 'lucide-react'

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

const PASSPHRASE_WORDS = [
  'amber','anchor','azure','badge','basin','bloom','brisk','cabin','cargo','cedar',
  'coral','crane','delta','dune','eagle','ember','flame','flora','frost','garnet',
  'glacier','haven','hazel','iris','ivory','jade','koi','lagoon','lotus','maple',
  'marble','marsh','meadow','nova','oasis','olive','opal','orbit','pearl','pine',
  'quartz','raven','reef','ridge','river','robin','sage','silk','slate','sparrow',
  'stone','storm','summit','taiga','thorn','tide','timber','valley','willow','zephyr'
]

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

const HISTORY_KEY = 'passwordgen-history'
const MAX_HISTORY = 8

export default function PasswordGenerator() {
  const [length, setLength] = useState(20)
  const [includeUppercase, setIncludeUppercase] = useState(true)
  const [includeNumbers, setIncludeNumbers] = useState(true)
  const [includeSymbols, setIncludeSymbols] = useState(true)
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [mode, setMode] = useState<'password' | 'passphrase'>('password')
  const [wordCount, setWordCount] = useState(5)
  const [separator, setSeparator] = useState('-')
  const [password, setPassword] = useState('')
  const [history, setHistory] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
  })
  const { toast } = useToast()

  useEffect(() => { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)) }, [history])

  const addToHistory = useCallback((pw: string) => {
    setHistory((prev) => [pw, ...prev.filter((h) => h !== pw)].slice(0, MAX_HISTORY))
  }, [])

  const generatePassword = useCallback(() => {
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
    addToHistory(pw)
  }, [length, includeUppercase, includeNumbers, includeSymbols, excludeAmbiguous, toast, addToHistory])

  const generatePassphrase = useCallback(() => {
    const array = new Uint32Array(wordCount)
    crypto.getRandomValues(array)
    const words = Array.from(array, (v) => PASSPHRASE_WORDS[v % PASSPHRASE_WORDS.length])
    // Capitalize first word
    words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1)
    const pw = words.join(separator)
    setPassword(pw)
    addToHistory(pw)
  }, [wordCount, separator, addToHistory])

  const generate = () => {
    if (mode === 'passphrase') generatePassphrase()
    else generatePassword()
  }

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

      {/* Mode toggle */}
      <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/10">
        {([
          { id: 'password' as const, label: 'Password', icon: Key },
          { id: 'passphrase' as const, label: 'Passphrase', icon: Sparkles },
        ]).map((m) => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setPassword('') }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === m.id
                ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <m.icon className="w-4 h-4" />
            {m.label}
          </button>
        ))}
      </div>

      {/* Output */}
      <div className="relative">
        <div className="w-full bg-white/5 border border-white/10 rounded-xl p-5 flex items-center gap-3">
          <Key className="w-5 h-5 text-white/30 shrink-0" />
          <span className="flex-1 text-lg font-mono text-white truncate">
            {password || (
              <span className="text-white/20 text-base font-sans">Click generate to create a {mode}</span>
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
        {mode === 'password' ? (
          <>
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
                className="w-full"
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
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-white/70 font-medium">Words</label>
                <span className="text-sm font-mono text-white/40">{wordCount}</span>
              </div>
              <input
                type="range"
                min={3}
                max={10}
                value={wordCount}
                onChange={(e) => setWordCount(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-white/70 font-medium">Separator</label>
              <div className="flex gap-2">
                {(['-', '.', '_', ' ', '#']).map((sep) => (
                  <button
                    key={sep}
                    onClick={() => setSeparator(sep)}
                    className={`w-10 h-10 rounded-lg text-sm font-mono transition-all ${
                      separator === sep
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-white/5 text-white/40 border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {sep === ' ' ? '␣' : sep}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <button
          onClick={generate}
          className="w-full py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-sm transition-all border border-amber-500/20 hover:border-amber-500/40"
        >
          <RefreshCw className="w-4 h-4 inline mr-2" />
          Generate {mode === 'passphrase' ? 'Passphrase' : 'Password'}
        </button>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-white/30">
              <History className="w-3.5 h-3.5" />
              Recent
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
              {history.map((pw, i) => (
                <motion.div
                  key={pw + i}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg px-3 py-2"
                >
                  <span className="flex-1 text-sm font-mono text-white/60 truncate">{pw}</span>
                  <span className="text-[10px] text-white/20">{getStrength(pw).label}</span>
                  <button
                    onClick={() => { navigator.clipboard.writeText(pw); toast('Copied') }}
                    className="p-1 rounded hover:bg-white/10 transition-colors"
                  >
                    <Copy className="w-3 h-3 text-white/20" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  )
}
