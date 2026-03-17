import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { getGradeColor, getCBCGradeLabel, getCBCGrade, getInitials } from "@/lib/utils";
import { ParentPerformanceCharts } from "@/components/parent/ParentPerformanceCharts";

export default async function ParentPerformancePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      students: {
        include: {
          performance: {
            include: { subject: true },
            orderBy: { createdAt: "desc" },
          },
          class: true,
        },
      },
    },
  });
  if (!parent) redirect("/auth/login");

  // CBC grade scale legend
  const cbcScale = [
    { grade: "EE", range: "80–100", label: "Exceeds Expectations", color: "bg-green-500", light: "bg-green-50 text-green-700" },
    { grade: "ME", range: "65–79",  label: "Meets Expectations",   color: "bg-blue-500",  light: "bg-blue-50 text-blue-700" },
    { grade: "AE", range: "50–64",  label: "Approaching Expectations", color: "bg-yellow-500", light: "bg-yellow-50 text-yellow-700" },
    { grade: "BE", range: "0–49",   label: "Below Expectations",   color: "bg-red-500",   light: "bg-red-50 text-red-700" },
  ];

  return (
    <div>
      <TopNav title="Academic Performance" subtitle="CBC assessment results" userName={session.user.name} />
      <div className="page-body">

        {/* CBC legend */}
        <div className="card card-body">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Kenya CBC Grading Scale</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {cbcScale.map((g) => (
              <div key={g.grade} className={`rounded-xl p-3 ${g.light}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold ${g.color}`}>
                    {g.grade}
                  </span>
                  <span className="text-xs font-bold">{g.range}%</span>
                </div>
                <p className="text-xs font-semibold leading-tight">{g.label}</p>
              </div>
            ))}
          </div>
        </div>

        {parent.students.map((student) => {
          const avgScore =
            student.performance.length > 0
              ? Math.round(student.performance.reduce((s, p) => s + p.score, 0) / student.performance.length)
              : null;

          const avgGrade = avgScore !== null ? getCBCGrade(avgScore) : null;

          // Latest score per subject for chart
          const subjectMap: Record<string, { subject: string; score: number; grade: string }> = {};
          student.performance.forEach((p) => {
            if (!subjectMap[p.subject.name]) {
              subjectMap[p.subject.name] = { subject: p.subject.name, score: p.score, grade: p.grade };
            }
          });
          const chartData = Object.values(subjectMap);

          // Group by term for tabular view
          const byTerm: Record<string, typeof student.performance> = {};
          student.performance.forEach((p) => {
            if (!byTerm[p.term]) byTerm[p.term] = [];
            byTerm[p.term].push(p);
          });

          return (
            <div key={student.id}>
              {/* Student header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">
                  {getInitials(student.name)}
                </div>
                <div>
                  <h2 className="font-bold text-slate-900">{student.name}</h2>
                  <p className="text-xs text-slate-500">{student.class.name}</p>
                </div>
                {avgScore !== null && avgGrade && (
                  <div className="ml-auto flex items-center gap-3">
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${avgScore >= 80 ? "text-green-600" : avgScore >= 65 ? "text-blue-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                        {avgScore}%
                      </p>
                      <p className="text-xs text-slate-400">overall avg</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${getGradeColor(avgGrade)}`}>
                      {avgGrade}
                    </span>
                  </div>
                )}
              </div>

              {/* Chart */}
              <ParentPerformanceCharts chartData={chartData} />

              {/* Detailed table per term */}
              {Object.entries(byTerm).sort().map(([term, records]) => (
                <div key={term} className="card overflow-hidden mt-4">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                    <h4 className="font-semibold text-slate-700">{term}</h4>
                  </div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Learning Area</th>
                        <th>Score</th>
                        <th>CBC Grade</th>
                        <th>Performance Level</th>
                        <th>Assessment Type</th>
                        <th>Teacher Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="font-medium text-slate-800">{p.subject.name}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{p.score}<span className="text-slate-400 font-normal text-xs">/{p.maxScore}</span></span>
                              <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    p.score >= 80 ? "bg-green-500" :
                                    p.score >= 65 ? "bg-blue-500" :
                                    p.score >= 50 ? "bg-yellow-500" : "bg-red-500"
                                  }`}
                                  style={{ width: `${p.score}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge font-bold text-sm ${getGradeColor(p.grade)}`}>
                              {p.grade}
                            </span>
                          </td>
                          <td className="text-slate-600 text-xs">{getCBCGradeLabel(p.grade)}</td>
                          <td className="text-slate-500">{p.examType}</td>
                          <td className="text-slate-500 text-xs max-w-xs">{p.remarks ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}

              {student.performance.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center mt-4">
                  <p className="text-slate-400">No assessments recorded yet</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
