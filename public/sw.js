// Lets the app open with no connection and start fast once installed.
//
// - Same-origin files only. Requests to the database (a different address) are never touched,
//   so campaigns, sign-in and sync always talk to the real server.
// - Pages: network first, so an update reaches people the next time they open the app; the saved
//   copy is used only when there is no connection.
// - Built files under /assets/ have a fingerprint in their name and never change, so once saved
//   they are used straight away.
const CACHE = 'avatar-dnd-v1'

self.addEventListener('install', () => {
    self.skipWaiting()
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) => Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name))))
            .then(() => self.clients.claim()),
    )
})

async function networkFirst(request) {
    const cache = await caches.open(CACHE)
    try {
        const fresh = await fetch(request)
        if (fresh.ok) cache.put(request, fresh.clone())
        return fresh
    } catch (error) {
        const saved = (await cache.match(request)) || (await cache.match('/'))
        if (saved) return saved
        throw error
    }
}

async function cacheFirst(request) {
    const cache = await caches.open(CACHE)
    const saved = await cache.match(request)
    if (saved) return saved
    const fresh = await fetch(request)
    if (fresh.ok) cache.put(request, fresh.clone())
    return fresh
}

self.addEventListener('fetch', (event) => {
    const request = event.request
    if (request.method !== 'GET') return
    const url = new URL(request.url)
    if (url.origin !== self.location.origin) return

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request))
    } else if (url.pathname.startsWith('/assets/')) {
        event.respondWith(cacheFirst(request))
    } else {
        event.respondWith(networkFirst(request))
    }
})
