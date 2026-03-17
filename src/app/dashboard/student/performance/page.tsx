import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { getGradeColor, getCBCGradeLabel, getCBCGrade } from "@/lib/utils";

export default async function StudentPerformancePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      student: {
        include: {
          performance: { include: { subject: true }, orderBy: [{ term: "desc" }, { createdAt: "desc" }] },
        },
      },
    },
  });
  if (!profile) redirect("/auth/login");

  const student = profile.student;
  const avgScore = student.performance.length > 0
    ? Math.round(student.performance.reduce((s, p) => s + p.score, 0) / student.performance.length)
    : null;

  // Group by term
  const byTerm: Record<string, typeof student.performance> = {};
  student.performance.forEach((p) => {
    if (!byTerm[p.term]) byTerm[p.term] = [];
    byTerm[p.term].push(p);
  });

  // Grade distribution
  const dist = { EE: 0, ME: 0, AE: 0, BE: 0 };
  student.performance.forEach((p) => { if (p.grade in dist) dist[p.grade as keyof typeof dist]++; });

  const cbcBands = [
    { g: "EE", label: "Exceeds", range: "80–100", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-700" },
    { g: "ME", label: "Meets",   range: "65–79",  color: "bg-blue-500",    light: "bg-blue-50 text-blue-700" },
    { g: "AE", label: "Approaching", range: "50–64", color: "bg-amber-500", light: "bg-amber-50 text-amber-700" },
    { g: "BE", label: "Below",   range: "0–49",   color: "bg-red-500",     light: "bg-red-50 text-red-700" },
  ];

  return (
    <div>
      <TopNav title="Performance" subtitle="CBC assessment results" userName={session.user.name} />
      <div className="page-body">

        {/* Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {cbcBands.map((b) => (
            <div key={b.g} className={`card card-body ${b.light}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold ${b.color}`}>{b.g}</span>
                <span className="text-xs font-bold">{b.range}%</span>
              </div>
              <p className="text-2xl font-bold">{dist[b.g as keyof typeof dist]}</p>
              <p className="text-xs opacity-75 mt-0.5">{b.label}</p>
            </div>
          ))}
        </div>

        {avgScore !== null && (
          <div className="card card-body flex items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 border-4 ${avgScore >= 80 ? "border-emerald-400 bg-emerald-50" : avgScore >= 65 ? "border-blue-400 bg-blue-50" : avgScore >= 50 ? "border-amber-400 bg-amber-50" : "border-red-400 bg-red-50"}`}>
              <span className={`text-xl font-bold ${avgScore >= 80 ? "text-emerald-700" : avgScore >= 65 ? "text-blue-700" : avgScore >= 50 ? "text-amber-700" : "text-red-700"}`}>{avgScore}%</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Overall Average</p>
              <p className="text-xs text-slate-500 mt-0.5">{getCBCGradeLabel(getCBCGrade(avgScore))}</p>
              <p className="text-xs text-slate-400 mt-1">{student.performance.length} total assessments</p>
            </div>
          </div>
        )}

        {/* By term */}
        {Object.entries(byTerm).sort((a, b) => b[0].localeCompare(a[0])).map(([term, records]) => (
          <div key={term} className="card">
            <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
              <p className="text-sm font-semibold text-slate-700">{term}</p>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead><tr><th>Learning Area</th><th>Score</th><th>Grade</th><th>Level</th><th>Type</th><th>Remarks</th></tr></thead>
                <tbody>
                  {records.map((p) => (
                    <tr key={p.id}>
                      <td className="font-medium text-slate-800">{p.subject.name}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{p.score}</span>
                          <div className="w-14 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${p.score >= 80 ? "bg-emerald-500" : p.score >= 65 ? "bg-blue-500" : p.score >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${p.score}%` }} />
                          </div>
                        </div>
                      </td>
                      <td><span className={`badge font-bold ${getGradeColor(p.grade)}`}>{p.grade}</span></td>
                      <td className="text-slate-500 text-xs">{getCBCGradeLabel(p.grade)}</td>
                      <td className="text-slate-400 text-xs">{p.examType}</td>
                      <td className="text-slate-400 text-xs max-w-xs truncate">{p.remarks ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {student.performance.length === 0 && (
          <div className="card card-body text-center py-12">
            <p className="text-slate-400 text-sm">No performance records yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
