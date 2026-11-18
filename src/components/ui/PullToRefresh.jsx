import { useEffect, useRef, useState } from 'react'
import { Loader2, ArrowDown } from 'lucide-react'

// Pull a list down from the top to reload it (phones only).
//  onRefresh  async function that reloads the data
//  scrollRef  optional: a scrollable element inside the page (e.g. the chat list). Default: the whole page.
const THRESHOLD = 70, MAX = 110

export default function PullToRefresh({ onRefresh, scrollRef, children, disabled = false, className }) {
  const wrap = useRef(null)
  const [pull, setPull] = useState(0)
  const [busy, setBusy] = useState(false)
  const st = useRef({ y0: 0, x0: 0, active: false, pulling: false, dist: 0 })

  useEffect(() => {
    const el = wrap.current
    if (!el || disabled || !window.matchMedia?.('(pointer: coarse)').matches) return
    const atTop = () => (scrollRef?.current ? scrollRef.current.scrollTop : window.scrollY) <= 0

    const start = (e) => {
      if (busy || !atTop() || e.touches.length !== 1) return
      st.current = { y0: e.touches[0].clientY, x0: e.touches[0].clientX, active: true, pulling: false, dist: 0 }
    }
    const move = (e) => {
      const s = st.current
      if (!s.active) return
      const dy = e.touches[0].clientY - s.y0
      const dx = e.touches[0].clientX - s.x0
      if (!s.pulling) {
        if (dy < 0 || Math.abs(dx) > Math.abs(dy)) { s.active = false; return }   // scrolling down/sideways → not a pull
        if (dy < 10) return
        s.pulling = true
      }
      if (!atTop() && dy <= 0) { s.active = false; setPull(0); return }
      e.preventDefault()                                         // stop the browser's own bounce / refresh
      s.dist = Math.min(MAX, dy * 0.5)                           // resistance
      setPull(s.dist)
    }
    const end = async () => {
      const s = st.current
      if (!s.active) return
      s.active = false
      if (s.pulling && s.dist >= THRESHOLD) {
        setBusy(true); setPull(THRESHOLD * 0.8)
        try { await Promise.all([onRefresh?.(), new Promise(r => setTimeout(r, 600))]) } catch {}
        setBusy(false)
      }
      setPull(0); s.pulling = false
    }
    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', move, { passive: false })
    el.addEventListener('touchend', end)
    el.addEventListener('touchcancel', end)
    return () => { el.removeEventListener('touchstart', start); el.removeEventListener('touchmove', move); el.removeEventListener('touchend', end); el.removeEventListener('touchcancel', end) }
  }, [onRefresh, scrollRef, disabled, busy])

  const ready = pull >= THRESHOLD
  return (
    <div ref={wrap} className={className}>
      <div className="fixed left-1/2 z-30 -translate-x-1/2 pointer-events-none transition-opacity"
           style={{ top: 'calc(env(safe-area-inset-top) + 4.5rem)', opacity: pull > 8 || busy ? 1 : 0, transform: `translate(-50%, ${Math.max(0, pull - 30)}px)` }}>
        <div className="w-10 h-10 rounded-full bg-dark-800 border border-dark-600 shadow-lg flex items-center justify-center text-brand-400">
          {busy ? <Loader2 size={18} className="animate-spin" />
                : <ArrowDown size={18} className="transition-transform" style={{ transform: `rotate(${ready ? 180 : 0}deg)` }} />}
        </div>
      </div>
      {children}
    </div>
  )
}
