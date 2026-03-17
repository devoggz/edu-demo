import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { title?: string; message?: string; type?: string; classId?: string | null; isGlobal?: boolean  | string | null };
  const { title, message, type, classId, isGlobal } = body;

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  // Determine recipients
  let parentUserIds: string[] = [];

  if (isGlobal === true || isGlobal === "true") {
    // All parents
    const parents = await prisma.parent.findMany({ include: { user: true } });
    parentUserIds = parents.map((p) => p.user.id);
  } else if (classId) {
    // Parents of students in this class
    const students = await prisma.student.findMany({
      where: { classId },
      include: { parent: { include: { user: true } } },
      distinct: ["parentId"],
    });
    parentUserIds = [...new Set(students.map((s) => s.parent.user.id))];
  }

  const notification = await prisma.$transaction(async (tx) => {
    const notif = await tx.notification.create({
      data: {
        title,
        message,
        type: (type as NotificationType) ?? "GENERAL",
        senderId: session.user.id,
        classId: classId || null,
        isGlobal: isGlobal === true || isGlobal === "true",
      },
    });

    if (parentUserIds.length > 0) {
      await tx.userNotification.createMany({
        data: parentUserIds.map((userId) => ({
          userId,
          notificationId: notif.id,
        })),
        skipDuplicates: true,
      });
    }

    return notif;
  });

  return NextResponse.json({
    ...notification,
    recipientCount: parentUserIds.length,
  }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    include: { sender: true, class: true, recipients: true },
  });

  return NextResponse.json(notifications);
}
