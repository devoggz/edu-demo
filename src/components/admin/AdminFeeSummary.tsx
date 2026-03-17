"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Loader2, CheckCircle, DollarSign, AlertCircle, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface FeeRow {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  className: string;
  term: string;
  totalAmount: number;
  paidAmount: number;
  status: string;
  dueDate: string;
  promptCount: number;
}

function PromptBtn({ feeId, initialCount }: { feeId: string; initialCount: number }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [count, setCount] = useState(initialCount);

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fees/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feeId }),
      });
      const data = await res.json() as { success?: boolean; promptCount?: number };
      if (res.ok && data.success) {
        setSent(true);
        setCount(data.promptCount ?? count + 1);
        setTimeout(() => setSent(false), 3000);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <span className="btn-sm btn-success gap-1 pointer-events-none">
        <CheckCircle className="w-3 h-3" /> Sent
      </span>
    );
  }

  return (
    <button onClick={handle} disabled={loading}
      className="btn-sm gap-1"
      style={{ background: "hsl(38 100% 96%)", color: "hsl(32 95% 44%)", border: "1px solid hsl(38 90% 85%)" }}
      title={count > 0 ? `Prompted ${count}× already` : "Send payment reminder to parent"}>
      {loading
        ? <Loader2 className="w-3 h-3 animate-spin" />
        : <><Bell className="w-3 h-3" /> Prompt{count > 0 ? ` ×${count}` : ""}</>
      }
    </button>
  );
}

function statusDot(status: string) {
  const map: Record<string, string> = {
    OVERDUE:  "bg-red-500",
    PARTIAL:  "bg-amber-500",
    PENDING:  "bg-slate-400",
  };
  return <span className={`inline-block w-2 h-2 rounded-full ${map[status] ?? "bg-slate-300"}`} />;
}

export function AdminFeeSummary({ fees }: { fees: FeeRow[] }) {
  const totalOutstanding = fees.reduce((s, f) => s + (f.totalAmount - f.paidAmount), 0);
  const overdueCount     = fees.filter(f => f.status === "OVERDUE").length;

  return (
    <div className="card">
      {/* Header */}
      <div className="card-body border-b" style={{ borderColor: "hsl(var(--border))" }}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-title flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Outstanding Fee Balances
            </p>
            <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
              {fees.length} accounts with balances
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalOutstanding)}</p>
            <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>total outstanding</p>
          </div>
        </div>

        {overdueCount > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700 dark:text-red-400 font-medium">
              {overdueCount} account{overdueCount !== 1 ? "s" : ""} overdue
            </p>
          </div>
        )}
      </div>

      {fees.length === 0 ? (
        <div className="card-body text-center py-10">
          <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-medium" style={{ color: "hsl(var(--foreground))" }}>All fees are up to date!</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "hsl(var(--border))" }}>
          {fees.map(fee => {
            const balance = fee.totalAmount - fee.paidAmount;
            const pct = Math.round((fee.paidAmount / fee.totalAmount) * 100);
            return (
              <div key={fee.id} className="px-4 sm:px-5 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {statusDot(fee.status)}
                      <Link href={`/dashboard/admin/students/${fee.studentId}`}
                        className="text-sm font-semibold hover:underline truncate"
                        style={{ color: "hsl(var(--foreground))" }}>
                        {fee.studentName}
                      </Link>
                      <span className="badge badge-slate text-[10px]">{fee.className}</span>
                      <span className={`badge text-[10px] ${fee.status === "OVERDUE" ? "badge-red" : fee.status === "PARTIAL" ? "badge-yellow" : "badge-slate"}`}>
                        {fee.status}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5 truncate" style={{ color: "hsl(var(--muted-foreground))" }}>
                      {fee.term} · {fee.studentCode}
                    </p>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${pct >= 80 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-500"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: "hsl(var(--muted-foreground))" }}>
                        {pct}%
                      </span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1.5">
                    <p className="text-sm font-bold text-red-600">-{formatCurrency(balance)}</p>
                    <PromptBtn feeId={fee.id} initialCount={fee.promptCount} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="px-4 sm:px-5 py-3 border-t" style={{ borderColor: "hsl(var(--border))" }}>
        <Link href="/dashboard/admin/fees"
          className="text-xs font-medium flex items-center gap-1 hover:underline"
          style={{ color: "hsl(var(--primary))" }}>
          View all fee records <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
