import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, FileUp, Scissors, Shrink, SlidersHorizontal,
  FileText, ScanText, Info, Pencil, Menu, X, Zap
} from 'lucide-react'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/convert', icon: FileUp, label: 'Convert' },
  { to: '/remove-bg', icon: Scissors, label: 'Remove BG' },
  { to: '/compress', icon: Shrink, label: 'Compress' },
  { to: '/filters', icon: SlidersHorizontal, label: 'Filters' },
  { to: '/pdf', icon: FileText, label: 'PDF Tools' },
  { to: '/ocr', icon: ScanText, label: 'OCR' },
  { to: '/metadata', icon: Info, label: 'Metadata' },
  { to: '/rename', icon: Pencil, label: 'Rename' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 
          bg-slate-900 border-r border-slate-800
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">FileTools</h1>
              <p className="text-xs text-slate-400">All-in-one file ops</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.label}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800">
          <p className="text-xs text-slate-600 text-center">
            All processing happens locally
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-white">FileTools</span>
          </div>
          <div className="w-8" />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
