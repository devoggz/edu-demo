import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, School, BookMarked, GraduationCap, ClipboardList, Calendar } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

export default async function AdminTeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: true,
      classes: {
        include: {
          students: true,
          subjects: { include: { subject: true } },
        },
      },
      subjects: { include: { subject: true } },
      homework: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { subject: true, class: true, submissions: true },
      },
      calendarEvents: {
        orderBy: { startDate: "asc" },
        take: 8,
      },
    },
  });

  if (!teacher) notFound();

  const totalStudents = teacher.classes.reduce((s, c) => s + c.students.length, 0);
  const activeHomework = teacher.homework.filter((h) => new Date(h.dueDate) >= new Date());

  return (
    <div>
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link href="/dashboard/admin/teachers" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{teacher.user.name}</h1>
          <p className="text-sm text-slate-500">{teacher.employeeId} · {teacher.department ?? "General"}</p>
        </div>
        <span className="ml-auto badge bg-green-50 text-green-700 px-3 py-1">Active</span>
      </div>

      <div className="page-body">

        {/* Profile + stats */}
        <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-400 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {getInitials(teacher.user.name)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">{teacher.user.name}</h2>
                <p className="text-slate-500">{teacher.qualification ?? "—"}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    {teacher.user.email}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    {teacher.user.phone ?? "—"}
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Department</p>
                    <p className="text-sm font-semibold text-slate-800">{teacher.department ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Joined</p>
                    <p className="text-sm font-semibold text-slate-800">{formatDate(teacher.joinDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
            {[
              { label: "Classes", value: teacher.classes.length, icon: School, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Students", value: totalStudents, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Active HW", value: activeHomework.length, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50" },
            ].map((s) => (
              <div key={s.label} className="card card-body flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}> <s.icon className={`w-5 h-5 ${s.color}`} /> </div> <div> <p className="text-xs text-slate-400">{s.label}</p>
                  <p className="text-xl font-bold text-slate-800">{s.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <BookMarked className="w-4 h-4 text-slate-500" /> Subjects Taught
          </h3>
          <div className="flex flex-wrap gap-2">
            {teacher.subjects.map((ts) => (
              <Link key={ts.subjectId} href={`/dashboard/admin/subjects/${ts.subjectId}`}>
                <span className="badge bg-violet-50 text-violet-700 px-3 py-1.5 text-sm cursor-pointer hover:bg-violet-100 transition">
                  {ts.subject.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Classes */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <School className="w-4 h-4 text-slate-500" /> Classes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-3">
            {teacher.classes.map((cls) => (
              <Link key={cls.id} href={`/dashboard/admin/classes/${cls.id}`}>
                <div className="p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-slate-900">{cls.name}</h4>
                    <span className="text-lg font-bold text-blue-600">{cls.students.length}</span>
                  </div>
                  <p className="text-xs text-slate-500">Room {cls.room ?? "TBD"}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cls.subjects.slice(0, 3).map((cs) => (
                      <span key={cs.subjectId} className="badge bg-slate-100 text-slate-600 text-xs">{cs.subject.name}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent homework */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <ClipboardList className="w-4 h-4 text-slate-500" /> Recent Homework
          </h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Submissions</th>
                </tr>
              </thead>
              <tbody>
                {teacher.homework.map((hw) => {
                  const submitted = hw.submissions.filter((s) => s.status !== "PENDING").length;
                  const isOverdue = new Date(hw.dueDate) < new Date();
                  return (
                    <tr key={hw.id} className="hover:bg-slate-50">
                      <td className="font-medium text-slate-800">{hw.title}</td>
                      <td><span className="badge bg-slate-100 text-slate-600">{hw.class.name}</span></td>
                      <td><span className="badge bg-blue-50 text-blue-700">{hw.subject.name}</span></td>
                      <td className={isOverdue ? "text-red-500 font-medium" : "text-slate-500"}>{formatDate(hw.dueDate)}</td>
                      <td className="text-slate-600">{submitted}/{hw.submissions.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {teacher.homework.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No homework assigned</p>}
          </div>
        </div>

        {/* Upcoming events */}
        {teacher.calendarEvents.length > 0 && (
          <div className="card card-body">
            <h3 className="section-title flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-slate-500" /> Upcoming Events
            </h3>
            <div className="space-y-2">
              {teacher.calendarEvents.map((evt) => (
                <div key={evt.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition"
                  style={{ borderLeft: `3px solid ${evt.color ?? "#3b82f6"}` }}>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{evt.title}</p>
                    <p className="text-xs text-slate-500">{formatDate(evt.startDate)}</p>
                  </div>
                  <span className="badge bg-slate-100 text-slate-600 text-xs">{evt.type}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
