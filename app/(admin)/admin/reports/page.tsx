"use client";

import AdminLayout from "@/components/admin/AdminLayout";
import CommonTable from "@/components/admin/CommonTable";
import { ChevronRight, FileText, Download, Filter, Calendar, BarChart3, Clock } from "lucide-react";

export default function ReportsPage() {
  const reportStats = [
    { label: "Total Reports", value: "148", icon: "📑", subText: "Generated this year", trend: "↑ 12", variant: "primary" as const },
    { label: "Pending Data", value: "3", icon: "⌛", subText: "Active trips in queue", trend: "↓ 1", variant: "warning" as const },
  ];

  const reportCategories = [
    {
      title: "Fleet Performance",
      desc: "Uptime, distance covered, and maintenance efficiency.",
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-50",
      periodicities: ["Weekly", "Monthly"]
    },
    {
      title: "Financial Audit",
      desc: "Revenue reconciliation, expense tracking & ROI.",
      icon: <FileText className="w-5 h-5" />,
      color: "text-emerald-600 bg-emerald-50",
      periodicities: ["Monthly", "Quarterly", "Annual"]
    },
    {
      title: "Driver Compliance",
      desc: "Ratings, violations, and trip punctuality logs.",
      icon: <Clock className="w-5 h-5" />,
      color: "text-amber-600 bg-amber-50",
      periodicities: ["Daily", "Weekly"]
    },
  ];

  const recentReports = [
    { id: "REP-2026-004", name: "Monthly Fleet Audit - March", type: "Financial", date: "Apr 01, 2026", size: "2.4 MB", status: "Ready" },
    { id: "REP-2026-003", name: "Weekly Driver Performance", type: "Operations", date: "Mar 28, 2026", size: "1.1 MB", status: "Ready" },
    { id: "REP-2026-002", name: "Annual Safety Compliance", type: "Legal", date: "Mar 15, 2026", size: "5.8 MB", status: "Archived" },
  ];

  const columns = [
    { label: "Report ID", key: "id", render: (val: string) => <span className="font-mono text-[10px] text-slate-500">{val}</span> },
    { label: "Report Name", key: "name", render: (val: string) => <span className="font-semibold text-slate-900 text-[13px]">{val}</span> },
    { label: "Category", key: "type", render: (val: string) => <span className="text-neutral-400 text-[11px] font-medium">{val}</span> },
    { label: "Generated", key: "date", render: (val: string) => <span className="text-neutral-400 text-[11px]">{val}</span> },
    { label: "Size", key: "size", render: (val: string) => <span className="text-[10px] text-neutral-500">{val}</span> },
    {
      label: "Actions",
      key: "status",
      render: (val: string) => (
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-900 border border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all group">
          <Download className="w-3 h-3 transition-transform group-hover:-translate-y-0.5" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Download</span>
        </button>
      )
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 pb-20 space-y-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
              <span>FleetTrack</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary">Intelligence & Reports</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Operations Reporting</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Comprehensive data analytics and historical logs.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-white border border-neutral-200 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 uppercase tracking-wider hover:bg-neutral-50 transition-all shadow-sm">
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reportCategories.map((cat, i) => (
            <div key={i} className="bg-white border border-neutral-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${cat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <div className="flex gap-1.5">
                  {cat.periodicities.map((p, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-neutral-50 text-neutral-400 text-[8px] font-bold rounded-full border border-neutral-100 uppercase tracking-tighter">
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">{cat.title}</h3>
              <p className="text-[11px] text-neutral-400 leading-relaxed mb-4">{cat.desc}</p>

            </div>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Quick Schedule */}
          <div className="xl:col-span-1 space-y-6">
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                <h3 className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                  Scheduled Analytics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-slate-900">Weekly Operations</div>
                      <div className="text-[9px] text-neutral-400 font-medium">Every Monday at 08:00 AM</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-slate-900">Monthly P&L Audit</div>
                      <div className="text-[9px] text-neutral-400 font-medium">1st of every month</div>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-slate-900/10">
                  Configure Schedule
                </button>
              </div>
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 blur-2xl -ml-12 -mb-12" />
            </div>

          </div>

          {/* History Table */}
          <div className="xl:col-span-2">
            <CommonTable
              title="Report History"
              icon="📋"
              columns={columns}
              data={recentReports}
              action={
                <select className="bg-white border border-neutral-100 text-[9px] font-bold text-neutral-400 rounded-lg px-2.5 py-1.5 outline-none uppercase tracking-widest">
                  <option>Last 30 Days</option>
                  <option>Year 2026</option>
                  <option>Archived</option>
                </select>
              }
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
