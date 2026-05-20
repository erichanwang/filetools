import { useState, type ReactNode } from 'react'

interface Props {
  content: string
  shortcut?: string
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
}

export default function Tooltip({ content, shortcut, children, position = 'top' }: Props) {
  const [visible, setVisible] = useState(false)

  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-white/90 border-x-transparent border-b-transparent border-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-white/90 border-x-transparent border-t-transparent border-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-white/90 border-y-transparent border-r-transparent border-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-white/90 border-y-transparent border-l-transparent border-4',
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          className={`absolute z-50 pointer-events-none transition-opacity duration-150 ${posClasses[position]}`}
        >
          <div className="bg-white/90 text-black text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap flex items-center gap-2">
            <span>{content}</span>
            {shortcut && (
              <kbd className="text-[10px] bg-black/10 text-black/40 px-1.5 py-0.5 rounded font-mono">
                {shortcut}
              </kbd>
            )}
          </div>
          <div className={arrowClasses[position]} />
        </div>
      )}
    </div>
  )
}
