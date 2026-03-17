import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json() as { classId?: string; subjectId?: string; dayOfWeek?: number; startTime?: string; endTime?: string; room?: string };
  const entry = await prisma.timetableEntry.update({
    where: { id }, data: { ...body, room: body.room || null },
    include: { class: true, subject: true },
  });
  return NextResponse.json(entry);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.timetableEntry.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
