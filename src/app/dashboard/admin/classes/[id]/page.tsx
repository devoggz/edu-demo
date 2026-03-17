import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, BookMarked, GraduationCap, ClipboardList, Calendar } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

export default async function AdminClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cls = await prisma.class.findUnique({
    where: { id },
    include: {
      classTeacher: { include: { user: true } },
      students: {
        include: { parent: { include: { user: true } } },
        orderBy: { name: "asc" },
      },
      subjects: { include: { subject: { include: { teachers: { include: { teacher: { include: { user: true } } } } } } } },
      homework: {
        orderBy: { dueDate: "asc" },
        include: { subject: true, teacher: { include: { user: true } } },
      },
      calendarEvents: {
        orderBy: { startDate: "asc" },
        take: 6,
      },
      fees: {
        include: { student: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!cls) notFound();

  const upcomingHW = cls.homework.filter((h) => new Date(h.dueDate) >= new Date());
  const paidCount = cls.fees.filter((f) => f.status === "PAID").length;

  return (
    <div>
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link href="/dashboard/admin/classes" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{cls.name}</h1>
          <p className="text-sm text-slate-500">Room {cls.room ?? "TBD"} · {cls.academicYear}</p>
        </div>
      </div>

      <div className="page-body">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Students", value: cls.students.length, max: cls.capacity, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "Subjects", value: cls.subjects.length, icon: BookMarked, color: "text-violet-600", bg: "bg-violet-50" },
            { label: "Pending HW", value: upcomingHW.length, icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50" },
            { label: "Fees Cleared", value: paidCount, max: cls.fees.length, icon: Users, color: "text-green-600", bg: "bg-green-50" },
          ].map((s) => (
            <div key={s.label} className="card card-body">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.bg}`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}{s.max !== undefined ? `/${s.max}` : ""}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Class info + Teacher */}
        <div className="card card-body">
          <h3 className="section-title mb-3">Class Information</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-400">Grade</p>
              <p className="font-semibold text-slate-800">Grade {cls.grade}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Section</p>
              <p className="font-semibold text-slate-800">{cls.section}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Capacity</p>
              <p className="font-semibold text-slate-800">{cls.students.length} / {cls.capacity}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Class Teacher</p>
              {cls.classTeacher ? (
                <Link href={`/dashboard/admin/teachers/${cls.classTeacher.id}`} className="font-semibold text-blue-600 hover:underline">
                  {cls.classTeacher.user.name}
                </Link>
              ) : (
                <p className="font-semibold text-slate-400">Not assigned</p>
              )}
            </div>
          </div>
          {/* Capacity bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Enrollment</span>
              <span>{Math.round((cls.students.length / cls.capacity) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(cls.students.length / cls.capacity) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Subjects */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <BookMarked className="w-4 h-4 text-slate-500" /> Subjects
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cls.subjects.map((cs) => (
              <Link key={cs.subjectId} href={`/dashboard/admin/subjects/${cs.subjectId}`}>
                <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{cs.subject.name}</p>
                    <p className="text-xs text-slate-400">{cs.subject.code}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cs.subject.teachers.slice(0, 2).map((ts) => (
                      <span key={ts.teacherId} className="badge bg-violet-50 text-violet-700 text-xs">{ts.teacher.user.name}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Students table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-slate-500" /> Students ({cls.students.length})
            </h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>ID</th>
                <th>Gender</th>
                <th>Parent</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {cls.students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition cursor-pointer">
                  <td>
                    <Link href={`/dashboard/admin/students/${student.id}`} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {getInitials(student.name)}
                      </div>
                      <span className="font-medium text-blue-600 hover:underline">{student.name}</span>
                    </Link>
                  </td>
                  <td><code className="text-xs text-slate-500">{student.studentId}</code></td>
                  <td>
                    <span className={`badge ${student.gender === "Male" ? "bg-blue-50 text-blue-700" : "bg-pink-50 text-pink-700"}`}>
                      {student.gender}
                    </span>
                  </td>
                  <td className="text-slate-600">{student.parent.user.name}</td>
                  <td className="text-slate-500 text-xs">{student.parent.user.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Upcoming homework */}
        {upcomingHW.length > 0 && (
          <div className="card card-body">
            <h3 className="section-title flex items-center gap-2 mb-3">
              <ClipboardList className="w-4 h-4 text-slate-500" /> Upcoming Homework
            </h3>
            <div className="space-y-2">
              {upcomingHW.map((hw) => (
                <div key={hw.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{hw.title}</p>
                    <p className="text-xs text-slate-500">{hw.subject.name} · Set by {hw.teacher.user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-orange-600">Due {formatDate(hw.dueDate)}</p>
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
