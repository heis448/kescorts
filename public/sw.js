// Service worker: receives web push and opens the right page on tap.
// Only the offline page is stored on the phone. Everything else is always fetched fresh.
const OFFLINE_CACHE = 'ke-offline-v2'
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(OFFLINE_CACHE).then(c => c.addAll(['/offline.html', '/logo-mark.png'])).then(() => self.skipWaiting()))
})
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== OFFLINE_CACHE) await caches.delete(k)
    await self.clients.claim()
  })())
})

// Present so browsers treat the site as an installable app. No caching: always fetches fresh from the network.
// Opening a page with no connection → friendly offline page instead of the browser's error
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match('/offline.html')))
  } else if (new URL(event.request.url).pathname === '/logo-mark.png') {
    // the offline page's logo: serve the stored copy so it shows with no connection
    event.respondWith(caches.match('/logo-mark.png').then(hit => hit || fetch(event.request)))
  }
})

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { title: 'RedRoom254', body: event.data?.text() } }
  event.waitUntil(
    self.registration.showNotification(data.title || 'RedRoom254', {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: data.tag || 'ke',          // same tag = replaces instead of stacking
      renotify: true,
      data: { url: data.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of all) {
      if ('focus' in c) { await c.focus(); if ('navigate' in c) c.navigate(url); return }
    }
    await self.clients.openWindow(url)
  })())
})
