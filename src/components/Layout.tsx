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
import CommandPalette from './CommandPalette'
import Breadcrumbs from './Breadcrumbs'
import KeyboardShortcutsModal from './KeyboardShortcutsModal'
import ScrollToTop from './ScrollToTop'
import { useTheme } from './ThemeContext'
import { useRecent } from './RecentContext'

const SIDEBAR_WIDTH = 224
const SIDEBAR_COLLAPSED = 56
const HEADER_H = 48

const navGroups = [
  {
    label: 'Image',
    items: [
      { to: '/file-converter', icon: Shuffle, label: 'Converter' },
      { to: '/background-remover', icon: Eraser, label: 'Bg Remover' },
      { to: '/image-compressor', icon: Zap, label: 'Compressor' },
      { to: '/image-filters', icon: Palette, label: 'Filters' },
      { to: '/image-cropper', icon: Crop, label: 'Cropper' },
      { to: '/image-to-pdf', icon: FileImage, label: 'Image→PDF' },
      { to: '/ascii-art', icon: Type, label: 'ASCII Art' },
    ],
  },
  {
    label: 'Document',
    items: [
      { to: '/pdf-operations', icon: FileText, label: 'PDF' },
      { to: '/ocr', icon: Eye, label: 'OCR' },
      { to: '/metadata-viewer', icon: FileType, label: 'Metadata' },
      { to: '/batch-rename', icon: Pencil, label: 'Rename' },
      { to: '/exif-tool', icon: Camera, label: 'EXIF' },
      { to: '/file-checksum', icon: Fingerprint, label: 'Checksum' },
    ],
  },
  {
    label: 'Data',
    items: [
      { to: '/json-tool', icon: FileJson, label: 'JSON' },
      { to: '/csv-viewer', icon: Table, label: 'CSV' },
      { to: '/jwt-decoder', icon: Shield, label: 'JWT' },
      { to: '/text-tools', icon: Type, label: 'Text' },
      { to: '/base64', icon: Code, label: 'Base64' },
    ],
  },
  {
    label: 'Convert',
    items: [
      { to: '/qr-generator', icon: QrCode, label: 'QR' },
      { to: '/color-palette', icon: SwatchBook, label: 'Palette' },
      { to: '/color-converter', icon: Palette, label: 'Colors' },
      { to: '/unit-converter', icon: ArrowLeftRight, label: 'Units' },
      { to: '/password-generator', icon: Keyboard, label: 'Passwords' },
    ],
  },
]

