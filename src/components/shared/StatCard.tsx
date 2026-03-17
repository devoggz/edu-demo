import type { ElementType } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ElementType;
  iconColor: string;
  iconBg: string;
  trend?: { value: number; label: string };
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor, iconBg, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${trend.value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <p className="text-xl sm:text-2xl font-bold tracking-tight" style={{ color: "hsl(var(--foreground))" }}>
        {value}
      </p>
      {subtitle && (
        <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{subtitle}</p>
      )}
      <p className="text-xs mt-1 font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>{title}</p>
      {trend && (
        <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>{trend.label}</p>
      )}
    </div>
  );
}
