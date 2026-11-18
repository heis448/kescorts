import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, SwitchCamera, Check, RotateCcw, CameraOff, Image as ImageIcon } from 'lucide-react'

// In-page live camera (no gallery): flip front/back, shutter, short video clips, face guide, retake/confirm.
//
//  mode      'photo' | 'video' | 'both'
//  facing    'user' (selfie) | 'environment' (back camera)
//  guide     'face' draws an oval to line your face up in
//  liveOnly  true = no gallery fallback (used for the verification selfie)
//  onCapture receives a File (photo → image/jpeg, video → mp4/webm)
//  onUnavailable called when the user chooses the gallery after the camera failed (ignored when liveOnly)
const MAX_PX = 2400

const pickVideoMime = () => {
  const options = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
  return options.find(t => window.MediaRecorder?.isTypeSupported?.(t)) || ''
}

const explain = (err) => {
  switch (err?.name) {
    case 'NotAllowedError':
    case 'SecurityError':      return 'Camera access is blocked. Allow the camera for this site in your browser settings, then try again.'
    case 'NotFoundError':
    case 'OverconstrainedError': return 'No camera was found on this device.'
    case 'NotReadableError':   return 'The camera is being used by another app. Close it and try again.'
    default:                   return 'The camera could not be started on this device.'
  }
}

