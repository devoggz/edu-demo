"use client";

import { useState, useEffect } from "react";
import { X, Download, Share, Plus, Bell } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Global badge API for PWA notification count
export function updatePWABadge(count: number) {
  if (typeof navigator !== "undefined" && "setAppBadge" in navigator) {
    if (count > 0) {
      (navigator as Navigator & { setAppBadge: (n: number) => Promise<void> })
        .setAppBadge(count).catch(() => {});
    } else {
      (navigator as Navigator & { clearAppBadge: () => Promise<void> })
        .clearAppBadge?.().catch(() => {});
    }
  }
}

export function PWAInstallBanner() {
  const [show, setShow] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem("pwa-banner-dismissed");
    if (dismissed && Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !("MSStream" in window);
    setIsIOS(ios);

    if (ios) {
      // Only show on mobile iOS in Safari
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      if (isSafari) setTimeout(() => setShow(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("pwa-banner-dismissed", String(Date.now()));
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setIsInstalled(true);
    setShow(false);
    setDeferredPrompt(null);
  };

  if (!show || isInstalled) return null;

  return (
    <div
      className="fixed bottom-20 lg:bottom-5 left-3 right-3 sm:left-auto sm:right-5 sm:w-80 z-50 animate-slide-up"
      role="dialog"
      aria-label="Install EduTrack"
    >
      <div className="rounded-2xl overflow-hidden border"
        style={{
          background: "hsl(var(--card))",
          borderColor: "hsl(var(--border))",
          boxShadow: "var(--shadow-lg)",
        }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5"
          style={{ background: "hsl(var(--primary))" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <Bell className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm leading-tight">Install EduTrack</p>
            <p className="text-blue-100 text-xs mt-0.5">Add to home screen</p>
          </div>
          <button onClick={dismiss} className="text-white/60 hover:text-white transition-colors p-1" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4">
          {isIOS ? (
            <div>
              <p className="text-xs mb-3" style={{ color: "hsl(var(--muted-foreground))" }}>
                Get quick access and receive notifications:
              </p>
              <ol className="space-y-2.5 mb-4">
                {[
                  { step: 1, text: "Tap the Share icon", icon: <Share className="w-3.5 h-3.5 text-blue-500 inline mx-1" /> },
                  { step: 2, text: <>Tap <Plus className="w-3.5 h-3.5 text-blue-500 inline mx-1" /> <strong>Add to Home Screen</strong></> },
                  { step: 3, text: "Tap Add to confirm" },
                ].map(item => (
                  <li key={item.step} className="flex items-center gap-2.5 text-xs" style={{ color: "hsl(var(--foreground))" }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: "hsl(var(--accent))", color: "hsl(var(--primary))" }}>
                      {item.step}
                    </span>
                    <span>{item.text}{item.step === 1 ? <>{item.icon}in Safari</> : ""}</span>
                  </li>
                ))}
              </ol>
              <button onClick={dismiss} className="btn-md btn-secondary w-full text-xs">Got it</button>
            </div>
          ) : (
            <div>
              <p className="text-xs mb-4" style={{ color: "hsl(var(--muted-foreground))" }}>
                Install for quick access, offline support and push notifications.
              </p>
              <div className="flex gap-2">
                <button onClick={dismiss} className="btn-sm btn-secondary flex-1">Not now</button>
                <button onClick={install} className="btn-sm btn-primary flex-1 gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Install
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
