import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import FileConverter from './pages/FileConverter'
import BackgroundRemover from './pages/BackgroundRemover'
import ImageCompressor from './pages/ImageCompressor'
import ImageFilters from './pages/ImageFilters'
import PdfOperations from './pages/PdfOperations'
import OcrPage from './pages/OcrPage'
import MetadataViewer from './pages/MetadataViewer'
import BatchRename from './pages/BatchRename'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/convert" element={<FileConverter />} />
        <Route path="/remove-bg" element={<BackgroundRemover />} />
        <Route path="/compress" element={<ImageCompressor />} />
        <Route path="/filters" element={<ImageFilters />} />
        <Route path="/pdf" element={<PdfOperations />} />
        <Route path="/ocr" element={<OcrPage />} />
        <Route path="/metadata" element={<MetadataViewer />} />
        <Route path="/rename" element={<BatchRename />} />
      </Routes>
    </Layout>
  )
}

export default App
