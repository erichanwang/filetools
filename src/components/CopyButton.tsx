import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check } from 'lucide-react'

interface CopyButtonProps {
  text: string
  label?: string
  className?: string
  iconSize?: string
}

export default function CopyButton({ text, label, className = '', iconSize = 'w-4 h-4' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(() => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }, [text])

  return (
    <motion.button
      onClick={copy}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors ${
        copied
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200'
      } ${className}`}
      aria-label={label || 'Copy to clipboard'}
    >
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5"
          >
            <Check className={`${iconSize}`} />
            <span className="text-xs font-medium">{label || 'Copied!'}</span>
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center gap-1.5"
          >
            <Copy className={`${iconSize}`} />
            {label && <span className="text-xs font-medium">{label}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
