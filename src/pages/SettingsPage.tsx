import { useTheme } from '../components/ThemeContext'
import { motion } from 'framer-motion'
import { Sun, Moon, Monitor, Settings2, Keyboard, Palette as PaletteIcon, Bell } from 'lucide-react'

const themeOptions = [
  { value: 'dark' as const, icon: Moon, label: 'Dark', desc: 'Easier on the eyes at night' },
  { value: 'light' as const, icon: Sun, label: 'Light', desc: 'Crisp and bright daytime mode' },
  { value: 'system' as const, icon: Monitor, label: 'System', desc: 'Follows your OS preference' },
]

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()

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
          <PaletteIcon className="w-4 h-4 text-white/30" />
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
            { keys: 'Esc', desc: 'Close modals / palettes' },
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

      {/* About */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
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
