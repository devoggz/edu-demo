import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [teachers, students, classes, subjects] = await Promise.all([
    prisma.teacher.count(),
    prisma.student.count({ where: { isActive: true } }),
    prisma.class.count(),
    prisma.subject.count(),
  ]);

  return NextResponse.json({ teachers, students, classes, subjects });
}
