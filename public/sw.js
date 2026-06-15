const STATIC_CACHE = "hb-static-v2";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (isSensitivePath(url.pathname)) {
    return;
  }

  if (isStaticAssetRequest(request, url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

function isSensitivePath(pathname) {
  return [
    "/api/",
    "/admin",
    "/dashboard",
    "/auth",
    "/payment",
    "/book/",
    "/library",
  ].some((path) => pathname.startsWith(path));
}

function isStaticAssetRequest(request, pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/images/") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/logo.svg" ||
    pathname === "/pwa-icon-192.png" ||
    pathname === "/pwa-icon-512.png" ||
    ["font", "image", "script", "style"].includes(request.destination)
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }

  return response;
}
