import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { Bell, Globe, School } from "lucide-react";
import { TopNav } from "@/components/shared/TopNav";
import { ParentNotificationList } from "@/components/parent/ParentNotificationList";

export default async function ParentNotificationsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const notifications = await prisma.userNotification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      notification: { include: { sender: true, class: true } },
    },
  });

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div>
      <TopNav
        title="Notifications"
        subtitle={`${unread} unread message${unread !== 1 ? "s" : ""}`}
        userName={session.user.name}
        unreadCount={unread}
      />
      <div className="page-body">
        <ParentNotificationList notifications={notifications} />
      </div>
    </div>
  );
}
