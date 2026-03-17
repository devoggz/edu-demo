import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getInitials, formatDate, getGradeColor, getCBCGradeLabel } from "@/lib/utils";
import { ArrowLeft, TrendingUp, BookOpen, Award } from "lucide-react";
import Link from "next/link";

export default async function ChildProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const parent = await prisma.parent.findUnique({ where: { userId: session.user.id } });
  if (!parent) redirect("/auth/login");

  const student = await prisma.student.findFirst({
    where: { id, parentId: parent.id },
    include: {
      class: {
        include: {
          classTeacher: { include: { user: true } },
          subjects: { include: { subject: true } },
        },
      },
      performance: {
        include: { subject: true },
        orderBy: { createdAt: "desc" },
      },
      fees: { orderBy: { createdAt: "desc" } },
      activities: true,
      homeworkSubmissions: {
        include: { homework: { include: { subject: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!student) notFound();

  // Group performance by subject (latest record per subject)
  const perfBySubject = student.performance.reduce<Record<string, typeof student.performance>>((acc, p) => {
    if (!acc[p.subject.name]) acc[p.subject.name] = [];
    acc[p.subject.name].push(p);
    return acc;
  }, {});

  // Grade distribution
  const gradeDist = { EE: 0, ME: 0, AE: 0, BE: 0 };
  student.performance.forEach((p) => {
    if (p.grade in gradeDist) gradeDist[p.grade as keyof typeof gradeDist]++;
  });

  const avgScore =
    student.performance.length > 0
      ? Math.round(student.performance.reduce((s, p) => s + p.score, 0) / student.performance.length)
      : null;

  const cbcColor = (grade: string) => {
    switch (grade) {
      case "EE": return { bar: "bg-green-500", badge: "bg-green-50 text-green-700 border-green-200" };
      case "ME": return { bar: "bg-blue-500",  badge: "bg-blue-50 text-blue-700 border-blue-200" };
      case "AE": return { bar: "bg-yellow-500",badge: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      case "BE": return { bar: "bg-red-500",   badge: "bg-red-50 text-red-700 border-red-200" };
      default:   return { bar: "bg-slate-400", badge: "bg-slate-50 text-slate-600 border-slate-200" };
    }
  };

  return (
    <div>
      <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center gap-3">
        <Link href="/dashboard/parent/children" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <h1 className="text-xl font-bold text-slate-900">{student.name}&apos;s Profile</h1>
        {avgScore !== null && (
          <div className="ml-auto flex items-center gap-2">
            <span className={`text-xl font-bold ${avgScore >= 80 ? "text-green-600" : avgScore >= 65 ? "text-blue-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
              {avgScore}%
            </span>
            <span className="text-xs text-slate-400">avg</span>
          </div>
        )}
      </div>

      <div className="page-body">
        {/* Profile */}
        <div className="card card-body flex items-start gap-5">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
            {getInitials(student.name)}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
            <p className="text-slate-500">{student.studentId} · {student.class.name}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100">
              {[
                { label: "Date of Birth", value: formatDate(student.dateOfBirth) },
                { label: "Gender", value: student.gender },
                { label: "Blood Group", value: student.bloodGroup ?? "—" },
                { label: "Class Teacher", value: student.class.classTeacher?.user.name ?? "—" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-slate-400">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CBC grade summary strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {[
            { grade: "EE", label: "Exceeds", range: "80–100", color: "bg-green-500", light: "bg-green-50 border-green-100 text-green-800" },
            { grade: "ME", label: "Meets",   range: "65–79",  color: "bg-blue-500",  light: "bg-blue-50 border-blue-100 text-blue-800" },
            { grade: "AE", label: "Approaching", range: "50–64", color: "bg-yellow-500", light: "bg-yellow-50 border-yellow-100 text-yellow-800" },
            { grade: "BE", label: "Below",   range: "0–49",   color: "bg-red-500",   light: "bg-red-50 border-red-100 text-red-800" },
          ].map((g) => (
            <div key={g.grade} className={`rounded-2xl border p-4 ${g.light}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${g.color}`}>
                  {g.grade}
                </span>
                <span className="text-xs font-bold">{g.range}%</span>
              </div>
              <p className="text-sm font-bold">{gradeDist[g.grade as keyof typeof gradeDist]}</p>
              <p className="text-xs opacity-75">{g.label}</p>
            </div>
          ))}
        </div>

        {/* CBC Performance by Learning Area */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-500" /> CBC Performance by Learning Area
          </h3>
          {Object.keys(perfBySubject).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No performance data available yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(perfBySubject).map(([subject, records]) => {
                const latest = records[0];
                const avg = Math.round(records.reduce((s, r) => s + r.score, 0) / records.length);
                const colors = cbcColor(latest.grade);
                return (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-700">{subject}</span>
                        <span className={`badge border text-xs font-bold ${colors.badge}`}>
                          {latest.grade}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{getCBCGradeLabel(latest.grade)}</span>
                        <span className="text-sm font-bold text-slate-800">{avg}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${avg}%` }} />
                    </div>
                    {latest.remarks && (
                      <p className="text-xs text-slate-400 italic mt-0.5 ml-0.5">{latest.remarks}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Homework */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-slate-500" /> Recent Homework
          </h3>
          <div className="space-y-2">
            {student.homeworkSubmissions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                <div>
                  <p className="text-sm font-medium text-slate-900">{sub.homework.title}</p>
                  <p className="text-xs text-slate-500">
                    {sub.homework.subject.name} · Due {formatDate(sub.homework.dueDate)}
                  </p>
                  {sub.feedback && (
                    <p className="text-xs text-slate-400 italic mt-0.5">{sub.feedback}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {sub.grade !== null && (
                    <span className="text-sm font-bold text-slate-700">{sub.grade}%</span>
                  )}
                  <span className={`badge text-xs ${
                    sub.status === "GRADED" ? "bg-blue-50 text-blue-700" :
                    sub.status === "SUBMITTED" ? "bg-green-50 text-green-700" :
                    "bg-yellow-50 text-yellow-700"
                  }`}>{sub.status}</span>
                </div>
              </div>
            ))}
            {student.homeworkSubmissions.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No homework submissions yet</p>
            )}
          </div>
        </div>

        {/* Activities */}
        {student.activities.length > 0 && (
          <div className="card card-body">
            <h3 className="section-title flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-slate-500" /> Co-Curricular Activities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {student.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-600 text-xs font-bold">{act.category[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{act.name}</p>
                    <p className="text-xs text-slate-500">{act.category}{act.role ? ` · ${act.role}` : ""}</p>
                    {act.achievement && (
                      <span className="badge bg-yellow-50 text-yellow-700 text-xs mt-1">🏆 {act.achievement}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
