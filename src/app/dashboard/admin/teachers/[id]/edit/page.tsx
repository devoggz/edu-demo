import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { AdminEditTeacherForm } from "@/components/admin/AdminEditTeacherForm";

export default async function AdminEditTeacherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const [teacher, subjects] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        subjects: { include: { subject: true } },
      },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!teacher) notFound();

  const teacherData = {
    id: teacher.id,
    name: teacher.user.name,
    email: teacher.user.email,
    phone: teacher.user.phone ?? "",
    department: teacher.department ?? "",
    qualification: teacher.qualification ?? "",
    specialization: teacher.specialization ?? "",
    bio: teacher.bio ?? "",
    subjectIds: teacher.subjects.map(ts => ts.subjectId),
  };

  return (
    <div>
      <div className="page-header-back">
        <Link href={`/dashboard/admin/teachers/${id}`} className="btn-sm btn-ghost p-1.5">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-base font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
            Edit Teacher
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
            {teacher.user.name}
          </p>
        </div>
      </div>
      <div className="page-body">
        <AdminEditTeacherForm teacher={teacherData} subjects={subjects} />
      </div>
    </div>
  );
}
