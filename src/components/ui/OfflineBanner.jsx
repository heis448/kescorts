import { useEffect, useState } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

// Friendly strip at the top when the connection drops, and a brief "back online" when it returns.
export default function OfflineBanner() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [justBack, setJustBack] = useState(false)

  useEffect(() => {
    let t
    const down = () => { setOnline(false); setJustBack(false) }
    const up   = () => { setOnline(true); setJustBack(true); t = setTimeout(() => setJustBack(false), 2500) }
    window.addEventListener('offline', down)
    window.addEventListener('online', up)
    return () => { window.removeEventListener('offline', down); window.removeEventListener('online', up); clearTimeout(t) }
  }, [])

  if (online && !justBack) return null
  return (
    <div role="status" aria-live="polite"
      className={`fixed top-0 inset-x-0 z-[90] flex items-center justify-center gap-2 py-2 text-xs font-medium ${online ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-black'}`}
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)' }}>
      {online ? <><Wifi size={14} /> Back online</> : <><WifiOff size={14} /> You're offline. We'll reconnect automatically.</>}
    </div>
  )
}
