import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Clock, AlertCircle, Users } from "lucide-react";
import { formatDate, formatDateTime, getInitials } from "@/lib/utils";

export default async function TeacherHomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({ where: { userId: session.user.id } });
  if (!teacher) redirect("/auth/login");

  const hw = await prisma.homework.findUnique({
    where: { id },
    include: {
      subject: true,
      class: { include: { students: true } },
      teacher: { include: { user: true } },
      submissions: {
        include: {
          student: {
            include: { parent: { include: { user: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!hw || hw.teacherId !== teacher.id) notFound();

  const submitted = hw.submissions.filter((s) => s.status !== "PENDING");
  const pending = hw.submissions.filter((s) => s.status === "PENDING");
  const isOverdue = new Date(hw.dueDate) < new Date();
  const submissionRate = hw.class.students.length > 0
    ? Math.round((submitted.length / hw.class.students.length) * 100)
    : 0;

  return (
    <div>
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link href="/dashboard/teacher/homework" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">{hw.title}</h1>
          <p className="text-sm text-slate-500">{hw.class.name} · {hw.subject.name}</p>
        </div>
        <span className={`badge px-3 py-1 ${isOverdue ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {isOverdue ? "Overdue" : "Active"}
        </span>
      </div>

      <div className="page-body">

        {/* HW details */}
        <div className="card card-body">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{hw.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="badge bg-blue-50 text-blue-700">{hw.subject.name}</span>
                <span className="badge bg-slate-100 text-slate-600">{hw.class.name}</span>
                <span className={`badge ${hw.isWeekly ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"}`}>
                  {hw.isWeekly ? "Weekly" : "Daily"}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center gap-1 text-sm font-medium ${isOverdue ? "text-red-600" : "text-orange-600"}`}>
                {isOverdue ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                Due {formatDate(hw.dueDate)}
              </div>
            </div>
          </div>
          <p className="text-slate-600 bg-slate-50 rounded-xl p-4">{hw.description}</p>
        </div>

        {/* Submission stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card card-body text-center">
                <p className="text-3xl font-bold text-blue-600">{hw.class.students.length}</p>
            <p className="text-sm text-slate-500 mt-1">Total Students</p>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-green-600">{submitted.length}</p>
            <p className="text-sm text-slate-500 mt-1">Submitted</p>
          </div>
          <div className="bg-white rounded-2xl border border-yellow-100 p-5 shadow-sm text-center">
            <p className="text-3xl font-bold text-yellow-600">{pending.length}</p>
            <p className="text-sm text-slate-500 mt-1">Pending</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="card card-body">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-slate-700">Submission Progress</span>
            <span className="font-bold text-slate-900">{submissionRate}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${submissionRate >= 75 ? "bg-green-500" : submissionRate >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
              style={{ width: `${submissionRate}%` }}
            />
          </div>
        </div>

        {/* Submissions table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" /> Submission Details
            </h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Parent</th>
                <th>Submitted At</th>
                <th>Grade</th>
                <th>Feedback</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {hw.submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50">
                  <td>
                    <Link href={`/dashboard/teacher/students/${sub.studentId}`} className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {getInitials(sub.student.name)}
                      </div>
                      <span className="font-medium text-blue-600 hover:underline">{sub.student.name}</span>
                    </Link>
                  </td>
                  <td className="text-slate-500 text-xs">{sub.student.parent.user.name}</td>
                  <td className="text-slate-500 text-xs">
                    {sub.submittedAt ? formatDateTime(sub.submittedAt) : <span className="text-red-400">Not submitted</span>}
                  </td>
                  <td className="font-semibold">{sub.grade !== null ? `${sub.grade}%` : "—"}</td>
                  <td className="text-slate-500 text-xs max-w-xs truncate">{sub.feedback ?? "—"}</td>
                  <td>
                    <span className={`badge text-xs ${
                      sub.status === "SUBMITTED" ? "bg-green-50 text-green-700" :
                      sub.status === "GRADED" ? "bg-blue-50 text-blue-700" :
                      "bg-yellow-50 text-yellow-700"
                    }`}>
                      {sub.status === "PENDING" ? (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>
                      ) : sub.status === "SUBMITTED" ? (
                        <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Submitted</span>
                      ) : sub.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hw.submissions.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No submissions recorded yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
