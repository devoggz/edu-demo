import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/shared/TopNav";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { formatCurrency, formatDate, getFeeStatusColor } from "@/lib/utils";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { FeePromptButton } from "@/components/admin/FeePromptButton";
import Link from "next/link";

export default async function AdminFeesPage() {
  const session = await auth();
  if (!session) redirect("/auth/login");

  const [fees, summary] = await Promise.all([
    prisma.fee.findMany({
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
      include: { student: true, class: true },
    }),
    prisma.fee.aggregate({
      _sum: { totalAmount: true, paidAmount: true },
      _count: { id: true },
    }),
  ]);

  const totalAmount  = summary._sum.totalAmount ?? 0;
  const paidAmount   = summary._sum.paidAmount  ?? 0;
  const outstanding  = totalAmount - paidAmount;
  const collectionPct = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  const overdueCount = fees.filter(f => f.status === "OVERDUE").length;

  return (
    <div>
      <TopNav title="Fee Management" subtitle="Track and manage student fees" userName={session.user.name ?? ""} />
      <div className="page-body">

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Expected",   value: formatCurrency(totalAmount),  color: "text-slate-700 dark:text-slate-200",  icon: DollarSign,    iconCls: "text-blue-500",    bg: "" },
            { label: "Collected",        value: formatCurrency(paidAmount),   color: "text-emerald-700 dark:text-emerald-400", icon: CheckCircle, iconCls: "text-emerald-500", bg: "" },
            { label: "Outstanding",      value: formatCurrency(outstanding),  color: "text-red-700 dark:text-red-400",       icon: AlertCircle,   iconCls: "text-red-500",     bg: "" },
            { label: "Collection Rate",  value: `${collectionPct}%`,          color: collectionPct >= 70 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700", icon: TrendingUp, iconCls: "text-indigo-500", bg: "" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="flex items-center justify-between mb-3">
                <s.icon className={`w-5 h-5 ${s.iconCls}`} />
              </div>
              <p className={`text-xl sm:text-2xl font-bold tracking-tight ${s.color}`}>{s.value}</p>
              <p className="text-xs mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Collection progress */}
        <div className="card card-body">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-semibold" style={{ color: "hsl(var(--foreground))" }}>
              Overall Fee Collection Progress
            </span>
            <span className="font-bold" style={{ color: "hsl(var(--foreground))" }}>{collectionPct}%</span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "hsl(var(--muted))" }}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${collectionPct >= 80 ? "bg-emerald-500" : collectionPct >= 50 ? "bg-amber-500" : "bg-red-500"}`}
              style={{ width: `${collectionPct}%` }}
            />
          </div>
          {overdueCount > 0 && (
            <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {overdueCount} fee record{overdueCount !== 1 ? "s" : ""} are overdue — use the Prompt button to notify parents
            </p>
          )}
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b flex items-center justify-between" style={{ borderColor: "hsl(var(--border))" }}>
            <p className="section-title">All Fee Records ({fees.length})</p>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Term</th>
                  <th>Total</th>
                  <th>Paid</th>
                  <th>Balance</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {fees.map(fee => {
                  const balance = fee.totalAmount - fee.paidAmount;
                  return (
                    <tr key={fee.id}>
                      <td>
                        <Link href={`/dashboard/admin/students/${fee.student.id}`}
                          className="font-semibold hover:underline" style={{ color: "hsl(var(--foreground))" }}>
                          {fee.student.name}
                        </Link>
                      </td>
                      <td><span className="badge badge-slate">{fee.class.name}</span></td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{fee.term} {fee.academicYear}</td>
                      <td className="font-medium" style={{ color: "hsl(var(--foreground))" }}>{formatCurrency(fee.totalAmount)}</td>
                      <td className="text-emerald-600 font-medium">{formatCurrency(fee.paidAmount)}</td>
                      <td className={`font-semibold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                        {formatCurrency(balance)}
                      </td>
                      <td style={{ color: "hsl(var(--muted-foreground))" }}>{formatDate(fee.dueDate)}</td>
                      <td>
                        <span className={`badge ${getFeeStatusColor(fee.status)}`}>{fee.status}</span>
                      </td>
                      <td>
                        {balance > 0 && (
                          <FeePromptButton feeId={fee.id} balance={balance} promptCount={fee.promptCount} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {fees.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center">
              <DollarSign className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm" style={{ color: "hsl(var(--muted-foreground))" }}>No fee records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
