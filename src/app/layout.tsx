import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Script from "next/script";
import { ThemeProvider } from "@/components/shared/ThemeProvider";

export const metadata: Metadata = {
  title: "EduTrack — School Management System",
  description: "A comprehensive school management platform for admins, teachers, parents and students.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "EduTrack" },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "EduTrack — School Management System",
    description: "A comprehensive school management platform.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a6fcc" },
    { media: "(prefers-color-scheme: dark)",  color: "#1565bd" },
  ],
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,       // prevent zoom on input focus
  userScalable: false,   // prevent pinch-zoom flash on interaction
  viewportFit: "cover",
};

// Defaults to LIGHT — only goes dark if user explicitly chose it
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('edutrack-theme');
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.add(dark ? 'dark' : 'light');
  } catch(e) {
    document.documentElement.classList.add('light');
  }
})();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EduTrack" />
        <meta name="application-name" content="EduTrack" />
        <meta name="msapplication-TileColor" content="#1a6fcc" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Script src="/register-sw.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
