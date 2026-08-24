import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LazyImage from './LazyImage'
import { X, ChevronLeft, ChevronRight, Play, Volume2, VolumeX, Maximize2, ZoomIn } from 'lucide-react'

// ================================================================
// MEDIA LIGHTBOX — fullscreen viewer with controls
// ================================================================
export function MediaLightbox({ items, startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex)
  const [muted, setMuted]     = useState(true)
  const videoRef              = useRef(null)
  const item                  = items[current]

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [current])

  const prev = () => setCurrent(c => Math.max(0, c - 1))
  const next = () => setCurrent(c => Math.min(items.length - 1, c + 1))

  const isYoutube = item?.url?.includes('youtube.com') || item?.url?.includes('youtu.be')

  const getYoutubeEmbed = (url) => {
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=${muted ? 1 : 0}` : url
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
        <X size={20} className="text-white" />
      </button>

      {/* Counter */}
      {items.length > 1 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-3 py-1 rounded-full text-white text-sm">
          {current + 1} / {items.length}
        </div>
      )}

      {/* Prev */}
      {current > 0 && (
        <button onClick={e => { e.stopPropagation(); prev() }}
          className="absolute left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
          <ChevronLeft size={24} className="text-white" />
        </button>
      )}

      {/* Next */}
      {current < items.length - 1 && (
        <button onClick={e => { e.stopPropagation(); next() }}
          className="absolute right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
          <ChevronRight size={24} className="text-white" />
        </button>
      )}

      {/* Content */}
      <div className="max-w-4xl max-h-[85vh] w-full mx-8" onClick={e => e.stopPropagation()}>
        {item?.type === 'image' ? (
          <img src={item.url} alt="" className="max-h-[85vh] max-w-full mx-auto object-contain rounded-lg" />
        ) : isYoutube ? (
          <iframe
            src={getYoutubeEmbed(item.url)}
            className="w-full aspect-video rounded-lg"
            allowFullScreen
            allow="autoplay; encrypted-media"
          />
        ) : (
          <div className="relative">
            <video
              ref={videoRef}
              src={item?.url}
              className="max-h-[85vh] max-w-full mx-auto rounded-lg"
              controls
              autoPlay
              muted={muted}
              loop
            />
            <button
              onClick={() => { setMuted(!muted); if (videoRef.current) videoRef.current.muted = !muted }}
              className="absolute bottom-12 right-4 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors"
            >
              {muted ? <VolumeX size={16} className="text-white" /> : <Volume2 size={16} className="text-white" />}
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-sm px-2">
          {items.map((m, i) => (
            <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i) }}
              className={`w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              {m.type === 'image'
                ? <img src={m.url} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-dark-600 flex items-center justify-center">
                    {m.thumbnail
                      ? <img src={m.thumbnail} className="w-full h-full object-cover" />
                      : <Play size={14} className="text-white" />
                    }
                  </div>
              }
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ================================================================
// MEDIA GALLERY — inline display with slider and autoplay video
// ================================================================
export default function MediaGallery({ items = [], className = '' }) {
  const [current, setCurrent]   = useState(0)
  const [lightbox, setLightbox] = useState(null) // index
  const videoRefs               = useRef({})

  if (!items || items.length === 0) return null

  const item = items[current]
  const isYoutube = item?.url?.includes('youtube.com') || item?.url?.includes('youtu.be')

  const getYoutubeEmbed = (url) => {
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)
    return match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}` : url
  }

  return (
    <>
      <div className={`relative rounded-2xl overflow-hidden bg-dark-800 ${className}`}>
        {/* Main display */}
        <div
          className="relative cursor-pointer group"
          style={{ aspectRatio: '16/9' }}
          onClick={() => setLightbox(current)}
        >
          {item?.type === 'image' ? (
            <LazyImage src={item.url} className="w-full h-full" />
          ) : isYoutube ? (
            <div className="relative w-full h-full" onClick={e => e.stopPropagation()}>
              <iframe
                src={getYoutubeEmbed(item.url)}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            </div>
          ) : (
            <video
              ref={el => videoRefs.current[current] = el}
              src={item?.url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={item?.thumbnail}
            />
          )}

          {/* Overlay on hover */}
          {item?.type !== 'video' && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <ZoomIn size={32} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          )}

          {/* Video play indicator */}
          {item?.type === 'video' && !isYoutube && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full" onClick={e => e.stopPropagation()}>
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-xs">Live</span>
            </div>
          )}

          {/* Expand button */}
          <button
            onClick={e => { e.stopPropagation(); setLightbox(current) }}
            className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Maximize2 size={14} className="text-white" />
          </button>
        </div>

        {/* Navigation arrows */}
        {items.length > 1 && (
          <>
            {current > 0 && (
              <button onClick={() => setCurrent(c => c - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors">
                <ChevronLeft size={16} className="text-white" />
              </button>
            )}
            {current < items.length - 1 && (
              <button onClick={() => setCurrent(c => c + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full transition-colors">
                <ChevronRight size={16} className="text-white" />
              </button>
            )}
          </>
        )}

        {/* Dots */}
        {items.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {items.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails strip for 3+ items */}
      {items.length >= 3 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {items.map((m, i) => (
            <button key={i} onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-brand-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              {m.type === 'image'
                ? <img src={m.url} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-dark-700 flex items-center justify-center relative">
                    {m.thumbnail ? <LazyImage src={m.thumbnail} className="w-full h-full" /> : null}
                    <Play size={14} className="text-white absolute" fill="white" />
                  </div>
              }
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <MediaLightbox items={items} startIndex={lightbox} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
