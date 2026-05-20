import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import Home from './pages/Home'
import FileConverter from './pages/FileConverter'
import BackgroundRemover from './pages/BackgroundRemover'
import ImageCompressor from './pages/ImageCompressor'
import ImageFilters from './pages/ImageFilters'
import PdfOperations from './pages/PdfOperations'
import OcrPage from './pages/OcrPage'
import MetadataViewer from './pages/MetadataViewer'
import BatchRename from './pages/BatchRename'
import ImageCropper from './pages/ImageCropper'
import ImageToPdf from './pages/ImageToPdf'
import QrGenerator from './pages/QrGenerator'
import ColorPalette from './pages/ColorPalette'
import ExifTool from './pages/ExifTool'
import FileChecksum from './pages/FileChecksum'
import Base64Tool from './pages/Base64Tool'
import AsciiArt from './pages/AsciiArt'
import JsonTool from './pages/JsonTool'
import CsvViewer from './pages/CsvViewer'
import TextTools from './pages/TextTools'
import PasswordGenerator from './pages/PasswordGenerator'
import ColorConverter from './pages/ColorConverter'
import JwtDecoder from './pages/JwtDecoder'
import UnitConverter from './pages/UnitConverter'

export default function App() {
  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          {/* Image tools */}
          <Route path="file-converter" element={<FileConverter />} />
          <Route path="background-remover" element={<BackgroundRemover />} />
          <Route path="image-compressor" element={<ImageCompressor />} />
          <Route path="image-filters" element={<ImageFilters />} />
          <Route path="image-cropper" element={<ImageCropper />} />
          <Route path="image-to-pdf" element={<ImageToPdf />} />
          <Route path="qr-generator" element={<QrGenerator />} />
          <Route path="color-palette" element={<ColorPalette />} />
          <Route path="ascii-art" element={<AsciiArt />} />
          {/* Document tools */}
          <Route path="pdf-operations" element={<PdfOperations />} />
          <Route path="ocr" element={<OcrPage />} />
          <Route path="metadata-viewer" element={<MetadataViewer />} />
          <Route path="batch-rename" element={<BatchRename />} />
          <Route path="exif-tool" element={<ExifTool />} />
          <Route path="file-checksum" element={<FileChecksum />} />
          <Route path="base64" element={<Base64Tool />} />
          {/* Data tools */}
          <Route path="json-tool" element={<JsonTool />} />
          <Route path="csv-viewer" element={<CsvViewer />} />
          <Route path="jwt-decoder" element={<JwtDecoder />} />
          <Route path="color-converter" element={<ColorConverter />} />
          <Route path="unit-converter" element={<UnitConverter />} />
          <Route path="password-generator" element={<PasswordGenerator />} />
          <Route path="text-tools" element={<TextTools />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}
