import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: ReactNode;
  iconBg?: string;
  trend?: { value: string; up: boolean | null }; // null = neutral
  className?: string;
}

export function KpiCard({ label, value, sub, icon, iconBg = "bg-blue-50", trend, className }: KpiCardProps) {
  return (
    <div className={cn(
      "bg-white border border-slate-200 rounded-xl p-5 shadow-[0_1px_3px_rgba(0,0,0,.06)]",
      "hover:shadow-md hover:-translate-y-px transition-all duration-200",
      className
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-xl", iconBg)}>
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-full",
            trend.up === true  ? "bg-emerald-50 text-emerald-700" :
            trend.up === false ? "bg-red-50 text-red-600" :
                                 "bg-slate-100 text-slate-500"
          )}>
            {trend.up === true ? "↑" : trend.up === false ? "↓" : "→"} {trend.value}
          </span>
        )}
      </div>
      <div className="text-[28px] font-extrabold text-slate-800 leading-none">{value}</div>
      <div className="text-[13px] text-slate-500 mt-1.5">{label}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
