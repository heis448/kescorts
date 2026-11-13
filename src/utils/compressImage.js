// Shrinks a photo in the browser BEFORE upload, so people on mobile data send ~200KB instead of 5–10MB.
// The server compresses again as a safety net, so if anything here fails we simply upload the original.
import api from './api'

// Compression rules come from Admin → Media, so the browser and the server always agree.
const PRESETS = {
  high:     { maxPx: 2400, quality: 0.9 },
  balanced: { maxPx: 1600, quality: 0.8 },
}
let cached = null, cachedAt = 0
const getSettings = () => {
  if (!cached || Date.now() - cachedAt > 5 * 60 * 1000) {
    cachedAt = Date.now()
    cached = api.get('/media-settings').then(r => r.data).catch(() => ({ compress_images: true, quality: 'high' }))
  }
  return cached
}

export async function compressImage(file, opts = {}) {
  try {
    if (!file || !file.type?.startsWith('image/')) return file
    const settings = await getSettings()
    if (!settings.compress_images) return file                 // admin turned compression off
    const preset = PRESETS[settings.quality] || PRESETS.high
    const { maxPx = preset.maxPx, quality = preset.quality, minBytes = 300 * 1024 } = opts
    if (file.type === 'image/gif') return file            // keep animation
    if (file.size < minBytes) return file                 // already small

    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
    const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)  // redrawing also drops EXIF/GPS data
    bitmap.close?.()

    const webp = canvas.toDataURL('image/webp').startsWith('data:image/webp')
    const type = webp ? 'image/webp' : 'image/jpeg'
    const blob = await new Promise(res => canvas.toBlob(res, type, quality))
    if (!blob || blob.size >= file.size) return file

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + (webp ? '.webp' : '.jpg'), { type, lastModified: Date.now() })
  } catch {
    return file
  }
}
