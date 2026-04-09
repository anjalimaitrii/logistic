"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import { ChevronRight, CreditCard, ArrowUpRight, ArrowDownRight, DollarSign } from "lucide-react";

export default function FinancePage() {
  const financeKpis = [
    { label: "Total Revenue", value: "₦12.4M", icon: "💰", subText: "Collected this month", trend: "↑ 12.5%", variant: "success" as const },
    { label: "Total Expenses", value: "₦4.8M", icon: "📉", subText: "Fuel, repairs & roles", trend: "↑ 5.2%", variant: "danger" as const },
    { label: "Net Profit", value: "₦7.6M", icon: "📊", subText: "Estimated margin: 61%", trend: "↑ 8.4%", variant: "primary" as const },
    { label: "Pending Payouts", value: "₦1.2M", icon: "🕒", subText: "4 invoices awaiting", trend: "↓ 2.1%", variant: "warning" as const },
  ];

  const transactions = [
    { id: "TX-9021", category: "Fuel", amount: "₦450,000", status: "Completed", date: "Apr 08, 2026", method: "Fleet Card" },
    { id: "TX-9018", category: "Maintenance", amount: "₦120,500", status: "Pending", date: "Apr 07, 2026", method: "Direct Bank" },
    { id: "TX-8995", category: "Driver Salary", amount: "₦85,000", status: "Completed", date: "Apr 05, 2026", method: "Wallet Payout" },
    { id: "TX-8982", category: "Permits", amount: "₦45,000", status: "Failed", date: "Apr 04, 2026", method: "Online Pay" },
    { id: "TX-8981", category: "Fuel", amount: "₦41,000", status: "Completed", date: "Apr 04, 2026", method: "Online Pay" },
  ];

  const columns = [
    { label: "Transaction ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
    { label: "Category", key: "category", render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    { label: "Amount", key: "amount", render: (val: string) => <span className="font-bold text-slate-900">{val}</span> },
    {
      label: "Status",
      key: "status",
      render: (val: string) => (
        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${val === "Completed" ? "bg-emerald-50 text-emerald-600" :
          val === "Pending" ? "bg-amber-50 text-amber-600" :
            "bg-rose-50 text-rose-500"
          }`}>
          {val}
        </span>
      )
    },
    { label: "Date", key: "date", render: (val: string) => <span className="text-neutral-400">{val}</span> },
    { label: "Method", key: "method", render: (val: string) => <span className="text-[10px] font-medium text-slate-500">{val}</span> },
  ];

  // Custom SVG Pie Chart Data
  const chartData = [
    { label: "Fuel", value: 45, color: "#FF6B00" }, // primary
    { label: "Repairs", value: 25, color: "#10B981" }, // emerald
    { label: "Salaries", value: 20, color: "#F59E0B" }, // amber
    { label: "Others", value: 10, color: "#6366F1" }, // indigo
  ];

  // Calculate SVG Pie Chart segments
  let cumulativeValue = 0;
  const pieSegments = chartData.map((item) => {
    const startAngle = (cumulativeValue / 100) * 360;
    cumulativeValue += item.value;
    const endAngle = (cumulativeValue / 100) * 360;

    // For simplicity in SVG, we use stroke-dasharray/offset approach for a ring chart
    return { ...item, startAngle, endAngle };
  });

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 pb-20 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
              <span>FleetTrack</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary">Finance Control</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Financial Insights</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Active monitoring of cash flow and operational costs.</p>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {financeKpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Custom SVG Pie Chart Card */}
          <div className="lg:col-span-1 bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs">🥧</span>
                Expense Breakdown
              </h3>
              <select className="text-[10px] font-bold text-neutral-400 bg-transparent outline-none">
                <option>Monthly</option>
                <option>Weekly</option>
              </select>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-4">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  {chartData.map((item, index) => {
                    const radius = 15.91549430918954;
                    const circumference = 2 * Math.PI * radius;
                    let offset = 0;
                    for (let i = 0; i < index; i++) {
                      offset += chartData[i].value;
                    }
                    return (
                      <circle
                        key={index}
                        cx="18"
                        cy="18"
                        r={radius}
                        fill="transparent"
                        stroke={item.color}
                        strokeWidth="4"
                        strokeDasharray={`${item.value} ${100 - item.value}`}
                        strokeDashoffset={-offset}
                        className="transition-all duration-1000 ease-out hover:strokeWidth-[5] cursor-pointer"
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">₦4.8M</span>
                  <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">Total cost</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-8 w-full">
                {chartData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <div className="flex flex-col">
                      <span className="text-[11px] font-semibold text-slate-800">{item.label}</span>
                      <span className="text-[9px] font-medium text-neutral-400">{item.value}% cost share</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Transactions Table Area */}
          <div className="lg:col-span-2">
            <CommonTable
              title="Recent Transactions"
              icon="💳"
              columns={columns}
              data={transactions}
              onRowClick={(row) => console.log(row)}
              action={
                <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest">
                  View Statements
                </button>
              }
            />
          </div>
        </div>


      </div>
    </AdminLayout>
  );
}
