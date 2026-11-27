import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import LazyImage from './LazyImage'
import { X, ChevronLeft, ChevronRight, Play, Maximize2 } from 'lucide-react'

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
const isYT = (u = '') => u.includes('youtube.com') || u.includes('youtu.be')
export const kindOf = (m) => (isYT(m?.url) ? 'yt' : m?.type === 'video' ? 'video' : 'image')
const ytEmbed = (url, { loop = false } = {}) => {
  const id = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]
  if (!id) return url
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1${loop ? `&loop=1&playlist=${id}` : ''}`
}

// ================================================================
// ZoomableImage — pinch / double-tap / wheel zoom, drag to pan,
// swipe left-right to change photo, swipe down to close
// ================================================================
function ZoomableImage({ src, canPrev, canNext, onPrev, onNext, onDismiss, onPull }) {
  const box  = useRef(null)
  const ptrs = useRef(new Map())
  const g    = useRef({ mode: null, sx: 0, sy: 0, t: 0, vx: 0, vy: 0, d0: 1, s0: 1, lastTap: 0, moved: false })
  const [v, setV]       = useState({ s: 1, x: 0, y: 0 })
  const [drag, setDrag] = useState({ x: 0, y: 0 })
  const [busy, setBusy] = useState(false)
  const vRef = useRef(v)
  vRef.current = v

  const limitPan = (s, x, y) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return { x, y }
    const mx = ((s - 1) * r.width) / 2, my = ((s - 1) * r.height) / 2
    return { x: clamp(x, -mx, mx), y: clamp(y, -my, my) }
  }

  const down = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const G = g.current
    setBusy(true)
    if (ptrs.current.size === 2) {
      const [a, b] = [...ptrs.current.values()]
      G.mode = 'pinch'; G.d0 = Math.hypot(a.x - b.x, a.y - b.y) || 1; G.s0 = vRef.current.s
    } else {
      G.mode = null; G.sx = e.clientX; G.sy = e.clientY; G.t = Date.now()
      G.vx = vRef.current.x; G.vy = vRef.current.y; G.moved = false
    }
  }

  const move = (e) => {
    if (!ptrs.current.has(e.pointerId)) return
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const G = g.current
    if (G.mode === 'pinch' && ptrs.current.size >= 2) {
      const [a, b] = [...ptrs.current.values()]
      const s = clamp((G.s0 * Math.hypot(a.x - b.x, a.y - b.y)) / G.d0, 1, 5)
      setV(p => (s <= 1 ? { s: 1, x: 0, y: 0 } : { s, ...limitPan(s, p.x, p.y) }))
      G.moved = true
      return
    }
    if (ptrs.current.size !== 1) return
    const dx = e.clientX - G.sx, dy = e.clientY - G.sy
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) G.moved = true
    if (vRef.current.s > 1) {                       // zoomed in: drag pans the photo
      const n = limitPan(vRef.current.s, G.vx + dx, G.vy + dy)
      setV(p => ({ ...p, ...n }))
      return
    }
    if (!G.mode && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) G.mode = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
    if (G.mode === 'h') {
      const resist = (dx > 0 && !canPrev) || (dx < 0 && !canNext)
      setDrag({ x: resist ? dx * 0.3 : dx, y: 0 })
    } else if (G.mode === 'v') {
      const y = dy > 0 ? dy : dy * 0.25
      setDrag({ x: 0, y }); onPull?.(y)
    }
  }

  const up = (e) => {
    ptrs.current.delete(e.pointerId)
    const G = g.current
    if (G.mode === 'pinch') {
      if (ptrs.current.size === 1) {                // one finger left: carry on as a pan
        const [p] = [...ptrs.current.values()]
        G.mode = null; G.sx = p.x; G.sy = p.y; G.vx = vRef.current.x; G.vy = vRef.current.y
      } else if (ptrs.current.size === 0) {
        G.mode = null; setBusy(false)
        if (vRef.current.s < 1.05) setV({ s: 1, x: 0, y: 0 })
      }
      return
    }
    if (ptrs.current.size > 0) return
    const dx = e.clientX - G.sx, dy = e.clientY - G.sy, dt = Math.max(1, Date.now() - G.t)
    if (e.type === 'pointerup') {
      if (G.mode === 'h') {
        const fast = Math.abs(dx) / dt > 0.5 && Math.abs(dx) > 25
        if (Math.abs(dx) > 70 || fast) { if (dx < 0 && canNext) onNext(); else if (dx > 0 && canPrev) onPrev() }
      } else if (G.mode === 'v') {
        if (dy > 110) onDismiss()
      } else if (!G.moved) {                        // tap → double-tap toggles zoom
        const now = Date.now()
        if (now - G.lastTap < 300) { G.lastTap = 0; setV(vRef.current.s > 1 ? { s: 1, x: 0, y: 0 } : { s: 2.5, x: 0, y: 0 }) }
        else G.lastTap = now
      }
    }
    G.mode = null
    setBusy(false)
    setDrag({ x: 0, y: 0 })
    onPull?.(0)
  }

  const wheel = (e) => {
    const s = clamp(vRef.current.s - e.deltaY * 0.002, 1, 5)
    setV(p => (s <= 1 ? { s: 1, x: 0, y: 0 } : { s, ...limitPan(s, p.x, p.y) }))
  }

  return (
    <div
      ref={box}
      className="relative w-full h-full flex items-center justify-center overflow-hidden"
      style={{ touchAction: 'none' }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onWheel={wheel}
      onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget && vRef.current.s === 1) onDismiss() }}
    >
      <img
        src={src} alt="" draggable={false}
        className="max-w-full max-h-full object-contain select-none"
        style={{
          transform: `translate3d(${v.x + drag.x}px, ${v.y + drag.y}px, 0) scale(${v.s})`,
          transition: busy ? 'none' : 'transform .2s ease',
          willChange: 'transform',
        }}
      />
    </div>
  )
}

// ================================================================
// MEDIA LIGHTBOX — fullscreen viewer (Instagram-style)
//   items:  [{ url, type: 'image' | 'video', thumbnail? }]
//   footer: node, or (close) => node — shown under the photo (e.g. a "View profile" button)
// ================================================================
export function MediaLightbox({ items = [], startIndex = 0, onClose, footer }) {
  const total = items.length
  const [current, setCurrent] = useState(clamp(startIndex, 0, Math.max(0, total - 1)))
  const [pull, setPull]       = useState(0)
  const dir       = useRef(0)
  const lastUrl   = useRef(items[current]?.url)
  const prevItems = useRef(items)
  const item      = items[current]
  const kind      = kindOf(item)

  const go = (d) => { dir.current = d; setCurrent(c => clamp(c + d, 0, Math.max(0, total - 1))) }

  // If the list is replaced while open (full album loaded), stay on the same photo
  useEffect(() => {
    if (prevItems.current === items) return
    prevItems.current = items
    const idx = items.findIndex(m => m.url === lastUrl.current)
    setCurrent(idx >= 0 ? idx : 0)
  }, [items])
  useEffect(() => { lastUrl.current = items[current]?.url }, [current, items])

  // Keyboard
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [total, onClose])

  // Lock page scroll behind the viewer
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  // Preload neighbours so swiping feels instant
  useEffect(() => {
    ;[current - 1, current + 1].forEach(i => {
      const m = items[i]
      if (m && kindOf(m) === 'image') { const im = new Image(); im.src = m.url }
    })
  }, [current, items])

  if (!item) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[100] flex flex-col select-none"
      style={{
        background: `rgba(0,0,0,${Math.max(0.35, 0.96 - pull / 500)})`,
        paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)',
      }}
      role="dialog" aria-modal="true"
      // stopPropagation: the viewer is rendered inside cards that are links — a tap here must never navigate
      onClick={(e) => { e.stopPropagation(); onClose() }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
        {total > 1
          ? <span className="text-white text-sm bg-black/50 px-3 py-1 rounded-full">{current + 1} / {total}</span>
          : <span />}
        <button aria-label="Close" onClick={onClose} className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
          <X size={22} className="text-white" />
        </button>
      </div>

      {/* Stage */}
      <div className="relative flex-1 min-h-0 w-full">
        {current > 0 && (
          <button aria-label="Previous" onClick={e => { e.stopPropagation(); go(-1) }}
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <ChevronLeft size={26} className="text-white" />
          </button>
        )}
        {current < total - 1 && (
          <button aria-label="Next" onClick={e => { e.stopPropagation(); go(1) }}
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
            <ChevronRight size={26} className="text-white" />
          </button>
        )}

        <motion.div
          key={current}
          initial={{ opacity: 0, x: dir.current * 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.18 }}
          className="absolute inset-0"
        >
          {kind === 'image' ? (
            <ZoomableImage
              src={item.url}
              canPrev={current > 0} canNext={current < total - 1}
              onPrev={() => go(-1)} onNext={() => go(1)}
              onDismiss={onClose} onPull={setPull}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center px-3"
              onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) onClose() }}>
              {kind === 'yt' ? (
                <iframe src={ytEmbed(item.url)} className="w-full max-w-4xl aspect-video rounded-lg" allowFullScreen allow="autoplay; encrypted-media" />
              ) : (
                <video
                  key={item.url} src={item.url} poster={item.thumbnail || undefined}
                  className="max-w-full max-h-full rounded-lg"
                  controls autoPlay playsInline loop muted
                  onClick={e => e.stopPropagation()}
                />
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer: thumbnails + optional action */}
      {(total > 1 || footer) && (
        <div className="flex-shrink-0 px-3 pt-2 pb-3 space-y-2" onClick={e => e.stopPropagation()}>
          {total > 1 && (
            <div className="flex gap-2 overflow-x-auto mx-auto w-max max-w-full pb-1">
              {items.map((m, i) => (
                <button key={i} aria-label={`Show item ${i + 1}`}
                  onClick={() => { dir.current = i > current ? 1 : -1; setCurrent(i) }}
                  className={`relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-white' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                  {kindOf(m) === 'image'
                    ? <LazyImage src={m.url} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-dark-600 flex items-center justify-center">
                        {m.thumbnail && <LazyImage src={m.thumbnail} className="w-full h-full object-cover" />}
                        <Play size={14} className="text-white absolute" fill="white" />
                      </div>}
                </button>
              ))}
            </div>
          )}
          {footer && <div className="max-w-md mx-auto">{typeof footer === 'function' ? footer(onClose) : footer}</div>}
        </div>
      )}
    </motion.div>,
    document.body
  )
}

