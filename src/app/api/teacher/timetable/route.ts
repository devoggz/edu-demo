import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    teacherId: string;
    classId: string;
    subjectId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    room?: string;
  };

  const { teacherId, classId, subjectId, dayOfWeek, startTime, endTime, room } = body;

  if (!classId || !subjectId || !startTime || !endTime) {
    return NextResponse.json({ error: "Class, subject, start time and end time are required" }, { status: 400 });
  }

  if (startTime >= endTime) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher || teacher.id !== teacherId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const entry = await prisma.timetableEntry.create({
    data: {
      teacherId,
      classId,
      subjectId,
      dayOfWeek,
      startTime,
      endTime,
      room: room || null,
    },
    include: { class: true, subject: true },
  });

  return NextResponse.json(entry, { status: 201 });
}
