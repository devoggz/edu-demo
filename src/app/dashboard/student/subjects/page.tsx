import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { getGradeColor, getCBCGradeLabel } from "@/lib/utils";

export default async function StudentSubjectsPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      student: {
        include: {
          class: {
            include: {
              subjects: {
                include: {
                  subject: {
                    include: {
                      teachers: { include: { teacher: { include: { user: true } } } },
                      homework: { where: { dueDate: { gte: new Date() } }, orderBy: { dueDate: "asc" }, take: 1 },
                    },
                  },
                },
              },
            },
          },
          performance: { include: { subject: true }, orderBy: { createdAt: "desc" } },
        },
      },
    },
  });
  if (!profile) redirect("/auth/login");

  const student = profile.student;
  const subjects = student.class.subjects;

  // Latest performance per subject
  const latestPerf: Record<string, { score: number; grade: string }> = {};
  student.performance.forEach((p) => {
    if (!latestPerf[p.subjectId]) latestPerf[p.subjectId] = { score: p.score, grade: p.grade };
  });

  const subjectColors = ["from-blue-400 to-blue-600", "from-violet-400 to-violet-600", "from-emerald-400 to-emerald-600", "from-orange-400 to-orange-600", "from-rose-400 to-rose-600", "from-teal-400 to-teal-600", "from-amber-400 to-amber-600", "from-pink-400 to-pink-600", "from-indigo-400 to-indigo-600", "from-cyan-400 to-cyan-600"];

  return (
    <div>
      <TopNav title="My Subjects" subtitle={`${subjects.length} learning areas · ${student.class.name}`} userName={session.user.name} />
      <div className="page-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {subjects.map((cs, i) => {
            const perf = latestPerf[cs.subjectId];
            const teacher = cs.subject.teachers[0]?.teacher.user.name;
            const upcomingHW = cs.subject.homework[0];
            return (
              <div key={cs.subjectId} className="card card-body hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${subjectColors[i % subjectColors.length]} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-xs font-bold">{cs.subject.code}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{cs.subject.name}</p>
                    {teacher && <p className="text-xs text-slate-400 mt-0.5">{teacher}</p>}
                  </div>
                  {perf && (
                    <div className="text-right flex-shrink-0">
                      <span className={`badge font-bold text-xs ${getGradeColor(perf.grade)}`}>{perf.grade}</span>
                      <p className="text-xs text-slate-500 mt-0.5">{perf.score}%</p>
                    </div>
                  )}
                </div>

                {perf && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                      <span>{getCBCGradeLabel(perf.grade)}</span>
                      <span>{perf.score}/100</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${perf.score >= 80 ? "bg-emerald-500" : perf.score >= 65 ? "bg-blue-500" : perf.score >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${perf.score}%` }} />
                    </div>
                  </div>
                )}

                {upcomingHW && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold mb-1">Upcoming Assignment</p>
                    <p className="text-xs font-medium text-slate-700 truncate">{upcomingHW.title}</p>
                    <p className="text-[10px] text-amber-600 mt-0.5">
                      Due {new Date(upcomingHW.dueDate).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
