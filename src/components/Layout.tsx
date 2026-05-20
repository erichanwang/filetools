import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, ChevronLeft, ChevronRight,
  Home, Shuffle, Eraser, Zap, Palette, FileText,
  FileType, Eye, Pencil, FileImage, FileJson, QrCode,
  SwatchBook, Camera, Fingerprint, Code, Table,
  Shield, Keyboard, Type, ArrowLeftRight,
  Crop, Layout as LayoutIcon
} from 'lucide-react'
import AnimatedBackground from './AnimatedBackground'

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

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

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

      {/* Sidebar */}
      <AnimatePresence>
        <motion.aside
          animate={{ width: mobileOpen ? 288 : collapsed ? 72 : 256, x: mobileOpen ? 0 : 0 }}
          className={`fixed left-0 top-0 h-full z-40 bg-[#0c0a09]/95 border-r border-white/5 backdrop-blur-xl
            flex flex-col py-4 overflow-hidden transition-[width]
            ${mobileOpen ? 'transtone-x-0' : '-transtone-x-full lg:transtone-x-0'}`}
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

          {/* Footer */}
          {!collapsed && (
            <div className="px-4 pt-4 border-t border-white/5 shrink-0">
              <p className="text-[10px] text-white/10 text-center">
                All processing runs locally in your browser
              </p>
            </div>
          )}
        </motion.aside>
      </AnimatePresence>

      {/* Main content */}
      <main
        className={`transition-all duration-300 pt-16 lg:pt-6 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-[256px]'
        }`}
      >
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
