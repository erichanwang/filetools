# 🛠️ FileTools

**All-in-one file operations toolkit — built with React, powered by your browser.**

Convert, compress, edit, extract, and manage your files entirely client-side. No server uploads. Private, fast, and free.

---

## ✨ Features

| Feature | Description |
|---|---|
| **File Converter** | Convert between PNG, JPEG, WebP, BMP, GIF, ICO |
| **Background Remover** | AI-powered background removal (up to 8K resolution) |
| **Image Compressor** | Compress & resize with quality controls and batch support |
| **Image Filters** | Brightness, contrast, saturation, blur, presets & more |
| **PDF Tools** | Merge, split, and compress PDFs |
| **OCR** | Extract text from images with live progress tracking |
| **Metadata Viewer** | Inspect file type, size, dimensions, and timestamps |
| **Batch Rename** | Rename files with patterns, numbering, find/replace |

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

---

## 🧰 Tech Stack

- **React 19** + **TypeScript**
- **Vite** (build tool)
- **Tailwind CSS v4** (styling)
- **React Router v7** (routing)
- **Lucide React** (icons)

### Key Libraries

| Library | Purpose |
|---|---|
| `@imgly/background-removal` | AI background removal |
| `tesseract.js` | OCR text extraction |
| `pdf-lib` | PDF merge, split, compress |
| `browser-image-compression` | Image compression |
| `pica` | High-quality image resizing |
| `react-dropzone` | Drag-and-drop file uploads |
| `file-saver` | Client-side file downloads |
| `jszip` | ZIP archive handling |

---

## 🔒 Privacy

All processing runs locally in your browser via Web Workers and Canvas. Files never leave your device.

---

## 📦 Deployment

This is a static React app. Build with `npm run build` and deploy the `dist/` folder to Vercel, Netlify, or any static host.

```bash
npm run build
# Deploy dist/
```
