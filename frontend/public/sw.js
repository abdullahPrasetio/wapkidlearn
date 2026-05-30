const CACHE_NAME = 'wapkidlearn-v2'

const PRECACHE = [
  '/manifest.json',
  '/favicon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/logo.png',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  // Skip API calls and Next.js internal requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) return

  // Navigation: Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // If offline and not in cache, we don't have much to show
          // unless we have an offline page. For now, try to find in cache
          return caches.match(event.request)
        })
    )
    return
  }

  // Static Assets & Others: Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        // Cache static assets and public images
        if (
          response.ok && 
          (url.pathname.startsWith('/_next/static/') || 
           url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/))
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      })
    })
  )
})
