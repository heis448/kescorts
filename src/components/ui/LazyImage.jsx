import { useState, useEffect, useRef } from 'react'

const MAX_RETRIES   = 3
const RETRY_DELAYS  = [3000, 6000, 12000]

export default function LazyImage({ src, alt = '', className = '', style }) {
  const [status, setStatus]   = useState('loading')
  const [attempt, setAttempt] = useState(0)
  const [buster, setBuster]   = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    setStatus('loading')
    setAttempt(0)
    setBuster('')
    return () => clearTimeout(timerRef.current)
  }, [src])

  const handleError = () => {
    clearTimeout(timerRef.current)
    const next = attempt + 1
    if (next <= MAX_RETRIES) {
      timerRef.current = setTimeout(() => {
        setAttempt(next)
        setBuster(`?r=${next}`)
        setStatus('loading')
      }, RETRY_DELAYS[attempt] || 12000)
      // Stay in loading (spinner) while waiting to retry
    } else {
      setStatus('failed') // give up — show nothing, just dark bg
    }
  }

  if (!src) return null

  return (
    <div className={`relative overflow-hidden bg-dark-800 ${className}`} style={style}>
      {/* Spinner while loading / retrying */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-dark-600 border-t-brand-500 rounded-full animate-spin" />
        </div>
      )}

      {status !== 'failed' && (
        <img
          src={`${src}${buster}`}
          alt={alt}
          loading="lazy"
          decoding="async"
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
