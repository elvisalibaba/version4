const APP_SHELL_VERSION = "hb-app-shell-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== APP_SHELL_VERSION).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", () => {
  // The install prompt only needs a live service worker. We keep it minimal on purpose
  // to avoid caching authenticated book pages or secure reader routes.
});
