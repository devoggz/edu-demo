import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GraduationCap, User, BookOpen, TrendingUp, DollarSign, Award, Calendar } from "lucide-react";
import { formatDate, formatCurrency, getInitials, getGradeColor, getCBCGradeLabel, getFeeStatusColor } from "@/lib/utils";
import { FeePromptButton } from "@/components/admin/FeePromptButton";

export default async function AdminStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
      fees: { orderBy: { createdAt: "desc" } },
      activities: { orderBy: { startDate: "desc" } },
      homeworkSubmissions: {
        include: { homework: { include: { subject: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!student) notFound();

  const avgScore =
    student.performance.length > 0
      ? Math.round(student.performance.reduce((s, p) => s + p.score, 0) / student.performance.length)
      : null;

  const totalFees = student.fees.reduce((s, f) => s + f.totalAmount, 0);
  const paidFees = student.fees.reduce((s, f) => s + f.paidAmount, 0);
  const feeBalance = totalFees - paidFees;

  // Group performance by subject (latest per subject)
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

  const cbcInfo = (grade: string) => {
    switch (grade) {
      case "EE": return { color: "bg-green-500", light: "bg-green-50 text-green-700 border-green-200" };
      case "ME": return { color: "bg-blue-500",  light: "bg-blue-50 text-blue-700 border-blue-200" };
      case "AE": return { color: "bg-yellow-500",light: "bg-yellow-50 text-yellow-700 border-yellow-200" };
      case "BE": return { color: "bg-red-500",   light: "bg-red-50 text-red-700 border-red-200" };
      default:   return { color: "bg-slate-400", light: "bg-slate-50 text-slate-600 border-slate-200" };
    }
  };

  return (
    <div>
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-3 sticky top-0 z-30">
        <Link href="/dashboard/admin/students" className="p-1.5 rounded-lg hover:bg-slate-100 transition">
          <ArrowLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
          <p className="text-sm text-slate-500">{student.studentId} · {student.class.name}</p>
        </div>
        <span className={`ml-auto badge text-sm px-3 py-1 ${student.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {student.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="page-body">

        {/* Profile + quick stats */}
        <div className="grid grid-cols-1 lg:grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                {getInitials(student.name)}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-slate-900">{student.name}</h2>
                <p className="text-slate-500 mt-0.5">{student.class.name} · {student.studentId}</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-5 border-t border-slate-100">
                  {[
                    { label: "Date of Birth", value: formatDate(student.dateOfBirth), icon: Calendar },
                    { label: "Gender", value: student.gender, icon: User },
                    { label: "Blood Group", value: student.bloodGroup ?? "—", icon: User },
                    { label: "Class Teacher", value: student.class.classTeacher?.user.name ?? "—", icon: GraduationCap },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                      <p className="text-sm font-semibold text-slate-800">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3">
            <div className="card card-body flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Average Score</p>
                <p className={`text-xl font-bold ${avgScore !== null && avgScore >= 80 ? "text-green-600" : avgScore !== null && avgScore >= 65 ? "text-blue-600" : avgScore !== null && avgScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                  {avgScore !== null ? `${avgScore}%` : "N/A"}
                </p>
              </div>
            </div>
            <div className={`bg-white rounded-2xl border p-4 shadow-sm flex items-center gap-3 ${feeBalance > 0 ? "border-red-100" : "border-green-100"}`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feeBalance > 0 ? "bg-red-50" : "bg-green-50"}`}>
                <DollarSign className={`w-5 h-5 ${feeBalance > 0 ? "text-red-600" : "text-green-600"}`} />
              </div>
              <div>
                <p className="text-xs text-slate-400">Fee Balance</p>
                <p className={`text-xl font-bold ${feeBalance > 0 ? "text-red-600" : "text-green-600"}`}>
                  {formatCurrency(feeBalance)}
                </p>
              </div>
            </div>
            <div className="card card-body flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <Award className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Activities</p>
                <p className="text-xl font-bold text-slate-800">{student.activities.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Parent info */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-slate-500" /> Parent / Guardian
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Name", value: student.parent.user.name },
              { label: "Email", value: student.parent.user.email },
              { label: "Phone", value: student.parent.user.phone ?? "—" },
              { label: "Occupation", value: student.parent.occupation ?? "—" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                <p className="text-sm font-semibold text-slate-800">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CBC Performance */}
        <div className="card card-body">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-500" /> CBC Academic Performance
            </h3>
            {/* Grade distribution badges */}
            <div className="flex gap-1.5">
              {Object.entries(gradeDist).map(([g, count]) =>
                count > 0 ? (
                  <span key={g} className={`badge border text-xs font-semibold ${cbcInfo(g).light}`}>
                    {g}: {count}
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
                const info = cbcInfo(latest.grade);
                return (
                  <div key={subject} className="flex items-center gap-4">
                    <p className="text-sm font-medium text-slate-700 w-40 flex-shrink-0 truncate">{subject}</p>
                    <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${info.color}`}
                        style={{ width: `${avg}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-slate-700 w-12 text-right">{avg}%</span>
                    <span className={`badge text-xs font-bold w-10 justify-center border ${info.light}`}>
                      {latest.grade}
                    </span>
                    <span className="text-xs text-slate-400 w-32 truncate">{getCBCGradeLabel(latest.grade)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Fee Records */}
        <div className="card card-body">
          <h3 className="section-title flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-slate-500" /> Fee Records
          </h3>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Term</th><th>Year</th><th>Total</th><th>Paid</th><th>Balance</th><th>Due Date</th><th>Status</th><th></th>
                </tr>
              </thead>
              <tbody>
                {student.fees.map((fee) => {
                  const balance = fee.totalAmount - fee.paidAmount;
                  return (
                    <tr key={fee.id} className="hover:bg-slate-50">
                      <td className="font-medium">{fee.term}</td>
                      <td className="text-slate-500">{fee.academicYear}</td>
                      <td>{formatCurrency(fee.totalAmount)}</td>
                      <td className="text-green-700 font-medium">{formatCurrency(fee.paidAmount)}</td>
                      <td className={`font-semibold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(balance)}</td>
                      <td className="text-slate-500">{formatDate(fee.dueDate)}</td>
                      <td><span className={`badge ${getFeeStatusColor(fee.status)}`}>{fee.status}</span></td>
                      <td>{balance > 0 && <FeePromptButton feeId={fee.id} balance={balance} promptCount={fee.promptCount} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {student.fees.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No fee records</p>}
          </div>
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
                  <p className="text-xs text-slate-500">{sub.homework.subject.name} · Due {formatDate(sub.homework.dueDate)}</p>
                  {sub.feedback && <p className="text-xs text-slate-400 italic mt-0.5">{sub.feedback}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {sub.grade !== null && (
                    <span className="text-sm font-bold text-slate-700">{sub.grade}%</span>
                  )}
                  <span className={`badge text-xs ${sub.status === "GRADED" ? "bg-blue-50 text-blue-700" : sub.status === "SUBMITTED" ? "bg-green-50 text-green-700" : "bg-yellow-50 text-yellow-700"}`}>
                    {sub.status}
                  </span>
                </div>
              </div>
            ))}
            {student.homeworkSubmissions.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-6">No homework submissions yet</p>
            )}
          </div>
        </div>

        {/* Co-curricular */}
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
