import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Keyboard, X } from 'lucide-react'

const shortcuts = [
  { keys: ['⌘', 'K'], desc: 'Open command palette' },
  { keys: ['⌘', 'B'], desc: 'Toggle sidebar' },
  { keys: ['⌘', '/'], desc: 'Show keyboard shortcuts' },
  { keys: ['Esc'], desc: 'Close modals / palettes' },
]

export default function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setOpen((p) => !p)
      }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg text-white/15 hover:text-white/30 hover:bg-white/5 transition-all text-[10px] font-mono"
        aria-label="Keyboard shortcuts"
        title="Keyboard shortcuts (⌘/)"
      >
        <Keyboard className="w-3 h-3" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[102] bg-black/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -12 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[103] w-full max-w-sm mx-4"
            >
              <div className="glass rounded-2xl border border-white/10 shadow-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-white/30" />
                    <h2 className="text-sm font-semibold text-white/70">Keyboard Shortcuts</h2>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/20" />
                  </button>
                </div>
                <div className="space-y-1.5">
                  {shortcuts.map((s) => (
                    <div
                      key={s.desc}
                      className="flex items-center justify-between py-1.5 px-2 rounded-lg"
                    >
                      <span className="text-sm text-white/40">{s.desc}</span>
                      <div className="flex items-center gap-1">
                        {s.keys.map((k, i) => (
                          <span key={i}>
                            <kbd className="text-[11px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded font-mono border border-white/5">
                              {k}
                            </kbd>
                            {i < s.keys.length - 1 && (
                              <span className="text-white/10 mx-0.5">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
