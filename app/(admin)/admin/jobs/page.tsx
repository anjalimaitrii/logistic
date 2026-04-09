"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateJobModal from "@/components/admin/CreateJobModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Eye, Edit2 } from "lucide-react";

export default function AdminJobs() {
  const router = useRouter();
  const [isCreateJobOpen, setCreateJobOpen] = useState(false);

  const kpis = [
    { label: "Active Jobs", value: "12", icon: "📦", subText: "8 transit · 4 loading", trend: "↑ 4 today", variant: "primary" as const },
    { label: "Delayed Jobs", value: "3", icon: "⚠️", subText: "2 mechanical · 1 traffic", trend: "↑ 1 new", variant: "danger" as const },
    { label: "Completed", value: "248", icon: "✅", subText: "Last 30 days summary", trend: "↑ 12%", variant: "success" as const },
    { label: "Pending OTP", value: "5", icon: "🔐", subText: "Awaiting driver verify", trend: "↑ 2 today", variant: "warning" as const },
  ];

  const jobsData = [
    { id: "#FL-2851", client: "Dangote Cement", status: "In Transit", driver: "Adaeze O.", route: "Lagos → Abuja", type: "transit" },
    { id: "#FL-2847", client: "Coca Cola Co.", status: "Delivered", driver: "Kwame M.", route: "Nairobi → Mom.", type: "success" },
    { id: "#FL-2843", client: "Indomie Food", status: "Delayed", driver: "Fatima O.", route: "Cairo → Alex.", type: "danger" },
    { id: "#FL-2840", client: "Lafarge Holcim", status: "In Transit", driver: "John B.", route: "Accra → Kumasi", type: "transit" },
    { id: "#FL-2838", client: "Total Energies", status: "Returned to Warehouse", driver: "Oluwaseun P.", route: "P.Harcourt → Enu.", type: "warehouse" },
  ];

  const columns = [
    { label: "Job ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
    { label: "Client", key: "client", render: (val: string) => <span className="font-medium text-slate-800">{val}</span> },
    {
      label: "Status",
      key: "status",
      render: (val: string, row: any) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${row.type === "transit"
            ? "bg-primary/10 text-primary"
            : row.type === "success"
              ? "bg-emerald-50 text-emerald-600"
              : row.type === "warning"
                ? "bg-amber-50 text-amber-500"
                : row.type === "warehouse"
                  ? "bg-indigo-50 text-indigo-600"
                  : "bg-rose-50 text-rose-500"
            }`}
        >
          <span
            className={`w-1 h-1 rounded-full ${row.type === "transit" ? "bg-primary animate-pulse" : row.type === "success" ? "bg-emerald-500" : row.type === "warning" ? "bg-amber-500" : row.type === "warehouse" ? "bg-indigo-500" : "bg-rose-500"
              }`}
          />
          {val}
        </span>
      ),
    },
    { label: "Driver", key: "driver", render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    { label: "Route", key: "route", render: (val: string) => <span className="text-neutral-500 italic">{val}</span> },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <Link href={`/admin/jobs/${row.id.replace('#', '')}`} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-emerald-600 transition-all shadow-sm">
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-emerald-600 transition-all shadow-sm">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
              <span>FleetTrack</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary">Jobs</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Job Management</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Manage and track your logistics operations in real-time.</p>
          </div>
          <button
            className="bg-slate-900 text-white px-5 py-2 rounded-lg font-semibold text-[10px] uppercase tracking-widest shadow-sm hover:brightness-110 transition-all w-fit"
            onClick={() => setCreateJobOpen(true)}
          >
            ＋ New Job
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        <CommonTable
          title="Active Trips"
          icon="📦"
          columns={columns}
          data={jobsData}
          onRowClick={(row) => router.push(`/admin/jobs/${row.id.replace('#', '')}`)}
          action={
            <div className="flex gap-1">
              <input
                type="text"
                placeholder="Search jobs..."
                className="bg-white border border-neutral-100 rounded-lg px-3 py-1.5 text-[10px] font-medium outline-none focus:border-primary transition-all w-30 shadow-inner"
              />
              <select className="bg-white border border-neutral-100 rounded-lg px-3 py-1.5 text-[10px] font-medium outline-none focus:border-primary transition-all w-30 shadow-inner text-neutral-400">
                <option>Sort By: Newest</option>
                <option>Oldest</option>
              </select>
            </div>
          }
        />
      </div>

      <CreateJobModal
        isOpen={isCreateJobOpen}
        onClose={() => setCreateJobOpen(false)}
        onSubmit={() => setCreateJobOpen(false)}
      />
    </AdminLayout>
  );
}
