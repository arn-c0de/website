/**
 * Tombstone — the site no longer ships an offline cache.
 *
 * The old worker held every asset under one cache name that never changed
 * between deploys, so a visitor could end up with a half-updated app and no
 * way to recover from inside the page. A static site loads fast enough
 * without it, and the repo snapshot already covers a rate-limited API.
 *
 * The file has to stay: a browser that still holds the old registration
 * fetches this path when it checks for an update, and only then can the
 * caches be cleared and the registration dropped.
 *
 * In place since 2026-08-04. Browsers check a registered worker for updates
 * at least once a day on a visit, so anyone who has come back since then is
 * clean. Delete this file on or after 2027-02-01.
 */

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
      await self.registration.unregister()
      // Reload the open tabs so they leave the worker behind straight away.
      const clients = await self.clients.matchAll({ type: 'window' })
      for (const client of clients) client.navigate(client.url)
    })(),
  )
})
