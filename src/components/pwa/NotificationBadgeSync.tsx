"use client";

import { useEffect } from "react";

// Syncs unread notification count to PWA app badge icon
export function NotificationBadgeSync({ unreadCount }: { unreadCount: number }) {
  useEffect(() => {
    // 1. Use Badge API directly if available
    if ("setAppBadge" in navigator) {
      if (unreadCount > 0) {
        (navigator as Navigator & { setAppBadge: (n: number) => Promise<void> })
          .setAppBadge(unreadCount).catch(() => {});
      } else {
        (navigator as Navigator & { clearAppBadge: () => Promise<void> })
          .clearAppBadge?.().catch(() => {});
      }
    }

    // 2. Also message the service worker
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "UPDATE_BADGE",
        count: unreadCount,
      });
    }
  }, [unreadCount]);

  return null;
}
