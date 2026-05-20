import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import { ThemeProvider } from './components/ThemeContext'
import { RecentProvider } from './components/RecentContext'
import ErrorBoundary from './components/ErrorBoundary'
import { PageSkeleton } from './components/Skeleton'
import Home from './pages/Home'

const FileConverter = lazy(() => import('./pages/FileConverter'))
const BackgroundRemover = lazy(() => import('./pages/BackgroundRemover'))
const ImageCompressor = lazy(() => import('./pages/ImageCompressor'))
const ImageFilters = lazy(() => import('./pages/ImageFilters'))
const PdfOperations = lazy(() => import('./pages/PdfOperations'))
const OcrPage = lazy(() => import('./pages/OcrPage'))
const MetadataViewer = lazy(() => import('./pages/MetadataViewer'))
const BatchRename = lazy(() => import('./pages/BatchRename'))
const ImageCropper = lazy(() => import('./pages/ImageCropper'))
const ImageToPdf = lazy(() => import('./pages/ImageToPdf'))
const QrGenerator = lazy(() => import('./pages/QrGenerator'))
const ColorPalette = lazy(() => import('./pages/ColorPalette'))
const ExifTool = lazy(() => import('./pages/ExifTool'))
const FileChecksum = lazy(() => import('./pages/FileChecksum'))
const Base64Tool = lazy(() => import('./pages/Base64Tool'))
const AsciiArt = lazy(() => import('./pages/AsciiArt'))
const JsonTool = lazy(() => import('./pages/JsonTool'))
const CsvViewer = lazy(() => import('./pages/CsvViewer'))
const TextTools = lazy(() => import('./pages/TextTools'))
const PasswordGenerator = lazy(() => import('./pages/PasswordGenerator'))
const ColorConverter = lazy(() => import('./pages/ColorConverter'))
const JwtDecoder = lazy(() => import('./pages/JwtDecoder'))
const UnitConverter = lazy(() => import('./pages/UnitConverter'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <RecentProvider>
          <ToastProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              {/* Image tools */}
              <Route path="file-converter" element={<Suspense fallback={<PageSkeleton />}><FileConverter /></Suspense>} />
              <Route path="background-remover" element={<Suspense fallback={<PageSkeleton />}><BackgroundRemover /></Suspense>} />
              <Route path="image-compressor" element={<Suspense fallback={<PageSkeleton />}><ImageCompressor /></Suspense>} />
              <Route path="image-filters" element={<Suspense fallback={<PageSkeleton />}><ImageFilters /></Suspense>} />
              <Route path="image-cropper" element={<Suspense fallback={<PageSkeleton />}><ImageCropper /></Suspense>} />
              <Route path="image-to-pdf" element={<Suspense fallback={<PageSkeleton />}><ImageToPdf /></Suspense>} />
              <Route path="qr-generator" element={<Suspense fallback={<PageSkeleton />}><QrGenerator /></Suspense>} />
              <Route path="color-palette" element={<Suspense fallback={<PageSkeleton />}><ColorPalette /></Suspense>} />
              <Route path="ascii-art" element={<Suspense fallback={<PageSkeleton />}><AsciiArt /></Suspense>} />
              {/* Document tools */}
              <Route path="pdf-operations" element={<Suspense fallback={<PageSkeleton />}><PdfOperations /></Suspense>} />
              <Route path="ocr" element={<Suspense fallback={<PageSkeleton />}><OcrPage /></Suspense>} />
              <Route path="metadata-viewer" element={<Suspense fallback={<PageSkeleton />}><MetadataViewer /></Suspense>} />
              <Route path="batch-rename" element={<Suspense fallback={<PageSkeleton />}><BatchRename /></Suspense>} />
              <Route path="exif-tool" element={<Suspense fallback={<PageSkeleton />}><ExifTool /></Suspense>} />
              <Route path="file-checksum" element={<Suspense fallback={<PageSkeleton />}><FileChecksum /></Suspense>} />
              <Route path="base64" element={<Suspense fallback={<PageSkeleton />}><Base64Tool /></Suspense>} />
              {/* Data tools */}
              <Route path="json-tool" element={<Suspense fallback={<PageSkeleton />}><JsonTool /></Suspense>} />
              <Route path="csv-viewer" element={<Suspense fallback={<PageSkeleton />}><CsvViewer /></Suspense>} />
              <Route path="jwt-decoder" element={<Suspense fallback={<PageSkeleton />}><JwtDecoder /></Suspense>} />
              <Route path="color-converter" element={<Suspense fallback={<PageSkeleton />}><ColorConverter /></Suspense>} />
              <Route path="unit-converter" element={<Suspense fallback={<PageSkeleton />}><UnitConverter /></Suspense>} />
              <Route path="password-generator" element={<Suspense fallback={<PageSkeleton />}><PasswordGenerator /></Suspense>} />
              <Route path="text-tools" element={<Suspense fallback={<PageSkeleton />}><TextTools /></Suspense>} />
              {/* Settings */}
              <Route path="settings" element={<Suspense fallback={<PageSkeleton />}><SettingsPage /></Suspense>} />
            </Route>
          </Routes>
          </ToastProvider>
        </RecentProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
