import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookMarked, Users, School, TrendingUp } from "lucide-react";
import { getInitials, getGradeColor } from "@/lib/utils";

export default async function AdminSubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subject = await prisma.subject.findUnique({
    where: { id },
    include: {
      teachers: { include: { teacher: { include: { user: true } } } },
      classes: { include: { class: { include: { students: true } } } },
      performance: {
        include: { student: { include: { class: true } } },
        orderBy: { createdAt: "desc" },
      },
      homework: {
        include: { class: true, teacher: { include: { user: true } } },
        orderBy: { dueDate: "desc" },
        take: 10,
      },
    },
  });

  if (!subject) notFound();

  const avgScore =
    subject.performance.length > 0
      ? Math.round(subject.performance.reduce((s, p) => s + p.score, 0) / subject.performance.length)
      : null;

  const gradeDistribution = subject.performance.reduce<Record<string, number>>((acc, p) => {
    const key = p.grade.charAt(0); // A, B, C, D
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link href="/dashboard/admin/subjects" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{subject.name}</h1>
          <p className="text-sm text-slate-500 font-mono">{subject.code}</p>
        </div>
      </div>

      <div className="page-body">

        {/* Info + stats */}
        <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <BookMarked className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{subject.name}</h2>
                <code className="text-sm text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{subject.code}</code>
                {subject.description && <p className="text-slate-500 mt-2">{subject.description}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t border-slate-100">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{subject.teachers.length}</p>
                <p className="text-xs text-slate-400">Teachers</p>
              </div>
              <div className="text-center border-x border-slate-100">
                <p className="text-2xl font-bold text-slate-800">{subject.classes.length}</p>
                <p className="text-xs text-slate-400">Classes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-800">{subject.performance.length}</p>
                <p className="text-xs text-slate-400">Assessments</p>
              </div>
            </div>
          </div>

          {/* Avg score */}
          <div className="card card-body flex flex-col items-center justify-center">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-3 border-4 ${avgScore && avgScore >= 75 ?"border-green-400" : avgScore && avgScore >= 50 ? "border-yellow-400" : "border-red-400"}`}>
              <span className={`text-3xl font-bold ${avgScore && avgScore >= 75 ? "text-green-600" : avgScore && avgScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                {avgScore !== null ? `${avgScore}%` : "—"}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-700">Average Score</p>
            <p className="text-xs text-slate-400">Across all assessments</p>
          </div>
        </div>

        {/* Teachers */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-slate-500" /> Teachers
          </h3>
          <div className="flex flex-wrap gap-3">
            {subject.teachers.map((ts) => (
              <Link key={ts.teacherId} href={`/dashboard/admin/teachers/${ts.teacherId}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition cursor-pointer">
                  <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(ts.teacher.user.name)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{ts.teacher.user.name}</p>
                    <p className="text-xs text-slate-400">{ts.teacher.department ?? "General"}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Classes */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <School className="w-4 h-4 text-slate-500" /> Classes Offering This Subject
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {subject.classes.map((cs) => (
              <Link key={cs.classId} href={`/dashboard/admin/classes/${cs.classId}`}>
                <div className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition cursor-pointer text-center">
                  <p className="font-bold text-slate-900">{cs.class.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{cs.class.students.length} students</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Grade distribution */}
        {Object.keys(gradeDistribution).length > 0 && (
          <div className="card card-body">
            <h3 className="section-title flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-slate-500" /> Grade Distribution
            </h3>
            <div className="flex items-end gap-4 h-32">
              {Object.entries(gradeDistribution).sort().map(([grade, count]) => {
                const max = Math.max(...Object.values(gradeDistribution));
                const pct = Math.round((count / max) * 100);
                const colors: Record<string, string> = { A: "bg-green-500", B: "bg-blue-500", C: "bg-yellow-500", D: "bg-red-500" };
                return (
                  <div key={grade} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs font-medium text-slate-600">{count}</span>
                    <div className="w-full rounded-t-lg" style={{ height: `${pct}%`, backgroundColor: colors[grade] ?? "#6b7280" }} />
                    <span className="text-xs font-bold text-slate-700">{grade}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance records */}
        <div className="card card-body">
          <h3 className="section-title mb-3">Recent Assessment Results</h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Score</th>
                  <th>Grade</th>
                  <th>Exam Type</th>
                  <th>Term</th>
                </tr>
              </thead>
              <tbody>
                {subject.performance.slice(0, 15).map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td>
                      <Link href={`/dashboard/admin/students/${p.studentId}`} className="font-medium text-blue-600 hover:underline">
                        {p.student.name}
                      </Link>
                    </td>
                    <td><span className="badge bg-slate-100 text-slate-600">{p.student.class.name}</span></td>
                    <td className="font-semibold">{p.score}/{p.maxScore}</td>
                    <td><span className={`badge ${getGradeColor(p.grade)}`}>{p.grade}</span></td>
                    <td className="text-slate-500">{p.examType}</td>
                    <td className="text-slate-500">{p.term}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {subject.performance.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No assessments recorded</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
