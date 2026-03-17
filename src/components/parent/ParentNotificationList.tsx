"use client";

import { useState } from "react";
import { Bell, Globe, School, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserNotification {
  id: string;
  isRead: boolean;
  createdAt: Date;
  notification: {
    id: string;
    title: string;
    message: string;
    type: string;
    isGlobal: boolean;
    createdAt: Date;
    sender: { name: string };
    class: { name: string } | null;
  };
}

function formatDT(date: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(date));
}

const typeColor: Record<string, string> = {
  FEE: "bg-green-100 text-green-700",
  HOMEWORK: "bg-blue-100 text-blue-700",
  TRIP: "bg-purple-100 text-purple-700",
  ANNOUNCEMENT: "bg-orange-100 text-orange-700",
  GENERAL: "bg-slate-100 text-slate-700",
  EVENT: "bg-pink-100 text-pink-700",
};

export function ParentNotificationList({ notifications }: { notifications: UserNotification[] }) {
  const router = useRouter();
  const [readIds, setReadIds] = useState<Set<string>>(
    new Set(notifications.filter((n) => n.isRead).map((n) => n.id))
  );
  const [markingAll, setMarkingAll] = useState(false);

  const markRead = async (userNotifId: string, notifId: string) => {
    if (readIds.has(userNotifId)) return;
    setReadIds((prev) => new Set([...prev, userNotifId]));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: notifId }),
    });
    router.refresh();
  };

  const markAllRead = async () => {
    setMarkingAll(true);
    setReadIds(new Set(notifications.map((n) => n.id)));
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setMarkingAll(false);
    router.refresh();
  };

  const unread = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <div className="space-y-3">
      {unread > 0 && (
        <div className="flex justify-end">
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 transition"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </button>
        </div>
      )}

      {notifications.map((un) => {
        const n = un.notification;
        const isRead = readIds.has(un.id);
        return (
          <div
            key={un.id}
            onClick={() => markRead(un.id, n.id)}
            className={`bg-white rounded-2xl border p-5 shadow-sm transition hover:shadow-md cursor-pointer
              ${!isRead ? "border-blue-200" : "border-slate-100"}`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                ${!isRead ? "bg-blue-100" : "bg-slate-100"}`}>
                <Bell className={`w-5 h-5 ${!isRead ? "text-blue-600" : "text-slate-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-semibold ${!isRead ? "text-slate-900" : "text-slate-600"}`}>{n.title}</h3>
                    <span className={`badge ${typeColor[n.type] ?? typeColor.GENERAL}`}>{n.type}</span>
                    {n.isGlobal && (
                      <span className="badge bg-blue-50 text-blue-700 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> School-wide
                      </span>
                    )}
                    {n.class && (
                      <span className="badge bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <School className="w-3 h-3" /> {n.class.name}
                      </span>
                    )}
                  </div>
                  {!isRead && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1" />}
                </div>
                <p className={`text-sm leading-relaxed ${!isRead ? "text-slate-700" : "text-slate-500"}`}>{n.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-400">From {n.sender.name}</span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{formatDT(n.createdAt)}</span>
                  {isRead && <span className="text-xs text-slate-300 flex items-center gap-1"><CheckCheck className="w-3 h-3" /> Read</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {notifications.length === 0 && (
        <div className="flex flex-col items-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <Bell className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="font-semibold text-slate-600 mb-1">No notifications yet</h3>
          <p className="text-sm text-slate-400">Messages from teachers and admin will appear here.</p>
        </div>
      )}
    </div>
  );
}
