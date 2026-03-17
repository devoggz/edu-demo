import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/shared/TopNav";
import { auth } from "@/auth";
import { School, Users, BookMarked } from "lucide-react";
import Link from "next/link";

export default async function AdminClassesPage() {
  const session = await auth();
  const classes = await prisma.class.findMany({
    orderBy: [{ grade: "asc" }, { section: "asc" }],
    include: {
      classTeacher: { include: { user: true } },
      students: true,
      subjects: { include: { subject: true } },
    },
  });

  return (
    <div>
      <TopNav title="Classes" subtitle={`${classes.length} classes this term`} userName={session?.user.name ?? ""} />
      <div className="page-body">
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-3">
          {classes.map((c) => (
            <Link key={c.id} href={`/dashboard/admin/classes/${c.id}`}>
            <div className="card card-body hover:shadow-md transition cursor-pointer hover:border-emerald-200">
                <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center">
                    <School className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{c.name}</h3>
                    <p className="text-xs text-slate-500">Room {c.room ?? "—"} · {c.academicYear}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600">{c.students.length}</p>
                  <p className="text-xs text-slate-400">/ {c.capacity} students</p>
                </div>
              </div>

              {/* Capacity bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Capacity</span>
                  <span>{Math.round((c.students.length / c.capacity) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min((c.students.length / c.capacity) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Class Teacher</p>
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {c.classTeacher?.user.name ?? "Not assigned"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs text-slate-400">Subjects</p>
                    <p className="text-sm font-medium text-slate-700">{c.subjects.length}</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1">
                {c.subjects.slice(0, 4).map((cs) => (
                  <span key={cs.subjectId} className="badge bg-slate-100 text-slate-600 text-xs">
                    {cs.subject.name}
                  </span>
                ))}
                {c.subjects.length > 4 && (
                  <span className="badge bg-slate-100 text-slate-500 text-xs">+{c.subjects.length - 4} more</span>
                )}
              </div>
            </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
