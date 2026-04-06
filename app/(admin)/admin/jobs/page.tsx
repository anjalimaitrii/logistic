"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateJobModal from "@/components/admin/CreateJobModal";

export default function AdminJobs() {
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
    { id: "#FL-2838", client: "Total Energies", status: "Loading", driver: "Oluwaseun P.", route: "P.Harcourt → Enu.", type: "warning" },
  ];

  const columns = [
    { label: "Job ID", key: "id", render: (val: string) => <span className="font-bold text-primary">{val}</span> },
    { label: "Client", key: "client", render: (val: string) => <span className="font-bold text-[#0F172A]">{val}</span> },
    {
      label: "Status",
      key: "status",
      render: (val: string, row: any) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            row.type === "transit"
              ? "bg-primary/10 text-primary"
              : row.type === "success"
              ? "bg-[#ECFDF5] text-[#10B981]"
              : row.type === "warning"
              ? "bg-amber-50 text-amber-500"
              : "bg-rose-50 text-rose-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.type === "transit" ? "bg-primary animate-pulse" : row.type === "success" ? "bg-[#10B981]" : row.type === "warning" ? "bg-amber-500" : "bg-rose-500"
            }`}
          />
          {val}
        </span>
      ),
    },
    { label: "Driver", key: "driver" },
    { label: "Route", key: "route" },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 hover:text-primary hover:bg-primary-light transition-all">
            👁
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 hover:text-primary hover:bg-primary-light transition-all">
            ✏️
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
           <div>
              <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 mb-1.5 font-bold uppercase tracking-widest">
                 <span>FleetTrack</span>
                 <span>›</span>
                 <span className="text-primary">Jobs</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Job Management</h1>
              <p className="text-[12px] text-neutral-500 mt-0.5">Manage and track your logistics operations in real-time.</p>
           </div>
           <button 
              className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
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
          title="Active Jobs" 
          icon="📦" 
          columns={columns} 
          data={jobsData} 
          onRowClick={(row) => console.log(row)}
          action={
            <div className="flex gap-2">
               <input
                  type="text"
                  placeholder="Search jobs..."
                  className="bg-white border border-neutral-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:border-primary transition-all w-48 shadow-inner"
               />
               <select className="bg-white border border-neutral-100 text-[10px] font-bold text-neutral-400 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary transition-all uppercase tracking-widest cursor-pointer shadow-sm">
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
