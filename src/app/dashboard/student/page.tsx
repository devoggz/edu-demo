import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import Link from "next/link";
import { formatDate, getInitials, getGradeColor, getCBCGradeLabel } from "@/lib/utils";
import { TrendingUp, BookOpen, Calendar, Award, Bell, ChevronRight, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default async function StudentDashboard() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      student: {
        include: {
          class: { include: { classTeacher: { include: { user: true } }, subjects: { include: { subject: true } } } },
          performance: { include: { subject: true }, orderBy: { createdAt: "desc" } },
          attendance: { orderBy: { date: "desc" }, take: 30 },
          homeworkSubmissions: { include: { homework: { include: { subject: true } } }, orderBy: { createdAt: "desc" }, take: 6 },
          activities: { orderBy: { startDate: "desc" } },
        },
      },
    },
  });

  if (!profile) redirect("/auth/login");
  const student = profile.student;

  // Stats
  const avgScore = student.performance.length > 0
    ? Math.round(student.performance.reduce((s, p) => s + p.score, 0) / student.performance.length)
    : null;

  const presentDays  = student.attendance.filter((a) => a.status === "PRESENT").length;
  const totalDays    = student.attendance.length;
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  const pendingHW = student.homeworkSubmissions.filter((s) => s.status === "PENDING").length;

  // Latest grade per subject
  const subjectMap: Record<string, { name: string; grade: string; score: number }> = {};
  student.performance.forEach((p) => {
    if (!subjectMap[p.subject.name]) subjectMap[p.subject.name] = { name: p.subject.name, grade: p.grade, score: p.score };
  });
  const subjectGrades = Object.values(subjectMap);

  const cbcColors: Record<string, string> = { EE: "bg-emerald-500", ME: "bg-blue-500", AE: "bg-amber-500", BE: "bg-red-500" };
  const avgGrade = avgScore !== null ? (avgScore >= 80 ? "EE" : avgScore >= 65 ? "ME" : avgScore >= 50 ? "AE" : "BE") : null;

  return (
    <div>
      <TopNav title="My Dashboard" subtitle={`${student.class.name} · ${student.studentId}`} userName={session.user.name} />
      <div className="page-body">

        {/* Welcome banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-5 sm:p-6 text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "20px 20px" }} />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <p className="text-blue-200 text-sm mb-1">Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"},</p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{student.name.split(" ")[0]} 👋</h2>
              <p className="text-blue-100 text-sm mt-1">{student.class.name} · {student.class.classTeacher?.user.name ?? "—"}</p>
            </div>
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold backdrop-blur-sm">
              {getInitials(student.name)}
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Avg Score", value: avgScore !== null ? `${avgScore}%` : "N/A", sub: avgGrade ? getCBCGradeLabel(avgGrade) : "No data", color: avgScore && avgScore >= 65 ? "text-emerald-600" : "text-amber-600", icon: TrendingUp, iconBg: "bg-blue-50", iconColor: "text-blue-600", href: "/dashboard/student/performance" },
            { label: "Attendance", value: `${attendancePct}%`, sub: `${presentDays}/${totalDays} days`, color: attendancePct >= 80 ? "text-emerald-600" : "text-amber-600", icon: Calendar, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", href: "/dashboard/student/attendance" },
            { label: "Pending HW", value: pendingHW, sub: `${student.homeworkSubmissions.length} total`, color: "text-slate-800", icon: BookOpen, iconBg: "bg-amber-50", iconColor: "text-amber-600", href: "/dashboard/student/homework" },
            { label: "Activities", value: student.activities.length, sub: "Co-curricular", color: "text-slate-800", icon: Award, iconBg: "bg-violet-50", iconColor: "text-violet-600", href: "/dashboard/student/activities" },
          ].map((s) => (
            <Link key={s.label} href={s.href}>
              <div className="stat-card hover:shadow-md transition-shadow cursor-pointer">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${s.iconBg}`}>
                  <s.icon className={`w-4 h-4 ${s.iconColor}`} />
                </div>
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs font-medium text-slate-600 mt-0.5">{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5 truncate">{s.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* Performance by subject */}
          <div className="card card-body lg:col-span-3">
            <div className="section-header">
              <p className="section-title">CBC Performance</p>
              <Link href="/dashboard/student/performance" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {subjectGrades.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No assessments recorded yet</p>
            ) : (
              <div className="space-y-2.5">
                {subjectGrades.slice(0, 6).map((s) => (
                  <div key={s.name} className="flex items-center gap-3">
                    <p className="text-xs font-medium text-slate-600 w-28 flex-shrink-0 truncate">{s.name}</p>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${cbcColors[s.grade] ?? "bg-slate-400"}`} style={{ width: `${s.score}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-8 text-right">{s.score}%</span>
                    <span className={`badge text-[10px] font-bold w-8 justify-center ${getGradeColor(s.grade)}`}>{s.grade}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent homework */}
          <div className="card card-body lg:col-span-2">
            <div className="section-header">
              <p className="section-title">Homework</p>
              <Link href="/dashboard/student/homework" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {student.homeworkSubmissions.slice(0, 4).map((sub) => {
                const isOverdue = new Date(sub.homework.dueDate) < new Date() && sub.status === "PENDING";
                return (
                  <div key={sub.id} className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="mt-0.5 flex-shrink-0">
                      {sub.status === "GRADED" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                       isOverdue ? <AlertCircle className="w-4 h-4 text-red-400" /> :
                       <Clock className="w-4 h-4 text-amber-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{sub.homework.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sub.homework.subject.name} · {formatDate(sub.homework.dueDate)}</p>
                    </div>
                    {sub.grade !== null && <span className="text-xs font-bold text-slate-600 flex-shrink-0">{sub.grade}%</span>}
                  </div>
                );
              })}
              {student.homeworkSubmissions.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No homework yet</p>}
            </div>
          </div>
        </div>

        {/* Activities strip */}
        {student.activities.length > 0 && (
          <div className="card card-body">
            <div className="section-header">
              <p className="section-title">Co-Curricular Activities</p>
              <Link href="/dashboard/student/activities" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {student.activities.map((act) => (
                <div key={act.id} className="flex-shrink-0 bg-slate-50 rounded-lg p-3 w-44">
                  <p className="text-xs font-semibold text-slate-800 truncate">{act.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{act.category}{act.role ? ` · ${act.role}` : ""}</p>
                  {act.achievement && (
                    <span className="badge badge-yellow text-[10px] mt-1.5">🏆 {act.achievement}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
