const STATIC_CACHE = "hb-static-v3";
const PAGE_CACHE = "hb-pages-v1";
const OFFLINE_URL = "/offline";
const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/pwa-icon-192.png",
  "/pwa-icon-512.png",
  "/logo.svg",
];
const PUBLIC_PAGE_FALLBACKS = [
  OFFLINE_URL,
  "/home",
  "/librairie",
  "/books",
  "/blog",
  "/faq",
  "/qui-sommes-nous",
  "/services",
  "/ressources",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => Promise.allSettled(STATIC_ASSETS.map((asset) => cache.add(asset)))),
      caches.open(PAGE_CACHE).then((cache) => Promise.allSettled(PUBLIC_PAGE_FALLBACKS.map((page) => cache.add(page)))),
    ]).catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => ![STATIC_CACHE, PAGE_CACHE].includes(key)).map((key) => caches.delete(key))),
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

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request, url));
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
    "/login",
    "/register",
    "/payment",
    "/book/",
    "/library",
  ].some((path) => pathname.startsWith(path));
}

function isPublicNavigationPath(pathname) {
  return !isSensitivePath(pathname);
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

async function networkFirstNavigation(request, url) {
  const cache = await caches.open(PAGE_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok && isPublicNavigationPath(url.pathname)) {
      await cache.put(url.pathname, response.clone());
    }

    return response;
  } catch {
    const cachedPage = isPublicNavigationPath(url.pathname) ? await cache.match(url.pathname) : null;
    const cachedOffline = await cache.match(OFFLINE_URL);

    return (
      cachedPage ||
      cachedOffline ||
      new Response("Mode hors ligne", {
        status: 503,
        headers: { "content-type": "text/plain; charset=utf-8" },
      })
    );
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }

    return response;
  } catch {
    if (cached) {
      return cached;
    }

    throw new Error("Network unavailable");
  }
}