// ================================================================
// EXPANDABLE MEDIA — wrap any card photo block: tapping the photo opens the viewer.
//   • Buttons, links and anything marked data-nav inside keep their own behaviour
//     (e.g. the name strip still opens the profile).
//   • loadFull (optional): async () => items — fetches the whole album after opening;
//     the viewer shows the card's own photo instantly and swaps the album in when it arrives.
// ================================================================
export function ExpandableMedia({ items = [], startIndex = 0, loadFull, footer, onOpen, className = '', children, ...rest }) {
  const [open, setOpen] = useState(false)
  const [full, setFull] = useState(null)
  const loading  = useRef(false)
  const startUrl = useRef(null)

  const handle = (e) => {
    if (!items.length) return
    const hit = e.target.closest('[data-nav],button,a,input,select,textarea')
    if (hit && e.currentTarget.contains(hit)) return
    e.preventDefault()    // cards are often inside a <Link> — don't navigate
    e.stopPropagation()   // …and don't trigger the card's own click handler
    startUrl.current = items[startIndex]?.url
    setOpen(true)
    onOpen?.()
    if (loadFull && !full && !loading.current) {
      loading.current = true
      Promise.resolve(loadFull())
        .then(list => { if (Array.isArray(list) && list.length) setFull(list) })
        .catch(() => {})
        .finally(() => { loading.current = false })
    }
  }

  const shown = full || items
  const start = Math.max(0, shown.findIndex(m => m.url === startUrl.current))

  return (
    <>
      <div className={`${className} ${items.length ? 'cursor-zoom-in' : ''}`} onClick={handle} {...rest}>{children}</div>
      <AnimatePresence>
        {open && <MediaLightbox items={shown} startIndex={start} footer={footer} onClose={() => setOpen(false)} />}
      </AnimatePresence>
    </>
  )
}

