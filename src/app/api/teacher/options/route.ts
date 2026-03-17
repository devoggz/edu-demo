import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: { select: { id: true, name: true }, orderBy: { name: "asc" } },
      subjects: { include: { subject: { select: { id: true, name: true } } } },
    },
  });

  if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    classes: teacher.classes,
    subjects: teacher.subjects.map((ts) => ts.subject),
  });
}
