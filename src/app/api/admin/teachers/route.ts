import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN","ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teachers = await prisma.teacher.findMany({
    include: { user: true, subjects: { include: { subject: true } }, classes: true },
    orderBy: { user: { name: "asc" } },
  });
  return NextResponse.json(teachers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN","ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    name: string; email: string; phone?: string; password?: string;
    department?: string; qualification?: string; specialization?: string;
    bio?: string; subjectIds?: string[];
  };

  const { name, email, phone, department, qualification, specialization, bio, subjectIds } = body;
  if (!name || !email) return NextResponse.json({ error: "Name and email required" }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "Email already in use" }, { status: 400 });

  // Generate employee ID
  const count = await prisma.teacher.count();
  const employeeId = `EMP${String(count + 1).padStart(3, "0")}`;

  const hashedPassword = await bcrypt.hash(body.password ?? "password123", 10);

  const user = await prisma.user.create({
    data: {
      name, email, phone, password: hashedPassword, role: Role.TEACHER,
      teacher: {
        create: {
          employeeId, department, qualification, specialization, bio,
          subjects: subjectIds?.length
            ? { create: subjectIds.map(id => ({ subjectId: id })) }
            : undefined,
        },
      },
    },
    include: { teacher: true },
  });

  return NextResponse.json(user, { status: 201 });
}
