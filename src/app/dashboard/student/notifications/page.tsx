import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { StudentNotificationList } from "@/components/student/StudentNotificationList";

export default async function StudentNotificationsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const userNotifs = await prisma.userNotification.findMany({
    where: { userId: session.user.id },
    include: { notification: { include: { sender: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const notifications = userNotifs.map(un => ({
    id: un.notificationId,
    title: un.notification.title,
    message: un.notification.message,
    type: un.notification.type,
    createdAt: un.notification.createdAt.toISOString(),
    isRead: un.isRead,
    senderName: un.notification.sender.name,
    linkType: un.notification.linkType ?? null,
    linkId: un.notification.linkId ?? null,
  }));

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <div>
      <TopNav title="Notifications" subtitle={unread > 0 ? `${unread} unread` : "All caught up"} userName={session.user.name} unreadCount={unread} />
      <StudentNotificationList notifications={notifications} role="student" />
    </div>
  );
}
