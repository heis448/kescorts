import api from './api'

export const isPushSupported = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent)
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true

export function registerSW() {
  if (!('serviceWorker' in navigator)) return
  const reg = () => navigator.serviceWorker.register('/sw.js').catch(() => {})
  document.readyState === 'complete' ? reg() : window.addEventListener('load', reg)
}

// navigator.serviceWorker.ready never resolves if registration failed — don't let the UI hang on it
const swReady = (ms = 6000) => Promise.race([
  navigator.serviceWorker.ready,
  new Promise((_, rej) => setTimeout(() => rej(new Error('Service worker not ready')), ms)),
])

const urlBase64ToUint8Array = (b64) => {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export async function getExistingSubscription() {
  if (!isPushSupported()) return null
  try { return await (await swReady(3000)).pushManager.getSubscription() } catch { return null }
}

// Ask permission, subscribe, and send the subscription to the API.
// Returns 'granted' | 'denied' | 'unavailable' | 'unsupported'
export async function enablePush() {
  if (!isPushSupported()) return 'unsupported'
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm

  const { data } = await api.get('/push/public-key')
  if (!data?.enabled || !data.key) return 'unavailable'

  const reg = await swReady()
  const sub = (await reg.pushManager.getSubscription()) ||
    await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(data.key) })

  await api.post('/push/subscribe', sub.toJSON())
  return 'granted'
}

// Re-attach an existing browser subscription to the currently logged-in user (shared devices / re-login)
export async function syncSubscription() {
  try {
    const sub = await getExistingSubscription()
    if (sub && Notification.permission === 'granted') await api.post('/push/subscribe', sub.toJSON())
  } catch {}
}

// Called on logout so a shared device stops receiving the previous user's alerts.
export async function unsubscribePush(token) {
  try {
    const sub = await getExistingSubscription()
    if (sub && token) await api.post('/push/unsubscribe', { endpoint: sub.endpoint }, { headers: { Authorization: `Bearer ${token}` } })
  } catch {}
}
