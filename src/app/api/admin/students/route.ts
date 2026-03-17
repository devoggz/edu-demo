import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const students = await prisma.student.findMany({
    orderBy: { name: "asc" },
    include: { class: true, parent: { include: { user: true } } },
  });

  return NextResponse.json(students);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { name?: string; gender?: string; dateOfBirth?: string; classId?: string; parentId?: string; bloodGroup?: string; address?: string };
  const { name, gender, dateOfBirth, classId, parentId, bloodGroup, address } = body;

  if (!name || !gender || !dateOfBirth || !classId || !parentId) {
    return NextResponse.json({ error: "Name, gender, date of birth, class and parent are required" }, { status: 400 });
  }

  // Generate student ID
  const count = await prisma.student.count();
  const studentId = `STU${String(count + 1).padStart(3, "0")}`;

  const student = await prisma.student.create({
    data: {
      studentId,
      name,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      classId,
      parentId,
      bloodGroup: bloodGroup || null,
      address: address || null,
    },
    include: { class: true, parent: { include: { user: true } } },
  });

  return NextResponse.json(student, { status: 201 });
}
