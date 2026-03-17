import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TopNav } from "@/components/shared/TopNav";
import { StatCard } from "@/components/shared/StatCard";
import { AdminOverviewCharts } from "@/components/admin/AdminOverviewCharts";
import { RecentNotifications } from "@/components/admin/RecentNotifications";
import { RecentStudents } from "@/components/admin/RecentStudents";
import { AdminFeeSummary } from "@/components/admin/AdminFeeSummary";
import { Users, GraduationCap, School, BookMarked, Banknote, Bell } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

async function getAdminStats() {
  const [teachers, students, classes, subjects, fees, unread] = await Promise.all([
    prisma.teacher.count(),
    prisma.student.count({ where: { isActive: true } }),
    prisma.class.count(),
    prisma.subject.count(),
    prisma.fee.aggregate({ _sum: { totalAmount: true, paidAmount: true } }),
    prisma.userNotification.count({ where: { isRead: false } }),
  ]);
  const totalFees = fees._sum.totalAmount ?? 0;
  const paidFees  = fees._sum.paidAmount  ?? 0;
  return { teachers, students, classes, subjects, totalFees, paidFees, unread };
}

async function getRecentData() {
  const [recentStudents, recentNotifications, feesByStatus, outstandingFees] = await Promise.all([
    prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { class: true, parent: { include: { user: true } } },
    }),
    prisma.notification.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { sender: true, class: true },
    }),
    prisma.fee.groupBy({
      by: ["status"],
      _count: { id: true },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    // Fees with outstanding balances for the dashboard prompt panel
    prisma.fee.findMany({
      where: { status: { in: ["OVERDUE", "PENDING", "PARTIAL"] } },
      include: {
        student: { select: { id: true, name: true, studentId: true } },
        class:   { select: { name: true } },
      },
      orderBy: { dueDate: "asc" },
      take: 8,
    }),
  ]);
  return { recentStudents, recentNotifications, feesByStatus, outstandingFees };
}

export default async function AdminDashboard() {
  const session = await auth();
  if (!session) redirect("/auth/login");
  const [stats, recent] = await Promise.all([getAdminStats(), getRecentData()]);

  return (
    <div>
      <TopNav
        title="Dashboard"
        subtitle={`Welcome back, ${session.user.name?.split(" ")[0]}`}
        userName={session.user.name ?? "Admin"}
        unreadCount={stats.unread}
      />

      <div className="page-body">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          <StatCard title="Teachers"       value={stats.teachers}               icon={Users}         iconColor="text-violet-600" iconBg="bg-violet-50" />
          <StatCard title="Students"       value={stats.students}               icon={GraduationCap} iconColor="text-blue-600"   iconBg="bg-blue-50"   />
          <StatCard title="Classes"        value={stats.classes}                icon={School}        iconColor="text-teal-600"   iconBg="bg-teal-50"   />
          <StatCard title="Subjects"       value={stats.subjects}               icon={BookMarked}    iconColor="text-indigo-600" iconBg="bg-indigo-50" />
          <StatCard
            title="Fee Collection"
            value={formatCurrency(stats.paidFees)}
            subtitle={`of ${formatCurrency(stats.totalFees)}`}
            icon={Banknote}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
          />
          <StatCard title="Alerts" value={stats.unread} icon={Bell} iconColor="text-rose-600" iconBg="bg-rose-50" />
        </div>

        {/* Charts */}
        <AdminOverviewCharts feesByStatus={recent.feesByStatus} />

        {/* Fee balance panel + recent data */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3">
            <AdminFeeSummary fees={recent.outstandingFees.map(f => ({
              id:           f.id,
              studentId:    f.student.id,
              studentName:  f.student.name,
              studentCode:  f.student.studentId,
              className:    f.class.name,
              term:         f.term,
              totalAmount:  f.totalAmount,
              paidAmount:   f.paidAmount,
              status:       f.status,
              dueDate:      f.dueDate.toISOString(),
              promptCount:  f.promptCount,
            }))} />
          </div>
          <div className="xl:col-span-2 space-y-4">
            <RecentStudents students={recent.recentStudents} />
            <RecentNotifications notifications={recent.recentNotifications} />
          </div>
        </div>
      </div>
    </div>
  );
}
