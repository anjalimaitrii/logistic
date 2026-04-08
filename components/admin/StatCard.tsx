"use client";

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  subText: string;
  trend: string;
  variant?: "primary" | "success" | "warning" | "danger";
}

export default function StatCard({ label, value, icon, subText, trend, variant = "primary" }: StatCardProps) {
  const bgColorMap = {
    primary: "bg-primary-light",
    success: "bg-[#ECFDF5]",
    warning: "bg-amber-50",
    danger: "bg-rose-50",
  };

  const trendColorMap = {
    success: "text-[#10B981] bg-[rgba(16,185,129,0.1)]",
    danger: "text-rose-500 bg-rose-50",
    primary: "text-primary bg-primary/10",
    warning: "text-amber-500 bg-amber-50",
  };

  const trendColor = trend.includes("↑") ? trendColorMap.success : trendColorMap.danger;

  return (
    <div className="bg-white border border-neutral-100 rounded-2xl p-4 relative overflow-hidden group hover:shadow-md transition-all shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg shadow-inner ${bgColorMap[variant]}`}>
          {icon}
        </div>
        <div className={`text-[9px] font-medium px-2 py-0.5 rounded-full uppercase tracking-widest ${trendColor}`}>
          {trend}
        </div>
      </div>
      <div className="text-xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="text-[10px] font-medium text-neutral-400 mt-0.5 uppercase tracking-wider">{label}</div>
      <div className="text-[9px] font-normal text-neutral-400 mt-2 flex items-center gap-1.5 italic">
        <div className="w-1 h-1 rounded-full bg-neutral-100" />
        {subText}
      </div>
    </div>
  );
}
