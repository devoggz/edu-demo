"use client";

import { useState } from "react";
import { Bell, CheckCheck, BookOpen, DollarSign, Calendar, Megaphone, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface Notification {
  id: string; title: string; message: string;
  type: string; createdAt: string; isRead: boolean;
  senderName: string; linkType?: string | null; linkId?: string | null;
}

function getLinkHref(linkType?: string | null, linkId?: string | null, role = "student"): string | null {
  if (!linkType || !linkId) return null;
  switch (linkType) {
    case "HOMEWORK": return `/dashboard/${role}/homework/${linkId}`;
    case "EVENT":    return `/dashboard/${role}/events`;
    case "FEE":      return `/dashboard/${role}/fees`;
    default:         return null;
  }
}

function typeIcon(type: string) {
  const cls = "w-4 h-4";
  switch (type) {
    case "HOMEWORK":      return <BookOpen className={`${cls} text-blue-500`} />;
    case "FEE":
    case "PAYMENT_PROMPT":return <DollarSign className={`${cls} text-emerald-500`} />;
    case "EVENT":
    case "TRIP":          return <Calendar className={`${cls} text-violet-500`} />;
    case "ANNOUNCEMENT":  return <Megaphone className={`${cls} text-amber-500`} />;
    default:              return <Bell className={`${cls} text-slate-400`} />;
  }
}

function typeBg(type: string) {
  switch (type) {
    case "HOMEWORK":       return "bg-blue-50 dark:bg-blue-900/30";
    case "FEE":
    case "PAYMENT_PROMPT": return "bg-emerald-50 dark:bg-emerald-900/30";
    case "EVENT":
    case "TRIP":           return "bg-violet-50 dark:bg-violet-900/30";
    case "ANNOUNCEMENT":   return "bg-amber-50 dark:bg-amber-900/30";
    default:               return "bg-slate-50 dark:bg-slate-800/40";
  }
}

export function StudentNotificationList({ notifications: initial, role = "student" }: {
  notifications: Notification[];
  role?: string;
}) {
  const [notifications, setNotifications] = useState(initial);

  const markRead = async (id: string) => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAll = async () => {
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div className="page-body">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="section-title">Notifications</p>
          {unread > 0 && <span className="badge bg-blue-600 text-white text-[10px]">{unread} new</span>}
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="btn-sm btn-ghost gap-1 text-blue-600">
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      <div className="card divide-y" style={{ borderColor: "hsl(var(--border))" }}>
        {notifications.map(n => {
          const href = getLinkHref(n.linkType, n.linkId, role);
          const Row = href ? Link : "div" as unknown as typeof Link;
          const rowProps = href ? { href } : {};

          return (
            <Row
              key={n.id}
              {...rowProps as { href: string }}
              onClick={() => !n.isRead && markRead(n.id)}
              className={`flex items-start gap-3 px-4 sm:px-5 py-4 transition-colors cursor-pointer group ${
                n.isRead
                  ? "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  : "bg-blue-50/30 dark:bg-blue-900/20 hover:bg-blue-50/60 dark:hover:bg-blue-900/30"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${typeBg(n.type)}`}>
                {typeIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold truncate ${n.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-slate-100"}`}>
                    {n.title}
                  </p>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!n.isRead && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1" />}
                    {href && <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />}
                  </div>
                </div>
                <p className="text-xs mt-0.5 leading-relaxed line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {n.message}
                </p>
                <p className="text-[10px] mt-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                  {n.senderName} · {formatDate(n.createdAt)}
                </p>
              </div>
            </Row>
          );
        })}
        {notifications.length === 0 && (
          <div className="flex flex-col items-center py-14" style={{ color: "hsl(var(--muted-foreground))" }}>
            <Bell className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-sm">No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
