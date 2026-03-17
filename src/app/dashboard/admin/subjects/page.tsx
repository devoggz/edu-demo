import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/shared/TopNav";
import { auth } from "@/auth";
import { BookMarked } from "lucide-react";
import Link from "next/link";

export default async function AdminSubjectsPage() {
  const session = await auth();
  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    include: {
      teachers: { include: { teacher: { include: { user: true } } } },
      classes: { include: { class: true } },
    },
  });

  const subjectColors = [
    "from-blue-400 to-blue-600",
    "from-violet-400 to-violet-600",
    "from-emerald-400 to-emerald-600",
    "from-orange-400 to-orange-600",
    "from-rose-400 to-rose-600",
    "from-teal-400 to-teal-600",
    "from-yellow-400 to-yellow-600",
    "from-pink-400 to-pink-600",
  ];

  return (
    <div>
      <TopNav title="Subjects" subtitle={`${subjects.length} subjects offered`} userName={session?.user.name ?? ""} />
      <div className="page-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 sm:grid-cols-3 gap-4">
          {subjects.map((s, i) => (
            <Link key={s.id} href={`/dashboard/admin/subjects/${s.id}`}>
            <div className="card card-body hover:shadow-md transition cursor-pointer hover:border-blue-200">
                <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${subjectColors[i % subjectColors.length]} flex items-center justify-center`}>
                  <BookMarked className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{s.name}</h3>
                  <code className="text-xs text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">{s.code}</code>
                </div>
              </div>

              {s.description && (
                <p className="text-xs text-slate-500 mb-4">{s.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-sm">
                <div>
                  <p className="text-xs text-slate-400">Teachers</p>
                  <p className="font-semibold text-slate-800">{s.teachers.length}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Classes</p>
                  <p className="font-semibold text-slate-800">{s.classes.length}</p>
                </div>
              </div>

              {s.teachers.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-slate-400 mb-1.5">Taught by</p>
                  <div className="flex flex-wrap gap-1">
                    {s.teachers.map((ts) => (
                      <span key={ts.teacherId} className="badge bg-slate-100 text-slate-600 text-xs">
                        {ts.teacher.user.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
