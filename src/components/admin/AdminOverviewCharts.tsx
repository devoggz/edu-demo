"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

interface FeeStatus {
  status: string;
  _count: { id: number };
  _sum: { totalAmount: number | null; paidAmount: number | null };
}

// Sample CBC performance data per class
const GRADE_DATA = [
  { grade: "Grade 7A", avg: 74 },
  { grade: "Grade 7B", avg: 68 },
  { grade: "Grade 8A", avg: 81 },
  { grade: "Grade 8B", avg: 63 },
];

// CBC grade bands overlay
const CBC_BANDS = [
  { name: "EE (80–100)", min: 80, color: "#10b981" },
  { name: "ME (65–79)",  min: 65, color: "#3b82f6" },
  { name: "AE (50–64)",  min: 50, color: "#f59e0b" },
  { name: "BE (0–49)",   min: 0,  color: "#ef4444" },
];

const FEE_COLORS: Record<string, string> = {
  PAID:    "#10b981",
  PENDING: "#f59e0b",
  OVERDUE: "#ef4444",
  PARTIAL: "#3b82f6",
};

function getCBCBarColor(avg: number): string {
  if (avg >= 80) return "#10b981";
  if (avg >= 65) return "#3b82f6";
  if (avg >= 50) return "#f59e0b";
  return "#ef4444";
}

function getCBCLabel(avg: number): string {
  if (avg >= 80) return "EE";
  if (avg >= 65) return "ME";
  if (avg >= 50) return "AE";
  return "BE";
}

export function AdminOverviewCharts({ feesByStatus }: { feesByStatus: FeeStatus[] }) {
  const feeChartData = feesByStatus.map((f) => ({
    name: f.status,
    count: f._count.id,
    fill: FEE_COLORS[f.status] ?? "#6b7280",
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* CBC Performance Bar Chart */}
      <div className="card card-body">
        <h3 className="font-semibold text-slate-900 mb-1">Class Average Performance</h3>
        <p className="text-xs text-slate-500 mb-1">CBC grading — EE ≥80% · ME 65–79% · AE 50–64% · BE &lt;50%</p>
        <div className="flex gap-2 mb-4">
          {CBC_BANDS.map((b) => (
            <span key={b.name} className="flex items-center gap-1 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: b.color }} />
              {b.name}
            </span>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={GRADE_DATA} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="grade" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
              formatter={(v: number) => [`${v}% (${getCBCLabel(v)})`, "Average Score"]}
            />
            <Bar
              dataKey="avg"
              radius={[6, 6, 0, 0]}
              label={{ position: "top", fontSize: 10, fill: "#64748b", formatter: (v: number) => getCBCLabel(v) }}
            >
              {GRADE_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getCBCBarColor(entry.avg)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fee Status Pie */}
      <div className="card card-body">
        <h3 className="font-semibold text-slate-900 mb-1">Fee Collection Status</h3>
        <p className="text-xs text-slate-500 mb-4">Current academic year breakdown</p>
        {feeChartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={feeChartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                dataKey="count"
                nameKey="name"
                paddingAngle={3}
              >
                {feeChartData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v) => <span style={{ fontSize: 12, color: "#64748b" }}>{v}</span>}
              />
              <Tooltip
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            No fee data available
          </div>
        )}
      </div>
    </div>
  );
}
