import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { homeworkId: string; studentId: string; content: string };
  const { homeworkId, studentId, content } = body;

  if (!homeworkId || !content?.trim()) {
    return NextResponse.json({ error: "homeworkId and content are required" }, { status: 400 });
  }

  // Verify this student belongs to the session user
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    select: { studentId: true },
  });
  if (!profile || profile.studentId !== studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Check existing submission
  const existing = await prisma.homeworkSubmission.findUnique({
    where: { homeworkId_studentId: { homeworkId, studentId } },
  });

  if (existing && existing.status === "GRADED") {
    return NextResponse.json({ error: "This homework has already been graded" }, { status: 400 });
  }

  const homework = await prisma.homework.findUnique({ where: { id: homeworkId } });
  if (!homework) return NextResponse.json({ error: "Homework not found" }, { status: 404 });

  const isLate = new Date(homework.dueDate) < new Date();

  const submission = await prisma.homeworkSubmission.upsert({
    where: { homeworkId_studentId: { homeworkId, studentId } },
    create: {
      homeworkId,
      studentId,
      content: content.trim(),
      status: isLate ? "SUBMITTED_LATE" : "SUBMITTED",
      submittedAt: new Date(),
    },
    update: {
      content: content.trim(),
      status: isLate ? "SUBMITTED_LATE" : "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  return NextResponse.json(submission, { status: 200 });
}
