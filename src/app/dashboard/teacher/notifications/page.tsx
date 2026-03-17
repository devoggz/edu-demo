import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { formatDateTime } from "@/lib/utils";
import { Bell } from "lucide-react";
import { TeacherNotificationForm } from "@/components/teacher/TeacherNotificationForm";

export default async function TeacherNotificationsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { classes: { select: { id: true, name: true } } },
  });
  if (!teacher) redirect("/auth/login");

  const [sent, received] = await Promise.all([
    prisma.notification.findMany({
      where: { senderId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { class: true, recipients: true },
    }),
    prisma.userNotification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { notification: { include: { sender: true, class: true } } },
    }),
  ]);

  const typeColor: Record<string, string> = {
    FEE: "bg-green-100 text-green-700",
    HOMEWORK: "bg-blue-100 text-blue-700",
    TRIP: "bg-purple-100 text-purple-700",
    ANNOUNCEMENT: "bg-orange-100 text-orange-700",
    GENERAL: "bg-slate-100 text-slate-700",
  };

  return (
    <div>
      <TopNav title="Notifications" subtitle="Send and receive communications" userName={session.user.name} />
      <div className="page-body">

        {/* Send form */}
        <TeacherNotificationForm classes={teacher.classes} />

        {/* Sent */}
        <div>
          <h3 className="section-title mb-3">Sent ({sent.length})</h3>
          <div className="space-y-3">
            {sent.map((n) => (
              <div key={n.id} className="card card-body flex gap-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="section-title">{n.title}</p>
                    <span className={`badge ${typeColor[n.type] ?? typeColor.GENERAL}`}>{n.type}</span>
                    {n.class && <span className="badge bg-emerald-50 text-emerald-700">{n.class.name}</span>}
                  </div>
                  <p className="text-sm text-slate-600">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(n.createdAt)} · {n.recipients.length} recipients</p>
                </div>
              </div>
            ))}
            {sent.length === 0 && <p className="text-sm text-slate-400">No notifications sent yet.</p>}
          </div>
        </div>

        {/* Received */}
        <div>
          <h3 className="section-title mb-3">Received ({received.length})</h3>
          <div className="space-y-3">
            {received.map((un) => (
              <div key={un.id} className={`bg-white rounded-2xl border p-4 shadow-sm flex gap-3 ${!un.isRead ? "border-blue-200 bg-blue-50/30" : "border-slate-100"}`}>
                <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="section-title">{un.notification.title}</p>
                    {!un.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                  <p className="text-sm text-slate-600">{un.notification.message}</p>
                  <p className="text-xs text-slate-400 mt-1">From {un.notification.sender.name} · {formatDateTime(un.notification.createdAt)}</p>
                </div>
              </div>
            ))}
            {received.length === 0 && <p className="text-sm text-slate-400">No notifications received.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
