import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { classes: true },
  });
  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  const body = await req.json() as { title?: string; message?: string; classId?: string; type?: string };
  const { title, message, type, classId } = body;

  if (!title || !message) {
    return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
  }

  // Validate teacher owns the class
  const validClass = classId
    ? teacher.classes.find((c) => c.id === classId)
    : null;

  // Get all parents of students in this class
  const students = await prisma.student.findMany({
    where: classId ? { classId } : { classId: { in: teacher.classes.map((c) => c.id) } },
    include: { parent: { include: { user: true } } },
    distinct: ["parentId"],
  });

  const parentUserIds = [...new Set(students.map((s) => s.parent.user.id))];

  if (parentUserIds.length === 0) {
    return NextResponse.json({ error: "No parents found for this class" }, { status: 400 });
  }

  // Create notification + user notification records in a transaction
  const notification = await prisma.$transaction(async (tx) => {
    const notif = await tx.notification.create({
      data: {
        title,
        message,
        type: (type as NotificationType) ?? "GENERAL",
        senderId: session.user.id,
        classId: validClass?.id ?? null,
        isGlobal: false,
      },
    });

    await tx.userNotification.createMany({
      data: parentUserIds.map((userId) => ({
        userId,
        notificationId: notif.id,
      })),
      skipDuplicates: true,
    });

    return notif;
  });

  return NextResponse.json({
    ...notification,
    recipientCount: parentUserIds.length,
  }, { status: 201 });
}
