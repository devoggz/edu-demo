import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as { notificationId?: string; all?: boolean };

  if (body.all) {
    // Mark all as read for this user
    await prisma.userNotification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return NextResponse.json({ success: true });
  }

  if (!body.notificationId) {
    return NextResponse.json({ error: "notificationId required" }, { status: 400 });
  }

  await prisma.userNotification.updateMany({
    where: { userId: session.user.id, notificationId: body.notificationId },
    data: { isRead: true, readAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
