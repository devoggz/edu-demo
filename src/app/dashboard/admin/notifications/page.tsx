import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/shared/TopNav";
import { auth } from "@/auth";
import { formatDateTime } from "@/lib/utils";
import { Bell, Globe, School } from "lucide-react";
import { AdminNotificationForm } from "@/components/admin/AdminNotificationForm";

export default async function AdminNotificationsPage() {
  const session = await auth();

  const [notifications, classes] = await Promise.all([
    prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      include: { sender: true, class: true, recipients: true },
    }),
    prisma.class.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const typeColor: Record<string, string> = {
    FEE: "bg-green-100 text-green-700",
    HOMEWORK: "bg-blue-100 text-blue-700",
    TRIP: "bg-purple-100 text-purple-700",
    ANNOUNCEMENT: "bg-orange-100 text-orange-700",
    GENERAL: "bg-slate-100 text-slate-700",
    EVENT: "bg-pink-100 text-pink-700",
    PERFORMANCE: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div>
      <TopNav title="Notifications" subtitle="Manage school-wide communications" userName={session?.user.name ?? ""} />
      <div className="page-body">

        {/* Create form */}
        <AdminNotificationForm classes={classes} />

        {/* Sent list */}
        <div className="space-y-3">
          <h3 className="section-title">Sent Notifications ({notifications.length})</h3>
          {notifications.map((n) => (
            <div key={n.id} className="card card-body hover:shadow-md transition">
                <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="section-title">{n.title}</h3>
                    <span className={`badge ${typeColor[n.type] ?? typeColor.GENERAL}`}>{n.type}</span>
                    {n.isGlobal ? (
                      <span className="badge bg-blue-50 text-blue-700 flex items-center gap-1"><Globe className="w-3 h-3" /> Global</span>
                    ) : n.class ? (
                      <span className="badge bg-emerald-50 text-emerald-700 flex items-center gap-1"><School className="w-3 h-3" /> {n.class.name}</span>
                    ) : null}
                  </div>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-slate-400">By {n.sender.name}</span>
                    <span className="text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
                    <span className="text-xs font-medium text-slate-500">{n.recipients.length} recipients</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="flex flex-col items-center py-12 bg-white rounded-2xl border border-slate-100">
              <Bell className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500">No notifications sent yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
