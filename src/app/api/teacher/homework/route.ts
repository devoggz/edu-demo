import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { classes: true, subjects: true },
  });

  if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

  const body = await req.json() as { title?: string; description?: string; dueDate?: string; classId?: string; subjectId?: string; instructions?: string; maxScore?: number; attachmentUrl?: string; isWeekly?: boolean  | string | null };
  const { title, description, dueDate, isWeekly, classId, subjectId, attachmentUrl } = body;

  if (!title || !description || !dueDate) {
    return NextResponse.json({ error: "Title, description and due date are required" }, { status: 400 });
  }

  // Validate teacher owns the class
  const validClass = teacher.classes.find((c) => c.id === classId);
  if (!validClass) {
    return NextResponse.json({ error: "Class not found or not assigned to you" }, { status: 400 });
  }

  // Validate teacher teaches the subject
  const validSubject = teacher.subjects.find((s) => s.subjectId === subjectId);
  if (!validSubject) {
    return NextResponse.json({ error: "Subject not found or not assigned to you" }, { status: 400 });
  }

  const homework = await prisma.homework.create({
    data: {
      title,
      description,
      dueDate: new Date(dueDate),
      isWeekly: isWeekly === "true" || isWeekly === true,
      classId: validClass.id,
      subjectId: validSubject.subjectId,
      teacherId: teacher.id,
      attachmentUrl: attachmentUrl || null,
    },
    include: { subject: true, class: true },
  });

  // Auto-create pending submissions for every student in the class
  const students = await prisma.student.findMany({
    where: { classId: validClass.id, isActive: true },
    select: { id: true },
  });

  if (students.length > 0) {
    await prisma.homeworkSubmission.createMany({
      data: students.map((s) => ({
        homeworkId: homework.id,
        studentId: s.id,
        status: "PENDING",
      })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json(homework, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      homework: {
        orderBy: { dueDate: "desc" },
        include: { subject: true, class: true, submissions: true },
      },
    },
  });

  return NextResponse.json(teacher?.homework ?? []);
}

