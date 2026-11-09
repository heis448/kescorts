import { useState, useEffect, useRef } from 'react'
import { ImageOff } from 'lucide-react'

const MAX_RETRIES  = 3
const RETRY_DELAYS = [1500, 4000, 8000]   // quick first retry — most failures are a one-off blip

// Lazy-loaded image with spinner, automatic retries, and a tap-to-retry fallback.
// `priority` = above-the-fold image: load immediately instead of lazily.
export default function LazyImage({ src, alt = '', className = '', style, priority = false }) {
  const [status, setStatus]   = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    setStatus('loading')
    setAttempt(0)
    return () => clearTimeout(timerRef.current)
  }, [src])

  const handleError = () => {
    clearTimeout(timerRef.current)
    const next = attempt + 1
    if (next <= MAX_RETRIES) {
      timerRef.current = setTimeout(() => {
        setAttempt(next)          // new cache-buster → browser re-requests the file
        setStatus('loading')
      }, RETRY_DELAYS[attempt] || 8000)
    } else {
      setStatus('failed')
    }
  }

  const retryNow = (e) => {
    e.preventDefault(); e.stopPropagation()
    setAttempt(a => a + 1)
    setStatus('loading')
  }

  if (!src) return null

  // Never add a cache-buster to blob:/data: URLs
  const canBust = !/^(blob:|data:)/.test(src)
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
