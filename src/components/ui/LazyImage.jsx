import { useState, useEffect, useRef } from 'react'
import { ImageOff } from 'lucide-react'

const MAX_RETRIES   = 3
const ERROR_DELAYS  = [1500, 4000, 8000]          // wait before retrying after the server answered with an error
const STALL_LIMITS  = [12000, 20000, 30000, 45000] // give up on a request that never answers; long enough for big photos on slow mobile data

// Lazy-loaded image with spinner, automatic retries and a tap-to-retry fallback.
//
// Why the stall timer matters: a request that never answers (no load, no error) holds one of the browser's
// ~6 connections to that host. A few of those block EVERY other image from the same host, so pages stay on
// spinners until a refresh. Re-creating the <img> after a timeout cancels the stalled request and frees the slot.
//
// `priority` = above-the-fold image: load immediately instead of lazily.
export default function LazyImage({ src, alt = '', className = '', style, priority = false }) {
  const [status, setStatus]   = useState('loading')   // loading | loaded | failed
  const [attempt, setAttempt] = useState(0)
  const imgRef   = useRef(null)
  const timerRef = useRef(null)
  const prevSrc  = useRef(src)
  const aborted  = useRef(false)   // true while we've deliberately cancelled a stalled request (ignore its error event)

  // New src → start over (but never on first mount: that could undo a load that already finished)
  useEffect(() => {
    if (prevSrc.current === src) return
    prevSrc.current = src
    clearTimeout(timerRef.current)
    setStatus('loading')
    setAttempt(0)
  }, [src])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Removing an <img> from the page does NOT reliably cancel its request. Clearing src does,
  // which is what actually frees the connection for the other images.
  const abortRequest = () => {
    const img = imgRef.current
    if (img) { aborted.current = true; img.removeAttribute('src') }
  }

  const retry = (delay) => {
    clearTimeout(timerRef.current)
    const next = attempt + 1
    if (next > MAX_RETRIES) { setStatus('failed'); return }
    timerRef.current = setTimeout(() => {
      aborted.current = false
      setAttempt(next)          // new element + cache-buster → browser asks again
      setStatus('loading')
    }, delay)
  }

  const handleError = () => { if (!aborted.current) retry(ERROR_DELAYS[attempt] ?? 8000) }

  // Catch images that finished before our listener existed (cache hits), and
  // stop waiting on requests that never answer.
  useEffect(() => {
    if (status !== 'loading') return
    const img = imgRef.current
    if (img && img.complete) {
      img.naturalWidth > 0 ? setStatus('loaded') : handleError()
      return
    }
    const stall = setTimeout(() => { abortRequest(); retry(300) }, STALL_LIMITS[Math.min(attempt, STALL_LIMITS.length - 1)])
    return () => clearTimeout(stall)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, attempt, src])

  // Back online after a failure → try the failed images again automatically
  useEffect(() => {
    if (status !== 'failed') return
    const again = () => { setAttempt(a => a + 1); setStatus('loading') }
    window.addEventListener('online', again)
    return () => window.removeEventListener('online', again)
  }, [status])

  const retryNow = (e) => {
    e.preventDefault(); e.stopPropagation()
    setAttempt(a => a + 1)
    setStatus('loading')
  }

  if (!src) return null

  // Never add a cache-buster to blob:/data: URLs
  const canBust  = !/^(blob:|data:)/.test(src)
  const finalSrc = attempt > 0 && canBust ? `${src}${src.includes('?') ? '&' : '?'}r=${attempt}` : src

  return (
    <div className={`relative overflow-hidden bg-dark-800 ${className}`} style={style}>
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-dark-600 border-t-brand-500 rounded-full animate-spin" />
        </div>
      )}

      {status === 'failed' ? (
        <button
          type="button"
          onClick={retryNow}
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-600 hover:text-gray-400"
          aria-label="Image failed to load — tap to retry"
        >
          <ImageOff size={20} />
          <span className="text-[10px]">Tap to retry</span>
        </button>
      ) : (
        <img
          ref={imgRef}
          key={attempt}
          src={finalSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onLoad={() => setStatus('loaded')}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            status === 'loaded' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  )
}
