import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { formatDate } from "@/lib/utils";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";

export default async function StudentAttendancePage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      student: {
        include: {
          attendance: { orderBy: { date: "desc" } },
          class: true,
        },
      },
    },
  });
  if (!profile) redirect("/auth/login");

  const records = profile.student.attendance;
  const total   = records.length;
  const present = records.filter((r) => r.status === "PRESENT").length;
  const absent  = records.filter((r) => r.status === "ABSENT").length;
  const late    = records.filter((r) => r.status === "LATE").length;
  const pct     = total > 0 ? Math.round((present / total) * 100) : 0;

  const statusIcon = (s: string) => {
    if (s === "PRESENT") return <CheckCircle className="w-4 h-4 text-emerald-500" />;
    if (s === "ABSENT")  return <XCircle     className="w-4 h-4 text-red-400" />;
    if (s === "LATE")    return <Clock       className="w-4 h-4 text-amber-400" />;
    return <AlertCircle className="w-4 h-4 text-slate-400" />;
  };

  const statusBadge = (s: string) => {
    if (s === "PRESENT") return "badge badge-green";
    if (s === "ABSENT")  return "badge badge-red";
    if (s === "LATE")    return "badge badge-yellow";
    return "badge badge-slate";
  };

  return (
    <div>
      <TopNav title="Attendance" subtitle={`${present}/${total} days present`} userName={session.user.name} />
      <div className="page-body">

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Attendance Rate", value: `${pct}%`,  color: pct >= 80 ? "text-emerald-600" : "text-amber-600", bg: "bg-emerald-50" },
            { label: "Present",         value: present,    color: "text-emerald-700", bg: "bg-emerald-50" },
            { label: "Absent",          value: absent,     color: "text-red-700",     bg: "bg-red-50" },
            { label: "Late",            value: late,       color: "text-amber-700",   bg: "bg-amber-50" },
          ].map((s) => (
            <div key={s.label} className={`card card-body ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs font-medium text-slate-600 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="card card-body">
          <div className="flex justify-between text-xs text-slate-500 mb-2">
            <span className="font-medium">Attendance Progress</span>
            <span className="font-bold">{pct}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct >= 80 ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {pct >= 80 ? "✓ Good attendance record" : pct >= 60 ? "⚠ Attendance needs improvement" : "⚠ Critical – please improve attendance"}
          </p>
        </div>

        {/* Records table */}
        <div className="card">
          <div className="px-4 sm:px-5 py-3 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-700">Attendance Records ({total} days)</p>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Date</th><th>Status</th><th>Note</th></tr></thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {statusIcon(r.status)}
                        <span className="font-medium text-slate-700">{formatDate(r.date)}</span>
                      </div>
                    </td>
                    <td><span className={statusBadge(r.status)}>{r.status}</span></td>
                    <td className="text-slate-400 text-xs">{r.note ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {records.length === 0 && <p className="text-sm text-slate-400 text-center py-10">No attendance records yet</p>}
        </div>
      </div>
    </div>
  );
}
