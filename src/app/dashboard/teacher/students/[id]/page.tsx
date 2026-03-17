import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, TrendingUp, BookOpen, Award, Phone, Mail } from "lucide-react";
import { formatDate, getInitials, getGradeColor, getCBCGradeLabel } from "@/lib/utils";

export default async function TeacherStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session) redirect("/auth/login");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    include: { classes: true },
  });
  if (!teacher) redirect("/auth/login");

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      class: {
        include: {
          classTeacher: { include: { user: true } },
          subjects: { include: { subject: true } },
        },
      },
      parent: { include: { user: true } },
      performance: {
        include: { subject: true },
        orderBy: { createdAt: "desc" },
      },
      homeworkSubmissions: {
        include: { homework: { include: { subject: true, teacher: { include: { user: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 15,
      },
      activities: true,
    },
  });

  if (!student) notFound();

  const teachesClass = teacher.classes.some((c) => c.id === student.classId);
  if (!teachesClass) notFound();

  const avgScore =
    student.performance.length > 0
      ? Math.round(student.performance.reduce((s, p) => s + p.score, 0) / student.performance.length)
      : null;

  // Group performance by subject
  const perfBySubject: Record<string, typeof student.performance> = {};
  student.performance.forEach((p) => {
    if (!perfBySubject[p.subject.name]) perfBySubject[p.subject.name] = [];
    perfBySubject[p.subject.name].push(p);
  });

  // CBC grade distribution
  const gradeDist = { EE: 0, ME: 0, AE: 0, BE: 0 };
  student.performance.forEach((p) => {
    if (p.grade in gradeDist) gradeDist[p.grade as keyof typeof gradeDist]++;
  });

  const pendingHW = student.homeworkSubmissions.filter((s) => s.status === "PENDING").length;
  const submittedHW = student.homeworkSubmissions.filter((s) => s.status !== "PENDING").length;

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
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link href="/dashboard/teacher/students" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
          <p className="text-sm text-slate-500">{student.studentId} · {student.class.name}</p>
        </div>
        {avgScore !== null && (
          <div className={`ml-auto flex items-center gap-2`}>
            <span className={`text-xl font-bold ${avgScore >= 80 ? "text-green-600" : avgScore >= 65 ? "text-blue-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
              {avgScore}%
            </span>
            <span className="text-sm text-slate-400">avg</span>
          </div>
        )}
      </div>

      <div className="page-body">

        {/* Profile + parent contact */}
        <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                {getInitials(student.name)}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                <p className="text-slate-500">{student.class.name} · {student.gender}</p>
                <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">Date of Birth</p>
                    <p className="font-semibold text-slate-800">{formatDate(student.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Blood Group</p>
                    <p className="font-semibold text-slate-800">{student.bloodGroup ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Assessments</p>
                    <p className="font-semibold text-slate-800">{student.performance.length}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Class Teacher</p>
                    <p className="font-semibold text-slate-800">{student.class.classTeacher?.user.name ?? "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Parent contact */}
          <div className="card card-body">
            <h3 className="section-title mb-3">Parent / Guardian</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
                {getInitials(student.parent.user.name)}
              </div>
              <div>
                <p className="font-semibold text-slate-800">{student.parent.user.name}</p>
                <p className="text-xs text-slate-400">{student.parent.occupation ?? "Guardian"}</p>
              </div>
            </div>
            <div className="space-y-2.5">
              <a href={`mailto:${student.parent.user.email}`}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{student.parent.user.email}</span>
              </a>
              {student.parent.user.phone && (
                <>
                  <a href={`tel:${student.parent.user.phone}`}
                    className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    {student.parent.user.phone}
                  </a>
                  <a
                    href={`https://wa.me/${student.parent.user.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium transition"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.022.505 3.927 1.395 5.594L.058 23.292a.5.5 0 0 0 .65.65l5.698-1.337A11.934 11.934 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                    </svg>
                    WhatsApp Parent
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Homework summary */}
        <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: "Total Assigned", value: student.homeworkSubmissions.length, color: "text-slate-800", bg: "bg-slate-50 border-slate-100" },
            { label: "Submitted / Graded", value: submittedHW, color: "text-green-700", bg: "bg-green-50 border-green-100" },
            { label: "Pending", value: pendingHW, color: "text-orange-700", bg: "bg-orange-50 border-orange-100" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl p-5 border ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CBC Performance */}
        <div className="card card-body">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-500" /> CBC Performance by Learning Area
            </h3>
            <div className="flex gap-1.5">
              {Object.entries(gradeDist).map(([g, count]) =>
                count > 0 ? (
                  <span key={g} className={`badge border text-xs font-semibold ${cbcColor(g).badge}`}>
                    {g}:{count}
                  </span>
                ) : null
              )}
            </div>
          </div>

          {Object.keys(perfBySubject).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No performance records yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(perfBySubject).map(([subject, records]) => {
                const latest = records[0];
                const avg = Math.round(records.reduce((s, r) => s + r.score, 0) / records.length);
                const colors = cbcColor(latest.grade);
                return (
                  <div key={subject} className="flex items-center gap-4">
                    <p className="text-sm font-medium text-slate-700 w-40 flex-shrink-0 truncate">{subject}</p>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${avg}%` }} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-12 text-right">{avg}%</span>
                    <span className={`badge text-xs font-bold border w-10 justify-center ${colors.badge}`}>
                      {latest.grade}
                    </span>
                    <span className="text-xs text-slate-400 w-36 hidden md:block truncate">
                      {getCBCGradeLabel(latest.grade)}
                    </span>
                    <span className="text-xs text-slate-400 w-28 hidden lg:block">
                      {records.length} assessment{records.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Term breakdown */}
          {student.performance.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">All Assessment Records</p>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Learning Area</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Level</th>
                      <th>Type</th>
                      <th>Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {student.performance.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="font-medium text-slate-800">{p.subject.name}</td>
                        <td className="font-semibold">{p.score}/{p.maxScore}</td>
                        <td>
                          <span className={`badge text-xs font-bold border ${cbcColor(p.grade).badge}`}>
                            {p.grade}
                          </span>
                        </td>
                        <td className="text-slate-500 text-xs">{getCBCGradeLabel(p.grade)}</td>
                        <td className="text-slate-500 text-xs">{p.examType}</td>
                        <td className="text-slate-500 text-xs">{p.term}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Homework submissions */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-slate-500" /> Homework Submissions
          </h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Submitted</th>
                  <th>Score</th>
                  <th>Feedback</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {student.homeworkSubmissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50">
                    <td className="font-medium text-slate-800">{sub.homework.title}</td>
                    <td><span className="badge bg-blue-50 text-blue-700">{sub.homework.subject.name}</span></td>
                    <td className="text-slate-500">{formatDate(sub.homework.dueDate)}</td>
                    <td className="text-slate-500">{sub.submittedAt ? formatDate(sub.submittedAt) : "—"}</td>
                    <td className="font-semibold">{sub.grade !== null ? `${sub.grade}%` : "—"}</td>
                    <td className="text-slate-500 text-xs max-w-xs truncate">{sub.feedback ?? "—"}</td>
                    <td>
                      <span className={`badge text-xs ${
                        sub.status === "GRADED" ? "bg-blue-50 text-blue-700" :
                        sub.status === "SUBMITTED" ? "bg-green-50 text-green-700" :
                        "bg-yellow-50 text-yellow-700"
                      }`}>{sub.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {student.homeworkSubmissions.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No submissions yet</p>
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
                <div key={act.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-700 text-sm font-bold">{act.category[0]}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{act.name}</p>
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
