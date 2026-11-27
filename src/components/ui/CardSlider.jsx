import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import LazyImage from './LazyImage'
import { ExpandableMedia } from './MediaGallery'

// Reusable image/video slider for cards
// Props: items = [{ url, type }], interval = 7000, className
//   expandable  — tapping the media opens the full-screen viewer (swipe/zoom). Arrows, dots and links keep working.
//   loadFull    — optional async () => items, fetched when the viewer opens
//   footer      — optional node | (close) => node shown in the viewer
export default function CardSlider({ items = [], interval = 7000, className = '', children, expandable = false, loadFull, footer, onOpen }) {
  const [current, setCurrent] = useState(0)
  const timerRef = useRef(null)
  const touch    = useRef(null)
  const swiped   = useRef(false)

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

  const item = items[Math.min(current, total - 1)]
  // preventDefault: these buttons can sit inside a <Link>
  const press = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); fn() }

  // Swipe between photos on phones
  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; swiped.current = false }
  const onTouchEnd = (e) => {
    const t = touch.current
    if (!t || total <= 1) return
    const dx = e.changedTouches[0].clientX - t.x, dy = e.changedTouches[0].clientY - t.y
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { swiped.current = true; go(current + (dx < 0 ? 1 : -1)) }
  }
  // A swipe must not also count as a tap (which would open the viewer / follow the card link)
  const swallowSwipeClick = (e) => { if (swiped.current) { swiped.current = false; e.preventDefault(); e.stopPropagation() } }

  const body = (
    <>
      {/* Media */}
      {item.type === 'video'
        ? <video src={item.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
        : <LazyImage src={item.url} className="w-full h-full" />
      }

      {/* Controls — only if multiple. Always visible on touch screens, hover-only on desktop. */}
      {total > 1 && (
        <>
          <button aria-label="Previous" onClick={press(() => go(current - 1))}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
            <ChevronLeft size={15} className="text-white" />
          </button>
          <button aria-label="Next" onClick={press(() => go(current + 1))}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10">
            <ChevronRight size={15} className="text-white" />
          </button>
          <div className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 z-10">
            {items.map((_, i) => (
              <button key={i} aria-label={`Show item ${i + 1}`} onClick={press(() => go(i))}
                className={`h-1 rounded-full transition-all duration-300 ${i === current ? 'w-4 bg-white' : 'w-1 bg-white/50'}`} />
            ))}
          </div>
        </>
      )}

      {/* Overlay children (badges etc) */}
      {children}
    </>
  )

  const cls = `relative overflow-hidden group ${className}`

  if (expandable) {
    return (
      <ExpandableMedia
        items={items} startIndex={current} loadFull={loadFull} footer={footer} onOpen={onOpen} className={cls}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClickCapture={swallowSwipeClick}
      >
        {body}
      </ExpandableMedia>
    )
  }
  return (
    <div className={cls} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onClickCapture={swallowSwipeClick}>
      {body}
    </div>
  )
}
