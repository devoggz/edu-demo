"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const options: { value: "light" | "dark" | "system"; label: string; icon: typeof Sun }[] = [
    { value: "light",  label: "Light",  icon: Sun },
    { value: "dark",   label: "Dark",   icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <CurrentIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-36 rounded-xl border shadow-lg overflow-hidden animate-fade-in"
          style={{
            background: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
          }}
        >
          {options.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setTheme(value); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm transition-colors text-left",
                theme === value
                  ? "text-blue-600 dark:text-blue-400 font-semibold"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              )}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
              {theme === value && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
