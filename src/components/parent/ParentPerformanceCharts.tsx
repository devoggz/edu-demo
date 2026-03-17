"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

interface ChartItem {
  subject: string;
  score: number;
  grade: string;
}

export function ParentPerformanceCharts({ chartData }: { chartData: ChartItem[] }) {
  if (chartData.length === 0) return null;

  const getBarColor = (score: number) => {
    if (score >= 75) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div className="card card-body">
      <h4 className="font-semibold text-slate-700 mb-4 text-sm">Performance by Subject</h4>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} barSize={28}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <ReferenceLine y={75} stroke="#10b981" strokeDasharray="4 4" strokeWidth={1.5} />
          <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1.5} />
          <Tooltip
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }}
            formatter={(v, n, p) => [`${v}% (${p.payload.grade})`, "Score"]}
          />
          <Bar
            dataKey="score"
            radius={[6, 6, 0, 0]}
            fill="#3b82f6"
            label={false}
            // Color each bar individually
            isAnimationActive={true}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-2 justify-end">
        {[
          { color: "#10b981", label: "Pass (75%+)" },
          { color: "#f59e0b", label: "Average (50%+)" },
          { color: "#ef4444", label: "Below average" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: l.color }} />
            <span className="text-xs text-slate-500">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
