import { useState, useCallback } from 'react'
import { useTheme } from '../components/ThemeContext'
import { motion } from 'framer-motion'
import { useToast } from '../components/Toast'
import {
  Sun, Moon, Monitor, Settings2, Keyboard, Trash2, Download,
  Upload, AlertTriangle, CheckCircle2, Bell, Eraser
} from 'lucide-react'

const themeOptions = [
  { value: 'dark' as const, icon: Moon, label: 'Dark', desc: 'Easier on the eyes at night' },
  { value: 'light' as const, icon: Sun, label: 'Light', desc: 'Crisp and bright daytime mode' },
  { value: 'system' as const, icon: Monitor, label: 'System', desc: 'Follows your OS preference' },
]

function getLocalStorageKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('filetools')) keys.push(key)
  }
  return keys
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [confirmClear, setConfirmClear] = useState(false)
  const [exportDone, setExportDone] = useState(false)
  const [importDone, setImportDone] = useState(false)

  const clearAllData = useCallback(() => {
    const keys = getLocalStorageKeys()
    keys.forEach((k) => localStorage.removeItem(k))
    setConfirmClear(false)
    toast(`Cleared ${keys.length} stored item${keys.length !== 1 ? 's' : ''}. Reloading...`)
    setTimeout(() => window.location.reload(), 1000)
  }, [toast])

  const exportSettings = useCallback(() => {
    const data: Record<string, string> = {}
    getLocalStorageKeys().forEach((k) => {
      data[k] = localStorage.getItem(k) || ''
    })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `filetools-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportDone(true)
    setTimeout(() => setExportDone(false), 2000)
    toast('Settings exported')
  }, [toast])

  const importSettings = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        let count = 0
        for (const [key, value] of Object.entries(data)) {
          if (key.startsWith('filetools') && typeof value === 'string') {
            localStorage.setItem(key, value)
            count++
          }
        }
        setImportDone(true)
        setTimeout(() => setImportDone(false), 2000)
        toast(`Imported ${count} setting${count !== 1 ? 's' : ''}. Reloading...`)
        setTimeout(() => window.location.reload(), 1000)
      } catch {
        toast('Invalid backup file', 'error')
      }
    }
    input.click()
  }, [toast])

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Settings2 className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white/90">Settings</h1>
        </div>
        <p className="text-sm text-white/20 ml-11">Customize your FileTools experience</p>
      </motion.div>

      {/* Appearance */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <Sun className="w-4 h-4 text-white/30" />
          <h2 className="text-sm font-semibold text-white/70">Appearance</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {themeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all text-left ${
                theme === opt.value
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                  : 'border-white/5 hover:bg-white/[0.03] hover:border-white/10 text-white/30 hover:text-white/50'
              }`}
            >
              <opt.icon className="w-6 h-6 shrink-0" />
              <div className="text-center">
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-[10px] opacity-50 mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </motion.section>

      {/* Keyboard shortcuts */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <Keyboard className="w-4 h-4 text-white/30" />
          <h2 className="text-sm font-semibold text-white/70">Keyboard Shortcuts</h2>
        </div>

        <div className="space-y-2">
          {[
            { keys: '⌘K', desc: 'Open command palette' },
            { keys: '⌘B', desc: 'Toggle sidebar' },
            { keys: '⌘/', desc: 'Show keyboard shortcuts' },
            { keys: 'Esc', desc: 'Close modals / palettes' },
            { keys: 'Ctrl+Z', desc: 'Undo (in Text Tools)' },
            { keys: 'Ctrl+Shift+Z', desc: 'Redo (in Text Tools)' },
          ].map((shortcut) => (
            <div
              key={shortcut.keys}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02]"
            >
              <span className="text-sm text-white/40">{shortcut.desc}</span>
              <kbd className="text-[11px] text-white/30 bg-white/5 px-2 py-0.5 rounded font-mono border border-white/5">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Backup & Restore */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <Download className="w-4 h-4 text-white/30" />
          <h2 className="text-sm font-semibold text-white/70">Backup & Restore</h2>
        </div>
        <p className="text-xs text-white/20">
          Export all your settings, recent tools, and tool history as a JSON file.
          Import to restore on another device or browser.
        </p>
        <div className="flex flex-wrap gap-3">
          <motion.button
            onClick={exportSettings}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 text-sm font-medium hover:bg-stone-700 transition-all"
          >
            {exportDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
            {exportDone ? 'Exported!' : 'Export Settings'}
          </motion.button>
          <motion.button
            onClick={importSettings}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800 border border-stone-700 text-stone-300 text-sm font-medium hover:bg-stone-700 transition-all"
          >
            {importDone ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Upload className="w-4 h-4" />}
            {importDone ? 'Imported!' : 'Import Settings'}
          </motion.button>
        </div>
      </motion.section>

      {/* Danger zone */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="glass rounded-2xl p-6 space-y-5 border-red-500/10"
      >
        <div className="flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400/60" />
          <h2 className="text-sm font-semibold text-red-400/70">Danger Zone</h2>
        </div>
        <p className="text-xs text-white/20">
          Clear all locally stored data — recent tools, tool history, theme preference,
          and other cached data. This cannot be undone.
        </p>
        {!confirmClear ? (
          <motion.button
            onClick={() => setConfirmClear(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </motion.button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 p-4 rounded-xl bg-red-500/5 border border-red-500/20"
          >
            <p className="text-sm text-white/50">Are you sure? This will remove all your local data.</p>
            <div className="flex gap-3">
              <motion.button
                onClick={clearAllData}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-all"
              >
                <Eraser className="w-4 h-4" />
                Yes, Clear Everything
              </motion.button>
              <motion.button
                onClick={() => setConfirmClear(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-400 text-sm font-medium hover:text-stone-200 transition-all"
              >
                Cancel
              </motion.button>
            </div>
          </motion.div>
        )}
      </motion.section>

      {/* About */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.18 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        <div className="flex items-center gap-2.5">
          <Bell className="w-4 h-4 text-white/30" />
          <h2 className="text-sm font-semibold text-white/70">About FileTools</h2>
        </div>

        <div className="space-y-2 text-sm text-white/20">
          <p>
            <span className="text-white/40">24 tools</span> — all processing runs locally in your
            browser. No servers, no uploads, no tracking.
          </p>
          <p>
            Built with React, TypeScript, Tailwind CSS, and Framer Motion. Uses client‑side
            libraries like PDF-lib, Tesseract.js, JSZip, and Canvas API.
          </p>
          <p className="text-white/10 pt-2">
            Version 1.0.0 — MIT License
          </p>
        </div>
      </motion.section>
    </div>
  )
}
