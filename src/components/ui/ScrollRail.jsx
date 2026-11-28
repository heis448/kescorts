import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Horizontal scroller that works with a mouse as well as a finger:
//   • phones: normal swipe (+ snap if the className uses it)
//   • desktop: arrow buttons on hover (only when there is more to see) and click-and-drag with the mouse
// Pass the same classes you would put on the scrolling <div> (flex gap-3 overflow-x-auto no-scrollbar …).
export default function ScrollRail({ children, className = '', arrows = true }) {
  const ref  = useRef(null)
  const drag = useRef({ down: false, x: 0, left: 0, moved: false })
  const [more, setMore] = useState({ left: false, right: false })

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    // the first item sits after the rail's left padding, so that offset is the true "start"
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0
    setMore({ left: el.scrollLeft > pad + 4, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 })
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null
    ro?.observe(el)
    return () => { el.removeEventListener('scroll', update); ro?.disconnect() }
  }, [update, children])

  const nudge = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' })

  // Mouse drag-to-scroll (touch and pen keep the browser's native swipe)
  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || !ref.current) return
    const el = ref.current
    drag.current = { down: true, x: e.clientX, left: el.scrollLeft, moved: false }
    const move = (ev) => {
      const d = drag.current
      const dx = ev.clientX - d.x
      if (!d.moved && Math.abs(dx) > 5) { d.moved = true; el.style.scrollSnapType = 'none'; el.style.cursor = 'grabbing'; el.style.userSelect = 'none' }
      if (d.moved) el.scrollLeft = d.left - dx
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      drag.current.down = false
      el.style.scrollSnapType = ''; el.style.cursor = ''; el.style.userSelect = ''
      // keep `moved` true until the click that follows the drag has been swallowed
      setTimeout(() => { drag.current.moved = false }, 0)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  // A drag must never count as a click on a card/link inside the rail
  const onClickCapture = (e) => { if (drag.current.moved) { e.preventDefault(); e.stopPropagation() } }

  const btn = 'hidden md:flex absolute top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-dark-800/90 border border-white/15 text-white shadow-lg hover:bg-brand-600 hover:border-brand-500 transition-colors'

  return (
    <div className="relative">
      <div ref={ref} className={className} onPointerDown={onPointerDown} onClickCapture={onClickCapture} onDragStart={(e) => e.preventDefault()}>
        {children}
      </div>
      {arrows && more.left  && <button type="button" aria-label="Scroll left"  onClick={() => nudge(-1)} className={`${btn} left-2`}><ChevronLeft size={18} /></button>}
      {arrows && more.right && <button type="button" aria-label="Scroll right" onClick={() => nudge(1)}  className={`${btn} right-2`}><ChevronRight size={18} /></button>}
    </div>
  )
}
