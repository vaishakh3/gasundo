const CACHE_NAME = 'gasundo-v2'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        '/manifest.json',
        '/icons/apple-touch-icon.png',
        '/icons/icon-192-opaque.png',
        '/icons/icon-512-opaque.png',
      ])
    ).catch(() => {})
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const requestUrl = new URL(event.request.url)
  const isSameOrigin = requestUrl.origin === self.location.origin
  const isNavigation = event.request.mode === 'navigate'
  const isImmutableStaticAsset =
    isSameOrigin &&
    requestUrl.pathname.startsWith('/_next/static/')
  const isRuntimeAsset =
    isSameOrigin &&
    (
      requestUrl.pathname.startsWith('/icons/') ||
      requestUrl.pathname.startsWith('/logos/') ||
      requestUrl.pathname.startsWith('/splash/') ||
      requestUrl.pathname === '/manifest.json' ||
      requestUrl.pathname === '/default-marker.png'
    )

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }

          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          return cached || caches.match('/')
        })
    )
    return
  }

  if (isRuntimeAsset) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }

          return response
        })
        .catch(async () => {
          const cached = await caches.match(event.request)
          return cached || fetch(event.request)
        })
    )
    return
  }

  if (!isImmutableStaticAsset) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached
      }

      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }

        return response
      })
    })
  )
})
