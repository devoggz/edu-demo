import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !["SUPER_ADMIN","ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: { user: true, subjects: { include: { subject: true } }, classes: true },
  });
  if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(teacher);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !["SUPER_ADMIN","ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    name?: string; phone?: string; department?: string;
    qualification?: string; specialization?: string; bio?: string; subjectIds?: string[];
  };

  const teacher = await prisma.teacher.findUnique({ where: { id }, include: { user: true } });
  if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.user.update({
    where: { id: teacher.userId },
    data: {
      ...(body.name  ? { name: body.name }   : {}),
      ...(body.phone !== undefined ? { phone: body.phone } : {}),
    },
  });

  const updated = await prisma.teacher.update({
    where: { id },
    data: {
      ...(body.department    !== undefined ? { department:    body.department }    : {}),
      ...(body.qualification !== undefined ? { qualification: body.qualification } : {}),
      ...(body.specialization!== undefined ? { specialization:body.specialization}: {}),
      ...(body.bio           !== undefined ? { bio:           body.bio }           : {}),
    },
  });

  // Update subject assignments if provided
  if (body.subjectIds) {
    await prisma.teacherSubject.deleteMany({ where: { teacherId: id } });
    if (body.subjectIds.length > 0) {
      await prisma.teacherSubject.createMany({
        data: body.subjectIds.map(subjectId => ({ teacherId: id, subjectId })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session || !["SUPER_ADMIN","ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Cascade: deleting the User will cascade to Teacher via onDelete: Cascade
  await prisma.user.delete({ where: { id: teacher.userId } });

  return NextResponse.json({ success: true });
}
