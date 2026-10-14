/* ProtAI service worker: push notifications + safe static-asset caching.
   Navigations always go to the network (never serve a stale app shell). */

const STATIC_CACHE = "protai-static-v1";

self.addEventListener("install", (event) => {
  // @ts-ignore - service worker global scope
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // @ts-ignore
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)),
      );
      // @ts-ignore
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  // @ts-ignore
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Cache-bust-proof: only immutable hashed Next.js assets, same origin.
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      (async () => {
        // @ts-ignore
        const cache = await caches.open(STATIC_CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone());
        return res;
      })(),
    );
  }
  // Everything else (pages, API): network only — no stale shell risk.
});

// ---- Web push ----
self.addEventListener("push", (event) => {
  let payload = { title: "ProtAI", body: "You have a new alert.", url: "/dashboard" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    /* keep defaults */
  }
  event.waitUntil(
    // @ts-ignore
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  // @ts-ignore
  event.notification.close();
  const url = event.notification.data?.url ?? "/dashboard";
  event.waitUntil(
    (async () => {
      // @ts-ignore
      const wins = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const w of wins) {
        if (w.url.includes(self.location.origin)) {
          // @ts-ignore
          await w.focus();
          // @ts-ignore
          return w.navigate(url);
        }
      }
      // @ts-ignore
      return self.clients.openWindow(url);
    })(),
  );
});
