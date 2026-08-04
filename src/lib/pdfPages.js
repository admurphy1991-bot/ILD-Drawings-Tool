import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.js?url'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

function newPageId() {
  return 'p' + Date.now() + Math.random().toString(36).slice(2)
}

export async function pdfFileToPages(f) {
  const buf = await f.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  const baseName = f.name.replace(/\.[^.]+$/, '')
  const pages = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale: 3 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    pages.push({
      id: newPageId(),
      name: pdf.numPages > 1 ? `${baseName} — p.${i}` : baseName,
      img: canvas.toDataURL('image/png'),
      naturalW: canvas.width,
      naturalH: canvas.height,
      scale: null,
      annotations: [],
    })
  }
  return pages
}

export async function imageFileToPage(f) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(r.result)
    r.onerror = rej
    r.readAsDataURL(f)
  })
  const dims = await new Promise((res) => {
    const img = new Image()
    img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight })
    img.src = dataUrl
  })
  return {
    id: newPageId(),
    name: f.name.replace(/\.[^.]+$/, ''),
    img: dataUrl,
    naturalW: dims.w,
    naturalH: dims.h,
    scale: null,
    annotations: [],
  }
}

export async function filesToPages(fileList) {
  const files = Array.from(fileList || [])
  const newPages = []
  for (const f of files) {
    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    if (isPdf) newPages.push(...(await pdfFileToPages(f)))
    else newPages.push(await imageFileToPage(f))
  }
  return newPages
}
