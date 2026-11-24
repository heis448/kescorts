import { useEffect, useRef } from 'react'
import api from '../../utils/api'

// Counts a sponsor "view" only when its card is actually on screen (at least half of it), once per page load.
// (Before, every sponsor was counted on every page load, even when nobody scrolled to it.)
const counted = new Set()

export function useImpression(kind, id) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    const key = `${kind}:${id}`
    if (!el || !id || counted.has(key) || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && e.intersectionRatio >= 0.5) {
        counted.add(key)
        api.post(`/admin/${kind}/${id}/impression`).catch(() => {})
        io.disconnect()
      }
    }, { threshold: [0.5] })
    io.observe(el)
    return () => io.disconnect()
  }, [kind, id])
  return ref
}
