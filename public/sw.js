// Tevaxia service worker: public offline screens and immutable build assets only.
const CACHE_VERSION = "tevaxia-v4";
const OFFLINE_PAGES = ["/offline", "/en/offline", "/de/offline", "/pt/offline", "/lb/offline"];
const PUBLIC_FILES = ["/manifest.json", "/logo-tevaxia-512.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.all([...OFFLINE_PAGES, ...PUBLIC_FILES].map(path =>
        cache.add(new Request(new URL(path, self.location.origin), { credentials: "omit", cache: "reload" })).catch(() => null)
      ));
    } catch { /* Offline support is optional when storage is unavailable. */ }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      // Remove our old navigation caches, without touching other applications' caches.
      await Promise.all(keys.filter(key => /^tevaxia-v\d+$/.test(key) && key !== CACHE_VERSION).map(key => caches.delete(key)));
    } catch { /* The new worker never reads old caches, even when storage cleanup is unavailable. */ }
    await self.clients.claim();
  })());
});

async function offlineResponse(pathname) {
  const locale = pathname.match(/^\/(en|de|pt|lb)(?:\/|$)/)?.[1];
  try {
    const cache = await caches.open(CACHE_VERSION);
    return (await cache.match(locale ? `/${locale}/offline` : "/offline"))
      || (await cache.match("/offline"))
      || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch {
    return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}

async function staticResponse(request) {
  let cache;
  try {
    cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request);
    if (cached) return cached;
  } catch { /* Fall through to the network. */ }
  const response = await fetch(request);
  if (response.ok && !/\b(private|no-store)\b/i.test(response.headers.get("Cache-Control") || "")) {
    try { if (cache) await cache.put(request, response.clone()); } catch { /* A full cache must not break the response. */ }
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || request.headers.has("authorization")) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/data/")
    || url.searchParams.has("_rsc") || request.headers.get("RSC") === "1") return;

  if (request.mode === "navigate") {
    // Never store or replay an arbitrary page: it may contain private data or a share token.
    event.respondWith(fetch(request).catch(() => offlineResponse(url.pathname)));
    return;
  }
  if (PUBLIC_FILES.includes(url.pathname) || (url.pathname.startsWith("/_next/static/")
    && /\.(js|css|svg|png|jpg|jpeg|webp|avif|woff2?|ico)$/.test(url.pathname))) {
    event.respondWith(staticResponse(request));
  }
});
