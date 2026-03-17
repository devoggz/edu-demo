import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, BookMarked, ClipboardList, TrendingUp } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

export default async function TeacherClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { classes: true },
  });
  if (!teacher) redirect("/auth/login");

  const teachesClass = teacher.classes.some((c) => c.id === id);
  if (!teachesClass) notFound();

  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      classTeacher: { include: { user: true } },
      students: {
        include: {
          parent: { include: { user: true } },
          performance: true,
        },
        orderBy: { name: "asc" },
      },
      subjects: { include: { subject: true } },
      homework: {
        where: { teacherId: teacher.id },
        orderBy: { dueDate: "asc" },
        include: { subject: true, submissions: true },
      },
      calendarEvents: {
        where: { teacherId: teacher.id },
        orderBy: { startDate: "asc" },
        take: 5,
      },
    },
  });

  if (!cls) notFound();

  const upcomingHW = cls.homework.filter((h) => new Date(h.dueDate) >= new Date());

  return (
    <div>
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link href="/dashboard/teacher/classes" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{cls.name}</h1>
          <p className="text-sm text-slate-500">Room {cls.room ?? "TBD"} · {cls.students.length} students</p>
        </div>
        <div className="ml-auto flex gap-2">
          <Link
            href="/dashboard/teacher/homework/new"
            className="btn-sm btn-primary"
          >
            <ClipboardList className="w-3.5 h-3.5" /> Assign HW
          </Link>
        </div>
      </div>

      <div className="page-body">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Students", value: cls.students.length, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Subjects", value: cls.subjects.length, icon: BookMarked, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Active HW", value: upcomingHW.length, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Capacity", value: `${cls.students.length}/${cls.capacity}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((s) => (
            <div key={s.label} className="card card-body flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}> <s.icon className={`w-5 h-5 ${s.color}`} /> </div> <div> <p className="text-lg font-bold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Subjects taught in this class */}
        <div className="card card-body">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <BookMarked className="w-4 h-4 text-slate-500" /> Subjects
          </h3>
          <div className="flex flex-wrap gap-2">
            {cls.subjects.map((cs) => (
              <span key={cs.subjectId} className="badge bg-blue-50 text-blue-700 px-3 py-1.5">{cs.subject.name}</span>
            ))}
          </div>
        </div>

        {/* Students */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-500" /> Students
            </h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Gender</th>
                <th>Parent</th>
                <th>Contact</th>
                <th>Avg Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cls.students.map((student) => {
                const avg = student.performance.length > 0
                  ? Math.round(student.performance.reduce((s, p) => s + p.score, 0) / student.performance.length)
                  : null;
                return (
                  <tr key={student.id} className="hover:bg-slate-50 transition">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(student.name)}
                        </div>
                        <span className="font-medium text-slate-900">{student.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${student.gender === "Male" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                        {student.gender}
                      </span>
                    </td>
                    <td className="text-slate-600">{student.parent.user.name}</td>
                    <td className="text-slate-500 text-xs">{student.parent.user.phone ?? "—"}</td>
                    <td>
                      {avg !== null ? (
                        <span className={`badge font-semibold ${avg >= 75 ? "bg-green-50 text-green-700" : avg >= 50 ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
                          {avg}%
                        </span>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td>
                      <Link href={`/dashboard/teacher/students/${student.id}`}
                        className="text-xs text-blue-600 hover:underline font-medium">
                        View →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Homework for this class */}
        {cls.homework.length > 0 && (
          <div className="card card-body">
            <h3 className="section-title flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-slate-500" /> Homework for This Class
            </h3>
            <div className="space-y-3">
              {cls.homework.map((hw) => {
                const submitted = hw.submissions.filter((s) => s.status !== "PENDING").length;
                const isOverdue = new Date(hw.dueDate) < new Date();
                return (
                  <Link key={hw.id} href={`/dashboard/teacher/homework/${hw.id}`}>
                    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{hw.title}</p>
                        <p className="text-xs text-slate-500">{hw.subject.name} · Due {formatDate(hw.dueDate)}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div className="text-xs text-slate-500">{submitted}/{hw.submissions.length} submitted</div>
                        <span className={`badge text-xs ${isOverdue ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                          {isOverdue ? "Overdue" : "Active"}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
