import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LazyImage from './LazyImage'

// Reusable image/video slider for cards
// Props: items = [{ url, type }], interval = 7000, className, aspectRatio
export default function CardSlider({ items = [], interval = 7000, className = '', children }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)

  const total = items.length

  const go = (n) => {
    setCurrent((n + total) % total)
    // Reset timer on manual nav
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % total), interval)
  }

  useEffect(() => {
    if (total <= 1) return
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % total), interval)
    return () => clearInterval(timerRef.current)
  }, [total, interval])

  if (!items.length) return <div className={className}>{children}</div>

  const item = items[current]

  return (
    <div className={`relative overflow-hidden group ${className}`}>
      {/* Media */}
      {item.type === 'video'
        ? <video src={item.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        : <LazyImage src={item.url} className="w-full h-full" />
      }

      {/* Controls — only if multiple */}
      {total > 1 && (
        <>
          {/* Prev */}
          <button
            onClick={e => { e.stopPropagation(); go(current - 1) }}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <ChevronLeft size={13} className="text-white" />
          </button>
          {/* Next */}
          <button
            onClick={e => { e.stopPropagation(); go(current + 1) }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <ChevronRight size={13} className="text-white" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 z-10">
            {items.map((_, i) => (
              <button key={i} onClick={e => { e.stopPropagation(); go(i) }}
                className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-4 bg-white' : 'w-1 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}

      {/* Overlay children (badges etc) */}
      {children}
    </div>
  )
}
