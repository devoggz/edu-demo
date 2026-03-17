import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { School, Users, BookMarked } from "lucide-react";
import Link from "next/link";

export default async function TeacherClassesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: {
      classes: {
        include: {
          students: true,
          subjects: { include: { subject: true } },
          homework: { where: { dueDate: { gte: new Date() } } },
        },
      },
    },
  });

  if (!teacher) redirect("/auth/login");

  return (
    <div>
      <TopNav title="My Classes" subtitle="Classes you currently teach" userName={session.user.name} />
      <div className="page-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {teacher.classes.map((cls) => (
            <Link key={cls.id} href={`/dashboard/teacher/classes/${cls.id}`}>
              <div className="card card-body hover:shadow-md hover:border-blue-200 transition cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <School className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{cls.name}</h3>
                      <p className="text-sm text-slate-500">Room {cls.room ?? "TBD"} · {cls.academicYear}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">{cls.students.length}</p>
                    <p className="text-xs text-slate-400">students</p>
                  </div>
                </div>

                {/* Capacity bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Enrollment</span>
                    <span>{cls.students.length} / {cls.capacity}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min((cls.students.length / cls.capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 py-4 border-y border-slate-100 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Students</p>
                      <p className="font-semibold text-slate-800">{cls.students.length}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                      <BookMarked className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Pending HW</p>
                      <p className="font-semibold text-slate-800">{cls.homework.length}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2">SUBJECTS</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cls.subjects.map((cs) => (
                      <span key={cs.subjectId} className="badge bg-blue-50 text-blue-700">
                        {cs.subject.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {teacher.classes.length === 0 && (
            <div className="col-span-2 flex flex-col items-center py-16 bg-white rounded-2xl border border-slate-100">
              <School className="w-10 h-10 text-slate-300 mb-3" />
              <p className="text-slate-500">No classes assigned to you yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
