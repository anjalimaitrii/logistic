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
    <div className="bg-white border border-neutral-100 rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all shadow-sm hover:shadow-xl hover:shadow-[#0F172A]/5">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${bgColorMap[variant]}`}>
          {icon}
        </div>
        <div className={`text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-widest ${trendColor}`}>
          {trend}
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight text-[#0F172A]">{value}</div>
      <div className="text-[12px] font-bold text-neutral-400 mt-1 uppercase tracking-wider">{label}</div>
      <div className="text-[11px] font-medium text-neutral-500 mt-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
        {subText}
      </div>
    </div>
  );
}
