import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { getInitials, formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function ParentChildrenPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          class: { include: { classTeacher: { include: { user: true } } } },
          activities: true,
          performance: { include: { subject: true } },
        },
      },
    },
  });
  if (!parent) redirect("/auth/login");

  return (
    <div>
      <TopNav title="My Children" subtitle="Student profiles and details" userName={session.user.name} />
      <div className="page-body">
        {parent.students.map((student) => {
          const avgScore =
            student.performance.length > 0
              ? Math.round(student.performance.reduce((s, p) => s + p.score, 0) / student.performance.length)
              : null;

          return (
            <div key={student.id} className="card card-body">
              <div className="flex items-start gap-5">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {getInitials(student.name)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                      <p className="text-sm text-slate-500">{student.studentId} · {student.class.name}</p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Class Teacher: <span className="font-medium">{student.class.classTeacher?.user.name ?? "Not assigned"}</span>
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/parent/children/${student.id}`}
                      className="text-sm font-medium text-blue-600 border border-blue-200 px-4 py-2 rounded-xl hover:bg-blue-50 transition"
                    >
                      Full Profile
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Date of Birth</p>
                      <p className="text-sm font-semibold text-slate-800">{formatDate(student.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Gender</p>
                      <p className="text-sm font-semibold text-slate-800">{student.gender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Blood Group</p>
                      <p className="text-sm font-semibold text-slate-800">{student.bloodGroup ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Avg Score</p>
                      <p className={`text-sm font-bold ${avgScore && avgScore >= 75 ? "text-green-600" : avgScore && avgScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {avgScore !== null ? `${avgScore}%` : "No data"}
                      </p>
                    </div>
                  </div>

                  {student.activities.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-slate-400 mb-2">CO-CURRICULAR ACTIVITIES</p>
                      <div className="flex flex-wrap gap-2">
                        {student.activities.map((act) => (
                          <span key={act.id} className="badge bg-violet-50 text-violet-700">
                            {act.name} {act.achievement && `· ${act.achievement}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
