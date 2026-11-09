// Captures the browser's "install app" offer. Import this file early (main.jsx) so the event isn't missed.
let deferred = null
const listeners = new Set()
const emit = () => listeners.forEach(fn => fn())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; emit() })
  window.addEventListener('appinstalled', () => { deferred = null; emit() })
}

export const canInstallNative = () => !!deferred
export const isInstalled = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true)
export const isIOSSafari = () => {
  const ua = navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua)
}
export const onInstallChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }

export async function promptInstall() {
  if (!deferred) return 'unavailable'
  deferred.prompt()
  const { outcome } = await deferred.userChoice
  deferred = null
  emit()
  return outcome            // 'accepted' | 'dismissed'
}
