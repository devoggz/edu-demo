import { formatDateTime } from "@/lib/utils";
import { Bell, Globe, School } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isGlobal: boolean;
  createdAt: Date;
  sender: { name: string };
  class: { name: string } | null;
}

export function RecentNotifications({ notifications }: { notifications: Notification[] }) {
  const typeColor: Record<string, string> = {
    FEE: "bg-green-100 text-green-700",
    HOMEWORK: "bg-blue-100 text-blue-700",
    TRIP: "bg-purple-100 text-purple-700",
    ANNOUNCEMENT: "bg-orange-100 text-orange-700",
    GENERAL: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="card card-body">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">Recent Notifications</h3>
        <Link href="/dashboard/admin/notifications" className="text-xs text-blue-600 hover:underline">View all</Link>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => (
          <div key={n.id} className="flex gap-3 p-3 rounded-xl hover:bg-slate-50 transition">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Bell className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-900 truncate">{n.title}</p>
                <span className={`badge flex-shrink-0 ${typeColor[n.type] ?? typeColor.GENERAL}`}>{n.type}</span>
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">{n.message}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">{n.sender.name}</span>
                {n.isGlobal ? (
                  <span className="flex items-center gap-0.5 text-xs text-slate-400"><Globe className="w-3 h-3" /> Global</span>
                ) : n.class ? (
                  <span className="flex items-center gap-0.5 text-xs text-slate-400"><School className="w-3 h-3" /> {n.class.name}</span>
                ) : null}
                <span className="text-xs text-slate-300 ml-auto">{formatDateTime(n.createdAt)}</span>
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-8">No notifications yet</p>
        )}
      </div>
    </div>
  );
}
