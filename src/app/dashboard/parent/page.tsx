import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { GraduationCap, BookOpen, DollarSign, Bell, Clock, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

async function getParentData(userId: string) {
  const parent = await prisma.parent.findUnique({
    where: { userId },
    include: {
      students: {
        include: {
          class: { include: { classTeacher: { include: { user: true } } } },
          fees: { orderBy: { createdAt: "desc" }, take: 1 },
          performance: { include: { subject: true }, orderBy: { createdAt: "desc" }, take: 6 },
          homeworkSubmissions: {
            include: { homework: { include: { subject: true, class: true } } },
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  const notifications = await prisma.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { notification: { include: { sender: true } } },
  });

  return { parent, notifications };
}

export default async function ParentDashboard() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const { parent, notifications } = await getParentData(session.user.id);
  if (!parent) redirect("/auth/login");

  const students = parent.students;
  const unread = notifications.filter((n) => !n.isRead).length;
  const totalFees = students.reduce((s, st) => s + (st.fees[0]?.totalAmount ?? 0), 0);
  const paidFees = students.reduce((s, st) => s + (st.fees[0]?.paidAmount ?? 0), 0);
  const outstanding = totalFees - paidFees;

  return (
    <div>
      <TopNav
        title="Family Dashboard"
        subtitle={`Welcome, ${session.user.name?.split(" ")[0]}`}
        userName={session.user.name}
        unreadCount={unread}
      />

      <div className="page-body">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard title="Children" value={students.length} icon={GraduationCap} iconColor="text-blue-600" iconBg="bg-blue-50" />
          <StatCard
            title="Pending Homework"
            value={students.reduce((s, st) => s + st.homeworkSubmissions.filter(h => h.status === "PENDING").length, 0)}
            icon={BookOpen}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
          />
          <StatCard
            title="Fee Balance"
            value={formatCurrency(outstanding)}
            icon={DollarSign}
            iconColor={outstanding > 0 ? "text-red-600" : "text-green-600"}
            iconBg={outstanding > 0 ? "bg-red-50" : "bg-green-50"}
          />
          <StatCard title="Notifications" value={unread} icon={Bell} iconColor="text-violet-600" iconBg="bg-violet-50" subtitle={`${unread} unread`} />
        </div>

        {/* Children Cards */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">My Children</h2>
          <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 gap-3">
            {students.map((student) => {
              const fee = student.fees[0];
              const avgScore =
                student.performance.length > 0
                  ? Math.round(student.performance.reduce((s, p) => s + p.score, 0) / student.performance.length)
                  : null;

              return (
                <div key={student.id} className="card card-body hover:shadow-md transition">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {getInitials(student.name)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900 text-lg">{student.name}</h3>
                      <p className="text-sm text-slate-500">{student.class.name}</p>
                      <p className="text-xs text-slate-400">
                        Class Teacher: {student.class.classTeacher?.user.name ?? "Not assigned"}
                      </p>
                    </div>
                    <div className="text-right">
                      {avgScore !== null && (
                        <div className={`text-2xl font-bold ${avgScore >= 75 ? "text-green-600" : avgScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                          {avgScore}%
                        </div>
                      )}
                      <p className="text-xs text-slate-400">avg score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">{student.performance.length}</p>
                      <p className="text-xs text-slate-400">Assessments</p>
                    </div>
                    <div className="text-center border-x border-slate-100">
                      <p className={`text-lg font-bold ${fee && fee.totalAmount - fee.paidAmount > 0 ? "text-red-600" : "text-green-600"}`}>
                        {fee ? formatCurrency(fee.totalAmount - fee.paidAmount) : "—"}
                      </p>
                      <p className="text-xs text-slate-400">Balance</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-slate-800">
                        {student.homeworkSubmissions.filter(h => h.status === "PENDING").length}
                      </p>
                      <p className="text-xs text-slate-400">Pending HW</p>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/dashboard/parent/children/${student.id}`}
                      className="flex-1 text-center text-sm font-medium text-blue-600 border border-blue-200 py-2 rounded-xl hover:bg-blue-50 transition"
                    >
                      View Profile
                    </Link>
                    <Link
                      href="/dashboard/parent/performance"
                      className="flex-1 text-center text-sm font-medium text-slate-600 border border-slate-200 py-2 rounded-xl hover:bg-slate-50 transition"
                    >
                      Performance
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Notifications */}
        <div className="card card-body">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Recent Notifications</h3>
            <Link href="/dashboard/parent/notifications" className="text-xs text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {notifications.map((un) => (
              <div key={un.id} className={`flex items-start gap-3 p-3 rounded-xl ${!un.isRead ? "bg-blue-50" : "hover:bg-slate-50"} transition`}>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{un.notification.title}</p>
                    {!un.isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 truncate">{un.notification.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">From {un.notification.sender.name}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No notifications yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
