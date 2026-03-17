// EduTrack PWA — Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        console.log("[EduTrack PWA] Service Worker registered. Scope:", registration.scope);

        // Check for updates every 60 minutes
        setInterval(() => registration.update(), 60 * 60 * 1000);

        // Notify user when a new version is available
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // A new version is ready — show a toast or prompt
              console.log("[EduTrack PWA] New version available. Refresh to update.");

              // Dispatch a custom event the app can listen to
              window.dispatchEvent(new CustomEvent("pwa-update-available"));
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[EduTrack PWA] Service Worker registration failed:", err);
      });

    // When a new SW takes control, reload the page automatically
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}