export default function CameraCapture({
  open, onClose, onCapture, onUnavailable,
  mode = 'photo', facing = 'environment', guide = null, liveOnly = false, maxSeconds = 15, title,
}) {
  const videoRef  = useRef(null)
  const streamRef = useRef(null)
  const recRef    = useRef(null)
  const chunksRef = useRef([])
  const timerRef  = useRef(null)

  const [error, setError]       = useState(null)
  const [ready, setReady]       = useState(false)
  const [cam, setCam]           = useState(facing)
  const [kind, setKind]         = useState(mode === 'video' ? 'video' : 'photo')
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds]   = useState(0)
  const [shot, setShot]         = useState(null)        // { file, url, type }
  const [canFlip, setCanFlip]   = useState(false)
  const [attempt, setAttempt]   = useState(0)          // bump to retry starting the camera
  const wantAudio = mode !== 'photo'

  const stopStream = useCallback(() => {
    clearInterval(timerRef.current)
    try { if (recRef.current?.state === 'recording') recRef.current.stop() } catch {}
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setReady(false); setRecording(false)
  }, [])

  // Start (or restart after a flip) the camera stream
  useEffect(() => {
    if (!open || shot) return
    let cancelled = false
    setError(null); setReady(false)

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser cannot open the camera here. Open the site in Chrome or Safari.')
      return
    }
    ;(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: cam }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: wantAudio,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        const v = videoRef.current
        if (v) { v.srcObject = stream; await v.play().catch(() => {}) }
        setReady(true)
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => [])
        setCanFlip(devices.filter(d => d.kind === 'videoinput').length > 1)
      } catch (e) { if (!cancelled) setError(explain(e)) }
    })()
    return () => { cancelled = true; stopStream() }
  }, [open, cam, shot, wantAudio, stopStream, attempt])

  // Fresh start every time it opens; release the camera when it closes
  useEffect(() => {
    if (open) {
      setShot(null); setError(null); setCam(facing); setKind(mode === 'video' ? 'video' : 'photo'); setSeconds(0)
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = ''; if (!open) stopStream() }
  }, [open]) // eslint-disable-line

  useEffect(() => () => { stopStream(); if (shot?.url) URL.revokeObjectURL(shot.url) }, []) // eslint-disable-line

  const takePhoto = () => {
    const v = videoRef.current
    if (!v?.videoWidth) return
    const scale = Math.min(1, MAX_PX / Math.max(v.videoWidth, v.videoHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(v.videoWidth * scale); c.height = Math.round(v.videoHeight * scale)
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height)          // not mirrored: saved the way others will see it
    c.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
      setShot({ file, url: URL.createObjectURL(blob), type: 'image' })
      stopStream()
    }, 'image/jpeg', 0.92)
    try { navigator.vibrate?.(15) } catch {}
  }

  const startRecording = () => {
    if (!streamRef.current || !window.MediaRecorder) return setError('Video recording is not supported on this browser.')
    const mimeType = pickVideoMime()
    chunksRef.current = []
    const rec = new MediaRecorder(streamRef.current, mimeType ? { mimeType } : undefined)
    rec.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data) }
    rec.onstop = () => {
      clearInterval(timerRef.current)
      const type = (rec.mimeType || mimeType || 'video/webm').split(';')[0]
      const blob = new Blob(chunksRef.current, { type })
      if (!blob.size) return
      const ext = type.includes('mp4') ? 'mp4' : 'webm'
      const file = new File([blob], `clip-${Date.now()}.${ext}`, { type })
      setShot({ file, url: URL.createObjectURL(blob), type: 'video' })
      streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null
      setRecording(false)
    }
    rec.start(250)
    recRef.current = rec
    setRecording(true); setSeconds(0)
    const t0 = Date.now()
    timerRef.current = setInterval(() => {
      const s = (Date.now() - t0) / 1000
      setSeconds(s)
      if (s >= maxSeconds) { try { rec.stop() } catch {} }
    }, 100)
    try { navigator.vibrate?.(15) } catch {}
  }
  const stopRecording = () => { try { recRef.current?.stop() } catch {} }

  const retake = () => { if (shot?.url) URL.revokeObjectURL(shot.url); setShot(null) }
  const use = () => { const f = shot.file; onCapture?.(f); onClose?.() }
  const close = () => { stopStream(); onClose?.() }

  if (!open) return null

  const front = cam === 'user'
  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col select-none"
         style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }} role="dialog" aria-label="Camera">
      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <button onClick={close} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center" aria-label="Close camera"><X size={20} /></button>
        <p className="text-sm font-medium">{title || (kind === 'video' ? 'Record a clip' : 'Take a photo')}</p>
        {!shot && canFlip && !recording
          ? <button onClick={() => setCam(c => c === 'user' ? 'environment' : 'user')} className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center" aria-label="Switch camera"><SwitchCamera size={20} /></button>
          : <span className="w-10" />}
      </div>

      {/* viewfinder / preview */}
      <div className="relative flex-1 overflow-hidden bg-black">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-4 px-8">
            <CameraOff size={40} className="text-gray-500" />
            <p className="text-sm text-gray-300 max-w-xs">{error}</p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              <button onClick={() => setAttempt(a => a + 1)}
                className="btn-primary py-2.5 text-sm" data-testid="camera-retry">Try again</button>
              {!liveOnly && onUnavailable && (
                <button onClick={() => { close(); onUnavailable() }} className="btn-ghost py-2.5 text-sm flex items-center justify-center gap-2" data-testid="camera-gallery">
                  <ImageIcon size={16} /> Choose from gallery instead
                </button>
              )}
              {liveOnly && <p className="text-xs text-gray-500">A live camera photo is required for verification. Try a phone if this device has no camera.</p>}
            </div>
          </div>
        ) : shot ? (
          shot.type === 'image'
            ? <img src={shot.url} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
            : <video src={shot.url} className="absolute inset-0 w-full h-full object-contain" controls playsInline autoPlay loop />
        ) : (
          <>
            <video ref={videoRef} playsInline muted autoPlay data-testid="camera-video"
              className="absolute inset-0 w-full h-full object-cover" style={{ transform: front ? 'scaleX(-1)' : undefined }} />
            {guide === 'face' && ready && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center" data-testid="face-guide">
                <div className="rounded-[50%] border-2 border-white/80" style={{ width: '62%', aspectRatio: '3 / 4', boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)' }} />
                <p className="absolute bottom-6 text-xs text-white/90 bg-black/50 rounded-full px-3 py-1">Fit your face in the oval, good light, no filters</p>
              </div>
            )}
            {recording && <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 rounded-full px-3 py-1 text-xs"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />{Math.floor(seconds)}s / {maxSeconds}s</div>}
            {!ready && !error && <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-400">Starting camera…</div>}
          </>
        )}
      </div>

      {/* bottom controls */}
      <div className="relative z-10 px-6 py-5 min-h-[120px] flex flex-col items-center justify-center gap-3">
        {shot ? (
          <div className="flex items-center gap-4 w-full max-w-sm">
            <button onClick={retake} className="flex-1 py-3 rounded-2xl bg-white/10 text-sm font-medium flex items-center justify-center gap-2" data-testid="camera-retake"><RotateCcw size={16} /> Retake</button>
            <button onClick={use} className="flex-1 py-3 rounded-2xl bg-brand-600 text-sm font-semibold flex items-center justify-center gap-2" data-testid="camera-use"><Check size={16} /> Use {shot.type === 'video' ? 'clip' : 'photo'}</button>
          </div>
        ) : !error && (
          <>
            {mode === 'both' && !recording && (
              <div className="flex gap-1 bg-white/10 rounded-full p-1 text-xs">
                {['photo', 'video'].map(k => (
                  <button key={k} onClick={() => setKind(k)} className={`px-4 py-1 rounded-full capitalize ${kind === k ? 'bg-white text-black font-semibold' : 'text-gray-300'}`}>{k}</button>
                ))}
              </div>
            )}
            {kind === 'photo' ? (
              <button onClick={takePhoto} disabled={!ready} aria-label="Take photo" data-testid="camera-shutter"
                className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40">
                <span className="w-14 h-14 rounded-full bg-white" />
              </button>
            ) : (
              <button onClick={recording ? stopRecording : startRecording} disabled={!ready} aria-label={recording ? 'Stop recording' : 'Start recording'} data-testid="camera-record"
                className="w-[72px] h-[72px] rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform disabled:opacity-40">
                <span className={`bg-red-500 transition-all ${recording ? 'w-7 h-7 rounded-md' : 'w-14 h-14 rounded-full'}`} />
              </button>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
