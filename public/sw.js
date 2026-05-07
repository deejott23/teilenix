// share|pa Service Worker — native Cache API, no external CDN dependencies

const CACHE_VERSION = 'v2'
const STATIC_CACHE = `static-assets-${CACHE_VERSION}`
const PAGE_CACHE   = `pages-cache-${CACHE_VERSION}`
const IMAGE_CACHE  = `image-cache-${CACHE_VERSION}`
const FONT_CACHE   = `google-fonts-${CACHE_VERSION}`
const APP_SHELL    = `app-shell-${CACHE_VERSION}`
const ALL_CACHES   = [STATIC_CACHE, PAGE_CACHE, IMAGE_CACHE, FONT_CACHE, APP_SHELL]

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(APP_SHELL).then(cache =>
      cache.addAll(['/', '/offline', '/manifest.json', '/apple-touch-icon.png'])
    )
  )
})

// ── Activate: delete old versioned caches ────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(k => !ALL_CACHES.includes(k))
            .map(k => caches.delete(k))
        )
      ),
    ])
  )
})

// ── Fetch: routing strategies ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return

  // Google Fonts → Cache First (fonts rarely change)
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, FONT_CACHE))
    return
  }

  // Images → Cache First
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }

  // JS + CSS → Stale While Revalidate (fast from cache, fresh in background)
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE))
    return
  }

  // Navigation (HTML pages) → Network First with 5s timeout + offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstWithFallback(request))
    return
  }
})

// ── Strategies ────────────────────────────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request)
  if (cached) return cached
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(cacheName)
      cache.put(request, response.clone())
    }
    return response
  } catch {
    return new Response('', { status: 503 })
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const networkPromise = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone())
    return response
  }).catch(() => cached)
  return cached || networkPromise
}

async function networkFirstWithFallback(request) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(request, { signal: controller.signal })
    clearTimeout(timeout)
    const cache = await caches.open(PAGE_CACHE)
    if (response.ok) cache.put(request, response.clone())
    return response
  } catch {
    clearTimeout(timeout)
    const cached = await caches.match(request, { ignoreSearch: true })
    if (cached) return cached
    const offline = await caches.match('/offline')
    return offline || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } })
  }
}