const recentLabelMap: Record<string, string> = {
  '/file-converter': 'Converter', '/background-remover': 'Bg Remover',
  '/image-compressor': 'Compressor', '/image-filters': 'Filters',
  '/image-cropper': 'Cropper', '/image-to-pdf': 'Image→PDF',
  '/qr-generator': 'QR', '/color-palette': 'Palette', '/ascii-art': 'ASCII',
  '/pdf-operations': 'PDF', '/ocr': 'OCR', '/metadata-viewer': 'Metadata',
  '/batch-rename': 'Rename', '/exif-tool': 'EXIF', '/file-checksum': 'Checksum',
  '/base64': 'Base64', '/json-tool': 'JSON', '/csv-viewer': 'CSV',
  '/jwt-decoder': 'JWT', '/text-tools': 'Text', '/password-generator': 'Passwords',
  '/color-converter': 'Colors', '/unit-converter': 'Units', '/settings': 'Settings',
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches)
  const location = useLocation()
  const { resolved, setTheme } = useTheme()
  const { recent, addRecent } = useRecent()

  // Track desktop breakpoint (md = 768px)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false)
    if (location.pathname !== '/') addRecent(location.pathname)
  }, [location.pathname, addRecent])

  // Keyboard shortcut: Cmd+B to toggle sidebar
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

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH
  const contentMargin = isDesktop ? sidebarWidth : 0

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <CommandPalette />

      {/* ========== TOP HEADER (always visible) ========== */}
      <header
        className="fixed top-0 inset-x-0 z-30 bg-stone-950/90 backdrop-blur-lg border-b border-stone-800/50"
        style={{ height: HEADER_H, paddingLeft: isDesktop ? sidebarWidth : 0 }}
      >
        <div className="h-full flex items-center justify-between px-3 sm:px-4">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-1.5 -ml-1 rounded-md hover:bg-stone-800 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4 h-4 text-stone-400" /> : <Menu className="w-4 h-4 text-stone-400" />}
            </button>

            {/* Logo — always visible */}
            <NavLink to="/" className="flex items-center gap-2 no-underline">
              <div className="w-6 h-6 rounded-md bg-stone-800 border border-stone-700/60 flex items-center justify-center">
                <LayoutIcon className="w-3 h-3 text-stone-300" />
              </div>
              <span className="font-semibold text-[13px] tracking-tight text-stone-200">
                FileTools
              </span>
            </NavLink>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Search trigger */}
            <button
              onClick={() => {
                const e = new KeyboardEvent('keydown', { metaKey: true, key: 'k', bubbles: true })
                document.dispatchEvent(e)
              }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-stone-800/60 border border-stone-700/40 text-stone-500 text-[11px] hover:text-stone-300 hover:bg-stone-800 transition-all"
              aria-label="Search tools (⌘K)"
            >
              <Search className="w-3 h-3" />
              <span className="hidden sm:inline">Search tools</span>
              <kbd className="hidden sm:inline text-[10px] bg-stone-800 px-1 rounded font-mono text-stone-600">⌘K</kbd>
            </button>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(resolved === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-md hover:bg-stone-800 transition-colors text-stone-500"
              title={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
              aria-label={`Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`}
            >
              {resolved === 'dark' ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ========== MOBILE OVERLAY ========== */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 bg-stone-950/98 border-r border-stone-800/50 backdrop-blur-xl
          flex flex-col py-2 overflow-hidden transition-transform duration-[250ms]
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:z-20`}
        style={{ width: isDesktop ? sidebarWidth : 260, paddingTop: HEADER_H + 8 }}
      >
        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin">
          {/* Home */}
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                isActive
                  ? 'bg-stone-800 text-stone-100'
                  : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
              }`
            }
          >
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Home</span>}
          </NavLink>

          {/* Recent section */}
          {!collapsed && recent.length > 0 && (
            <div>
              <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600">
                Recent
              </div>
              <div className="space-y-0.5">
                {recent.slice(0, 3).map((path) => (
                  <NavLink
                    key={path}
                    to={path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
                        isActive
                          ? 'bg-stone-800 text-stone-200'
                          : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
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
                <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-600">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                        isActive
                          ? 'bg-stone-800 text-stone-100'
                          : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
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

        {/* Bottom */}
        <div className="shrink-0 mt-2">
          {!collapsed && (
            <div className="px-2 pb-1.5">
              <KeyboardShortcutsModal />
            </div>
          )}
          <div className="px-2">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors shrink-0 ${
                  isActive
                    ? 'bg-stone-800 text-stone-100'
                    : 'text-stone-500 hover:text-stone-300 hover:bg-stone-800/50'
                }`
              }
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!collapsed && <span>Settings</span>}
            </NavLink>
          </div>
          {!collapsed && (
            <div className="px-3 pt-2 mt-1 border-t border-stone-800/50">
              <p className="text-[10px] text-stone-700 text-center">All processing runs locally</p>
            </div>
          )}
          {/* Collapse toggle */}
          <div className="px-2 pt-1.5 hidden md:flex justify-end">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md hover:bg-stone-800 transition-colors"
              aria-label={`${collapsed ? 'Expand' : 'Collapse'} sidebar`}
            >
              {collapsed ? (
                <ChevronRight className="w-3 h-3 text-stone-600" />
              ) : (
                <ChevronLeft className="w-3 h-3 text-stone-600" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main
        className="pb-12 px-4 sm:px-6 md:px-8 min-h-screen transition-[margin] duration-[250ms]"
        style={{ marginLeft: contentMargin, paddingTop: HEADER_H + 16 }}
      >
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex-1 min-w-0">
            <Breadcrumbs />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <ScrollToTop />
    </div>
  )
}
