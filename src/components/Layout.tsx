import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, ChevronLeft, ChevronRight, Search,
  Home, Shuffle, Eraser, Zap, Palette, FileText,
  FileType, Eye, Pencil, FileImage, FileJson, QrCode,
  SwatchBook, Camera, Fingerprint, Code, Table,
  Shield, Keyboard, Type, ArrowLeftRight,
  Crop, Layout as LayoutIcon, Settings, Sun, Moon, Clock
} from 'lucide-react'
import AnimatedBackground from './AnimatedBackground'
import CommandPalette from './CommandPalette'
import Breadcrumbs from './Breadcrumbs'
import KeyboardShortcutsModal from './KeyboardShortcutsModal'
import { useTheme } from './ThemeContext'
import { useRecent } from './RecentContext'

const navGroups = [
  {
    label: 'Image Tools',
    items: [
      { to: '/file-converter', icon: Shuffle, label: 'File Converter' },
      { to: '/background-remover', icon: Eraser, label: 'Background Remover' },
      { to: '/image-compressor', icon: Zap, label: 'Image Compressor' },
      { to: '/image-filters', icon: Palette, label: 'Image Filters' },
      { to: '/image-cropper', icon: Crop, label: 'Image Cropper' },
      { to: '/image-to-pdf', icon: FileImage, label: 'Image to PDF' },
      { to: '/ascii-art', icon: Type, label: 'ASCII Art' },
    ],
  },
  {
    label: 'Document Tools',
    items: [
      { to: '/pdf-operations', icon: FileText, label: 'PDF Tools' },
      { to: '/ocr', icon: Eye, label: 'OCR' },
      { to: '/metadata-viewer', icon: FileType, label: 'Metadata Viewer' },
      { to: '/batch-rename', icon: Pencil, label: 'Batch Rename' },
      { to: '/exif-tool', icon: Camera, label: 'EXIF Tool' },
      { to: '/file-checksum', icon: Fingerprint, label: 'File Checksum' },
    ],
  },
  {
    label: 'Data & Text',
    items: [
      { to: '/json-tool', icon: FileJson, label: 'JSON Tool' },
      { to: '/csv-viewer', icon: Table, label: 'CSV Viewer' },
      { to: '/jwt-decoder', icon: Shield, label: 'JWT Decoder' },
      { to: '/text-tools', icon: Type, label: 'Text Tools' },
      { to: '/base64', icon: Code, label: 'Base64' },
    ],
  },
  {
    label: 'Generators & Converters',
    items: [
      { to: '/qr-generator', icon: QrCode, label: 'QR Generator' },
      { to: '/color-palette', icon: SwatchBook, label: 'Color Palette' },
      { to: '/color-converter', icon: Palette, label: 'Color Converter' },
      { to: '/unit-converter', icon: ArrowLeftRight, label: 'Unit Converter' },
      { to: '/password-generator', icon: Keyboard, label: 'Passwords' },
    ],
  },
]

const recentLabelMap: Record<string, string> = {
  '/file-converter': 'File Converter',
  '/background-remover': 'Bg Remover',
  '/image-compressor': 'Compressor',
  '/image-filters': 'Filters',
  '/image-cropper': 'Cropper',
  '/image-to-pdf': 'Image→PDF',
  '/qr-generator': 'QR Generator',
  '/color-palette': 'Palette',
  '/ascii-art': 'ASCII Art',
  '/pdf-operations': 'PDF Tools',
  '/ocr': 'OCR',
  '/metadata-viewer': 'Metadata',
  '/batch-rename': 'Rename',
  '/exif-tool': 'EXIF',
  '/file-checksum': 'Checksum',
  '/base64': 'Base64',
  '/json-tool': 'JSON',
  '/csv-viewer': 'CSV',
  '/jwt-decoder': 'JWT',
  '/text-tools': 'Text',
  '/password-generator': 'Passwords',
  '/color-converter': 'Colors',
  '/unit-converter': 'Units',
  '/settings': 'Settings',
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const { resolved, setTheme } = useTheme()
  const { recent, addRecent } = useRecent()

  useEffect(() => {
    setMobileOpen(false)
    if (location.pathname !== '/') addRecent(location.pathname)
  }, [location.pathname, addRecent])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setCollapsed((p) => !p)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="min-h-screen bg-[#0c0a09] text-white overflow-hidden">
      <AnimatedBackground />

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xl"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Command palette */}
      <CommandPalette />

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          animate={{ width: mobileOpen ? 288 : collapsed ? 72 : 256, x: mobileOpen ? 0 : 0 }}
          className={`fixed left-0 top-0 h-full z-40 bg-[#0c0a09]/95 border-r border-white/5 backdrop-blur-xl
            flex flex-col py-4 overflow-hidden transition-[width]
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Logo */}
          <div className="px-4 mb-6 flex items-center justify-between shrink-0">
            <NavLink to="/" className="flex items-center gap-2.5 no-underline">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
                <LayoutIcon className="w-4 h-4 text-amber-400" />
              </div>
              {!collapsed && (
                <span className="font-semibold text-sm tracking-tight text-white">FileTools</span>
              )}
            </NavLink>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/5 transition-colors shrink-0"
              title={`${collapsed ? 'Expand' : 'Collapse'} sidebar (⌘B)`}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-white/20" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-white/20" />
              )}
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-2 space-y-5">
            {/* Home */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Home className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Home</span>}
            </NavLink>

            {/* Recent section */}
            {!collapsed && recent.length > 0 && (
              <div>
                <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/15">
                  Recent
                </div>
                <div className="space-y-1">
                  {recent.slice(0, 4).map((path) => (
                    <NavLink
                      key={path}
                      to={path}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                          isActive
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'text-white/30 hover:text-white/50 hover:bg-white/5 border border-transparent'
                        }`
                      }
                    >
                      <Clock className="w-3 h-3 shrink-0" />
                      <span className="truncate">{recentLabelMap[path] || path}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            )}

            {/* Tool groups */}
            {navGroups.map((group) => (
              <div key={group.label}>
                {!collapsed && (
                  <div className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/15">
                    {group.label}
                  </div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
                          isActive
                            ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                            : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom section */}
          <div className="shrink-0">
            {/* Keyboard shortcuts */}
            {!collapsed && (
              <div className="px-2 pb-2">
                <KeyboardShortcutsModal />
              </div>
            )}

            {/* Settings */}
            <div className="px-2">
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                      : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
                  }`
                }
              >
                <Settings className="w-4 h-4 shrink-0" />
                {!collapsed && <span>Settings</span>}
              </NavLink>
            </div>

            {/* Footer */}
            {!collapsed && (
              <div className="px-4 pt-3 border-t border-white/5">
                <p className="text-[10px] text-white/10 text-center">
                  All processing runs locally
                </p>
              </div>
            )}
          </div>
        </motion.aside>
      </AnimatePresence>

      {/* Main content */}
      <main
        className={`transition-all duration-300 pt-16 lg:pt-6 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[256px]'
        }`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex-1">
            <Breadcrumbs />
          </div>
          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <button
              onClick={() => {
                const e = new KeyboardEvent('keydown', { metaKey: true, key: 'k', bubbles: true })
                document.dispatchEvent(e)
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/20 text-xs hover:text-white/40 hover:bg-white/10 transition-all"
              aria-label="Search tools (⌘K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search</span>
              <kbd className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded font-mono text-white/10">⌘K</kbd>
            </button>
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/30 hover:text-white/50 hover:bg-white/10 transition-all"
              title={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolved === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
