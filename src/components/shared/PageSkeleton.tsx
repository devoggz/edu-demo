/**
 * PageSkeleton — used as the content of every dashboard loading.tsx
 * Shows a top-nav shimmer + a grid of card skeletons.
 */
export function PageSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Top-nav shimmer */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-3.5 border-b"
        style={{
          background: "hsl(var(--topnav-bg))",
          borderColor: "hsl(var(--border))",
          minHeight: 52,
        }}
      >
        {/* hamburger spacer */}
        <div className="w-8 h-5 rounded lg:hidden" style={{ background: "hsl(var(--muted))" }} />
        <div className="flex-1 space-y-1.5">
          <div className="h-4 w-32 rounded" style={{ background: "hsl(var(--muted))" }} />
          <div className="h-3 w-48 rounded" style={{ background: "hsl(var(--muted))" }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg" style={{ background: "hsl(var(--muted))" }} />
          <div className="w-8 h-8 rounded-full" style={{ background: "hsl(var(--muted))" }} />
        </div>
      </div>

      {/* Page body */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* Stat cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl p-4 sm:p-5 h-20"
              style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--card-border))" }}
            />
          ))}
        </div>

        {/* Main card */}
        <div
          className="rounded-xl"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--card-border))",
            height: 200,
          }}
        />

        {/* Two-column row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl"
              style={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--card-border))",
                height: 140,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
