// Minimal service worker — install + push notification handler.
//
// Cache strategy is intentionally tiny: stale-while-revalidate for static
// assets only. Issue/board data goes through React Query in-memory cache
// + the BE; we don't try to mirror it here because authenticated GETs
// can't be safely served stale across users.

const CACHE = "jira-static-v1";
const STATIC_PATHS = ["/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(STATIC_PATHS))
      .catch(() => null),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

// Push handler — payload is the same shape the BE Notification.create
// pipeline uses: { title, body, link }. We open the link on click.
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "New notification", body: event.data?.text?.() ?? "" };
  }
  const title = data.title || "New notification";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { link: data.link || "/" },
    tag: data.tag || data.title,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      // Reuse an existing tab if any is on the same origin.
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(link).catch(() => null);
          return client.focus();
        }
      }
      return self.clients.openWindow(link);
    }),
  );
});
