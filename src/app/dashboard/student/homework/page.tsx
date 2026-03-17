import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, AlertCircle, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function StudentHomeworkPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      student: {
        include: {
          homeworkSubmissions: {
            include: {
              homework: { include: { subject: true, teacher: { include: { user: true } } } },
            },
            orderBy: { homework: { dueDate: "asc" } },
          },
        },
      },
    },
  });
  if (!profile) redirect("/auth/login");

  const subs = profile.student.homeworkSubmissions;
  const now = new Date();

  const pending   = subs.filter(s => s.status === "PENDING" && new Date(s.homework.dueDate) >= now);
  const overdue   = subs.filter(s => s.status === "PENDING" && new Date(s.homework.dueDate) < now);
  const submitted = subs.filter(s => s.status === "SUBMITTED" || s.status === "SUBMITTED_LATE");
  const graded    = subs.filter(s => s.status === "GRADED");
  const avgGrade  = graded.length > 0 ? Math.round(graded.reduce((s,x) => s + (x.grade ?? 0), 0) / graded.length) : null;

  const sections = [
    { label: "Pending",   count: pending.length,   items: pending,   empty: "No pending homework 🎉", accent: "text-amber-600" },
    { label: "Overdue",   count: overdue.length,    items: overdue,   empty: "No overdue homework",    accent: "text-red-600" },
    { label: "Submitted", count: submitted.length,  items: submitted, empty: "No submitted homework",  accent: "text-blue-600" },
    { label: "Graded",    count: graded.length,     items: graded,    empty: "No graded homework yet", accent: "text-emerald-600" },
  ];

  return (
    <div>
      <TopNav title="Homework" subtitle={`${subs.length} assignments`} userName={session.user.name} />
      <div className="page-body">

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Pending",   value: pending.length,  color: "text-amber-600",   bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Overdue",   value: overdue.length,  color: "text-red-600",     bg: "bg-red-50 dark:bg-red-900/20" },
            { label: "Submitted", value: submitted.length,color: "text-blue-700",    bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Avg Grade", value: avgGrade !== null ? `${avgGrade}%` : "—", color: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          ].map(s => (
            <div key={s.label} className={`card card-body ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Sections */}
        {sections.map(({ label, count, items, empty, accent }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b" style={{ borderColor: "hsl(var(--border))" }}>
              <p className="text-sm font-semibold" style={{ color: "hsl(var(--foreground))" }}>{label}</p>
              <span className={`badge badge-slate ${count > 0 ? accent : ""}`}>{count}</span>
            </div>

            {items.length === 0 ? (
              <div className="flex items-center gap-3 px-4 sm:px-5 py-6 text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>
                <BookOpen className="w-4 h-4 opacity-40 flex-shrink-0" /> {empty}
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
                {items.map(sub => {
                  const isOverdueItem = new Date(sub.homework.dueDate) < now && sub.status === "PENDING";
                  return (
                    <Link
                      key={sub.id}
                      href={`/dashboard/student/homework/${sub.homework.id}`}
                      className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <div className="flex-shrink-0">
                        {sub.status === "GRADED" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                         sub.status === "SUBMITTED" || sub.status === "SUBMITTED_LATE" ? <CheckCircle className="w-4 h-4 text-blue-500" /> :
                         isOverdueItem ? <AlertCircle className="w-4 h-4 text-red-400" /> :
                         <Clock className="w-4 h-4 text-amber-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate group-hover:text-blue-600 transition-colors" style={{ color: "hsl(var(--foreground))" }}>
                          {sub.homework.title}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                          {sub.homework.subject.name} · {sub.homework.teacher.user.name} · Due {formatDate(sub.homework.dueDate)}
                        </p>
                        {sub.feedback && (
                          <p className="text-xs italic mt-1 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                            {sub.feedback}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {sub.grade !== null && <span className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{sub.grade}%</span>}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
