const CACHE_NAME = 'wapkidlearn-v1'
const OFFLINE_URL = '/offline'

const PRECACHE = [
  '/',
  '/child/home',
  '/manifest.json',
]

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
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
  // Only handle GET requests for same-origin or next/static assets
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)

  // API calls: network-only, never cache
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached
      return fetch(event.request).then(response => {
        // Cache successful navigation responses and static assets
        if (
          response.ok &&
          (event.request.mode === 'navigate' || url.pathname.startsWith('/_next/static/'))
        ) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
        }
        return response
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/')
        }
      })
    })
  )
})
