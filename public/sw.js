const CACHE_NAME = "edutrack-v3";
const STATIC = ["/", "/offline.html", "/manifest.json"];

// Install
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for navigation, cache first for static
self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(res => {
        if (res && res.status === 200 && res.type === "basic") {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return res;
      }).catch(() => caches.match("/offline.html"));
    })
  );
});

// Push notifications
self.addEventListener("push", (e) => {
  const data = e.data?.json() ?? {};
  const title   = data.title   ?? "EduTrack";
  const body    = data.body    ?? "You have a new notification";
  const badge   = data.badge   ?? "/icons/icon-96x96.png";
  const icon    = data.icon    ?? "/icons/icon-192x192.png";
  const count   = data.count   ?? 0;

  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag:    data.tag  ?? "edutrack",
      data:   data.url  ?? "/dashboard",
    })
  );

  // Update app badge count
  if ("setAppBadge" in self.registration) {
    self.registration.setAppBadge?.(count).catch(() => {});
  }
});

// Notification click — open app
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data ?? "/dashboard";
  e.waitUntil(
    clients.matchAll({ type: "window" }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// Message from page — update badge
self.addEventListener("message", (e) => {
  if (e.data?.type === "UPDATE_BADGE") {
    const count = e.data.count ?? 0;
    if ("setAppBadge" in self.registration) {
      if (count > 0) self.registration.setAppBadge?.(count).catch(() => {});
      else           self.registration.clearAppBadge?.().catch(() => {});
    }
  }
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});
