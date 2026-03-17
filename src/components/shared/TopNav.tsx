"use client";

import { Bell, Search } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBadgeSync } from "@/components/pwa/NotificationBadgeSync";

interface TopNavProps {
  title: string;
  subtitle?: string;
  userName: string;
  unreadCount?: number;
}

export function TopNav({ title, subtitle, userName, unreadCount = 0 }: TopNavProps) {
  return (
    <>
      <NotificationBadgeSync unreadCount={unreadCount} />
      <header className="topnav-root sticky top-0 z-30">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3 sm:py-3.5">
          {/* Mobile hamburger spacer */}
          <div className="w-8 lg:hidden flex-shrink-0" aria-hidden="true" />

          {/* Title */}
          <div className="flex-1 min-w-0">
            <h1
              className="text-[15px] sm:text-base font-bold truncate leading-tight tracking-tight"
              style={{ color: "hsl(var(--foreground))" }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-[11px] sm:text-xs truncate mt-0.5 leading-tight"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
            {/* Search — desktop only */}
            <div className="relative hidden md:block">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                style={{ color: "hsl(var(--muted-foreground))" }}
              />
              <input
                type="text"
                placeholder="Search…"
                className="input pl-8 pr-3 py-1.5 text-xs w-44 lg:w-52 h-8"
              />
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Bell with badge */}
            <button
              className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-colors btn-ghost"
              aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Avatar */}
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
              style={{ background: "hsl(var(--primary))" }}
            >
              {getInitials(userName)}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