// ================================================================
// MEDIA GALLERY — inline display with slider (swipe on phones) and autoplay video
// ================================================================
export default function MediaGallery({ items = [], className = '' }) {
  const [current, setCurrent]   = useState(0)
  const [lightbox, setLightbox] = useState(null) // index
  const touch  = useRef(null)
  const swiped = useRef(false)

  if (!items || items.length === 0) return null

  const item = items[current]
  const kind = kindOf(item)

  const onTouchStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; swiped.current = false }
  const onTouchEnd = (e) => {
    const t = touch.current
    if (!t) return
    const dx = e.changedTouches[0].clientX - t.x, dy = e.changedTouches[0].clientY - t.y
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped.current = true
      setCurrent(c => clamp(c + (dx < 0 ? 1 : -1), 0, items.length - 1))
    }
  }

  return (
    <>
      <div className={`relative rounded-2xl overflow-hidden bg-dark-800 ${className}`}>
        {/* Main display — tap anywhere to open full screen */}
        <div
          className="relative cursor-zoom-in"
          style={{ aspectRatio: '16/9' }}
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          onClick={() => { if (swiped.current) { swiped.current = false; return } setLightbox(current) }}
        >
          {kind === 'image' ? (
            <LazyImage src={item.url} className="w-full h-full" />
          ) : kind === 'yt' ? (
            <div className="relative w-full h-full cursor-default" onClick={e => e.stopPropagation()}>
              <iframe src={ytEmbed(item.url, { loop: true })} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
            </div>
          ) : (
            <video
              key={item.url} src={item.url}
              className="w-full h-full object-cover"
              autoPlay muted loop playsInline poster={item.thumbnail || undefined}
            />
          )}

          {kind === 'video' && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full pointer-events-none">
              <Play size={10} className="text-white" fill="white" />
              <span className="text-white text-xs">Video</span>
            </div>
          )}

          {/* Expand button — always visible (hover-only icons never show on phones) */}
          <button
            aria-label="View full screen"
            onClick={e => { e.stopPropagation(); setLightbox(current) }}
            className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-black/80 rounded-lg"
          >
            <Maximize2 size={16} className="text-white" />
          </button>
        </div>

        {/* Navigation arrows */}
        {items.length > 1 && (
          <>
            {current > 0 && (
              <button aria-label="Previous" onClick={() => setCurrent(c => c - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors">
                <ChevronLeft size={18} className="text-white" />
              </button>
            )}
            {current < items.length - 1 && (
              <button aria-label="Next" onClick={() => setCurrent(c => c + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/60 hover:bg-black/80 rounded-full transition-colors">
                <ChevronRight size={18} className="text-white" />
              </button>
            )}
          </>
        )}

        {/* Dots */}
        {items.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 pointer-events-none">
            {items.map((_, i) => (
              <span key={i} className={`rounded-full transition-all ${i === current ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnails strip for 3+ items */}
      {items.length >= 3 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {items.map((m, i) => (
            <button key={i} aria-label={`Show item ${i + 1}`} onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === current ? 'border-brand-500' : 'border-transparent opacity-60 hover:opacity-100'}`}>
              {kindOf(m) === 'image'
                ? <LazyImage src={m.url} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-dark-700 flex items-center justify-center relative">
                    {m.thumbnail ? <LazyImage src={m.thumbnail} className="w-full h-full" /> : null}
                    <Play size={14} className="text-white absolute" fill="white" />
                  </div>}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox !== null && (
          <MediaLightbox items={items} startIndex={lightbox} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
