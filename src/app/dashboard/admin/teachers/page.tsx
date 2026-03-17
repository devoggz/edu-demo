import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { getInitials } from "@/lib/utils";
import Link from "next/link";
import { Plus, Mail, Phone, BookMarked, School } from "lucide-react";
import { AdminTeacherActions } from "@/components/admin/AdminTeacherActions";

export default async function AdminTeachersPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teachers = await prisma.teacher.findMany({
    include: {
      user: true,
      subjects: { include: { subject: true } },
      classes: { include: { students: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <div>
      <TopNav title="Teachers" subtitle={`${teachers.length} staff members`} userName={session.user.name} />
      <div className="page-body">
        <div className="flex items-center justify-between">
          <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
            Manage teaching staff, assignments and profiles
          </p>
          <Link href="/dashboard/admin/teachers/new" className="btn-md btn-primary">
            <Plus className="w-4 h-4" /> Add Teacher
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="card">
              <div className="card-body">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                    {getInitials(teacher.user.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/dashboard/admin/teachers/${teacher.id}`}>
                      <p className="text-sm font-bold truncate hover:text-blue-600 transition-colors" style={{ color: "hsl(var(--foreground))" }}>
                        {teacher.user.name}
                      </p>
                    </Link>
                    <p className="text-xs truncate mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {teacher.department ?? "General"} · {teacher.employeeId}
                    </p>
                    {teacher.qualification && (
                      <p className="text-xs truncate mt-0.5 italic" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {teacher.qualification}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{teacher.user.email}</span>
                  </div>
                  {teacher.user.phone && (
                    <div className="flex items-center gap-2 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      {teacher.user.phone}
                    </div>
                  )}
                </div>

                {teacher.bio && (
                  <p className="text-xs mb-3 line-clamp-2 italic" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {teacher.bio}
                  </p>
                )}

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {teacher.subjects.slice(0, 3).map(ts => (
                    <span key={ts.subjectId} className="badge badge-blue text-[10px]">{ts.subject.name}</span>
                  ))}
                  {teacher.subjects.length > 3 && (
                    <span className="badge badge-slate text-[10px]">+{teacher.subjects.length - 3}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <School className="w-3.5 h-3.5" />
                    {teacher.classes.length} class{teacher.classes.length !== 1 ? "es" : ""}
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
                    <BookMarked className="w-3.5 h-3.5" />
                    {teacher.subjects.length} subject{teacher.subjects.length !== 1 ? "s" : ""}
                  </div>
                  <div className="ml-auto">
                    <AdminTeacherActions teacherId={teacher.id} teacherName={teacher.user.name} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {teachers.length === 0 && (
          <div className="card card-body flex flex-col items-center py-16 text-center">
            <BookMarked className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No teachers yet.</p>
            <Link href="/dashboard/admin/teachers/new" className="btn-md btn-primary mt-4">
              <Plus className="w-4 h-4" /> Add First Teacher
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
