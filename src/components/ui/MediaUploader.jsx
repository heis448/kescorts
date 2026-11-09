import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Link, X, Play, Image, Loader2, Plus } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

// items: [{ type, url, public_id, thumbnail, source, position }]
// onChange: (items) => void
// maxImages, maxVideos: optional limits

export default function MediaUploader({ items = [], onChange, maxImages = 10, maxVideos = 5, label = 'Add Media' }) {
  const [urlInput, setUrlInput]   = useState('')
  const [urlType, setUrlType]     = useState('image')
  const [showUrl, setShowUrl]     = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const images = items.filter(i => i.type === 'image')
  const videos = items.filter(i => i.type === 'video')
  const canAddImage = images.length < maxImages
  const canAddVideo = videos.length < maxVideos

  // Upload file to backend → Cloudinary
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)

    for (const file of files) {
      const isVideo = file.type.startsWith('video/')
      if (isVideo && !canAddVideo) { toast.error(`Max ${maxVideos} videos`); continue }
      if (!isVideo && !canAddImage) { toast.error(`Max ${maxImages} images`); continue }

      try {
        const form = new FormData()
        form.append('file', file)
        const { data } = await api.post('/media/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
        onChange([...items, { ...data, position: items.length }])
      } catch (err) {
        toast.error(`Failed to upload ${file.name}`)
      }
    }
    setUploading(false)
    e.target.value = ''
  }

  // Add URL
  const addUrl = () => {
    if (!urlInput.trim()) return
    if (urlType === 'image' && !canAddImage) return toast.error(`Max ${maxImages} images`)
    if (urlType === 'video' && !canAddVideo) return toast.error(`Max ${maxVideos} videos`)

    const isYoutube = urlInput.includes('youtube.com') || urlInput.includes('youtu.be')
    let thumbnail = null
    if (isYoutube) {
      const match = urlInput.match(/(?:v=|youtu\.be\/)([^&\s]+)/)
      if (match) thumbnail = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
    }

    onChange([...items, {
      type: urlType,
      url: urlInput.trim(),
      public_id: null,
      thumbnail,
      source: 'url',
      position: items.length
    }])
    setUrlInput('')
    setShowUrl(false)
  }

  const removeItem = (index) => {
    onChange(items.filter((_, i) => i !== index).map((item, i) => ({ ...item, position: i })))
  }

  return (
    <div>
      {label && <label className="text-xs text-gray-400 mb-2 block font-medium uppercase tracking-wider">{label}</label>}

      {/* Preview grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {items.map((item, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-dark-700 group">
              {item.type === 'image' ? (
                <img src={item.url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-dark-600 relative">
                  {item.thumbnail
                    ? <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-dark-600" />
                  }
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-10 h-10 bg-black/60 rounded-full flex items-center justify-center">
                      <Play size={16} className="text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => removeItem(i)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 hover:bg-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={11} className="text-white" />
              </button>
              <div className="absolute bottom-1.5 left-1.5">
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${item.type === 'video' ? 'bg-purple-500/80 text-white' : 'bg-black/60 text-white'}`}>
                  {item.type === 'video' ? '▶' : '🖼'} {item.source}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add buttons */}
      <div className="flex gap-2 flex-wrap">
        {/* File upload */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading || (!canAddImage && !canAddVideo)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-dark-500 hover:border-brand-500 text-gray-400 hover:text-white rounded-xl transition-all disabled:opacity-40"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Upload File
        </button>
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* URL input toggle */}
        <button
          type="button"
          onClick={() => setShowUrl(!showUrl)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm border border-dark-500 hover:border-brand-500 text-gray-400 hover:text-white rounded-xl transition-all"
        >
          <Link size={14} /> Paste URL
        </button>
      </div>

      {/* Limits hint */}
      <p className="text-xs text-gray-600 mt-1.5">
        {images.length}/{maxImages} images · {videos.length}/{maxVideos} videos
      </p>

      {/* URL input panel */}
      <AnimatePresence>
        {showUrl && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3"
          >
            <div className="bg-dark-700/50 border border-dark-600 rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                {['image', 'video'].map(t => (
                  <button key={t} type="button" onClick={() => setUrlType(t)}
                    className={`flex-1 py-1.5 text-xs rounded-lg capitalize transition-all ${urlType === t ? 'bg-brand-600 text-white' : 'text-gray-400 border border-dark-500'}`}>
                    {t === 'image' ? '🖼 Image URL' : '▶ Video URL'}
                  </button>
                ))}
              </div>
              <input
                type="url"
                className="input text-sm"
                placeholder={urlType === 'video' ? 'https://youtube.com/... or https://...mp4' : 'https://example.com/image.jpg'}
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
              />
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowUrl(false)} className="btn-ghost text-xs py-1.5 flex-1">Cancel</button>
                <button type="button" onClick={addUrl} disabled={!urlInput.trim()} className="btn-primary text-xs py-1.5 flex-1">
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
