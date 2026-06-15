const CACHE = 'ozbloom-v2'
const STATIC = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(STATIC)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  if (url.pathname.startsWith('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() =>
        new Response(JSON.stringify({ flowers: [] }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached ?? fetch(e.request).then((res) => {
        if (res.ok && e.request.method === 'GET') {
          const ct = res.headers.get('content-type') || ''
          if (!ct.includes('text/html')) {
            const cloned = res.clone()
            caches.open(CACHE).then((c) => c.put(e.request, cloned))
          }
        }
        return res
      })
    )
  )
})
