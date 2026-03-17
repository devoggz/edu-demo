import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getCBCGrade, getCBCRemark } from "@/lib/utils";

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

  const body = await req.json() as {
    studentId: string;
    subjectId: string;
    score: number;
    term: string;
    examType: string;
    classId?: string;
  };

  const { studentId, subjectId, score, term, examType } = body;

  if (!studentId || !subjectId || score === undefined || !term || !examType) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (score < 0 || score > 100) {
    return NextResponse.json({ error: "Score must be between 0 and 100" }, { status: 400 });
  }

  // Verify teacher teaches this subject
  const teachesSubject = teacher.subjects.some((ts) => ts.subjectId === subjectId);
  if (!teachesSubject) {
    return NextResponse.json({ error: "You do not teach this subject" }, { status: 403 });
  }

  // Verify student is in one of teacher's classes
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { classId: true },
  });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const teachesClass = teacher.classes.some((c) => c.id === student.classId);
  if (!teachesClass) {
    return NextResponse.json({ error: "Student is not in your class" }, { status: 403 });
  }

  const grade = getCBCGrade(score);
  const remarks = getCBCRemark(grade);

  // Upsert: update if same student/subject/term/examType exists
  const existing = await prisma.performanceMetric.findFirst({
    where: { studentId, subjectId, term, examType },
  });

  let metric;
  if (existing) {
    metric = await prisma.performanceMetric.update({
      where: { id: existing.id },
      data: { score, grade, remarks },
    });
  } else {
    metric = await prisma.performanceMetric.create({
      data: {
        studentId,
        subjectId,
        score,
        grade,
        maxScore: 100,
        term,
        examType,
        remarks,
      },
    });
  }

  return NextResponse.json({ ...metric, isNew: !existing }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const classId = searchParams.get("classId");
  const subjectId = searchParams.get("subjectId");

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const metrics = await prisma.performanceMetric.findMany({
    where: {
      ...(subjectId ? { subjectId } : {}),
      student: classId ? { classId } : { class: { classTeacherId: teacher.id } },
    },
    include: {
      student: { include: { class: true } },
      subject: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(metrics);
}
