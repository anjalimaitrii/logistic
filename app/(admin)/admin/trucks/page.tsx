"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateTruckModal from "@/components/admin/CreateTruckModal";
import { ChevronRight, Eye, Settings } from "lucide-react";

export default function AdminTrucks() {
  const [isModalOpen, setModalOpen] = useState(false);

  const kpis = [
    { label: "Total Fleet", value: "40", icon: "🚛", subText: "Active registered units", trend: "↑ 2 new", variant: "primary" as const },
    { label: "On Road", value: "32", icon: "🛣️", subText: "Currently in transit", trend: "↑ 80%", variant: "success" as const },
    { label: "Maintenance", value: "2", icon: "🔧", subText: "In workshop for repairs", trend: "↓ 1 cleared", variant: "danger" as const },
    { label: "Idle", value: "6", icon: "🅿️", subText: "Available for dispatch", trend: "↑ 1 today", variant: "warning" as const },
  ];

  const trucksData = [
    { id: "TRK-014", model: "Volvo FH16", status: "Active", fuel: "85%", odo: "12,400 km", type: "success" },
    { id: "TRK-022", model: "Mercedes Actros", status: "Active", fuel: "42%", odo: "45,210 km", type: "success" },
    { id: "TRK-018", model: "Scania R500", status: "Low Fuel", fuel: "8%", odo: "89,100 km", type: "danger" },
    { id: "TRK-007", model: "MAN TGX", status: "Idle", fuel: "95%", odo: "5,300 km", type: "warning" },
    { id: "TRK-025", model: "Daf XF", status: "Maint.", fuel: "30%", odo: "156,000 km", type: "danger" },
  ];

  const columns = [
    { label: "Truck ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
    { label: "Model", key: "model", render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
    {
      label: "Status",
      key: "status",
      render: (val: string, row: any) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${
            row.type === "success"
              ? "bg-emerald-50 text-emerald-600"
              : row.type === "warning"
              ? "bg-amber-50 text-amber-500"
              : "bg-rose-50 text-rose-500"
          }`}
        >
          <span
            className={`w-1 h-1 rounded-full ${
              row.type === "success" ? "bg-emerald-500" : row.type === "warning" ? "bg-amber-500" : "bg-rose-500"
            }`}
          />
          {val}
        </span>
      ),
    },
    { 
      label: "Fuel Level", 
      key: "fuel", 
      render: (val: string) => (
        <div className="flex items-center gap-2">
           <div className="w-12 h-1 bg-neutral-100 rounded-full overflow-hidden">
              <div className={`h-full ${parseInt(val) < 20 ? 'bg-rose-500' : 'bg-emerald-500'} rounded-full`} style={{width: val}} />
           </div>
           <span className="font-semibold text-slate-700 text-[11px]">{val}</span>
        </div>
      )
    },
    { label: "Odometer", key: "odo" },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-emerald-600 transition-all shadow-sm">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-emerald-600 transition-all shadow-sm">
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
                 <span className="hover:text-primary cursor-pointer transition-colors">Admin</span>
                 <ChevronRight className="w-2.5 h-2.5" />
                 <span className="text-primary/80">Trucks</span>
              </div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Truck Management</h1>
              <p className="text-[11px] text-neutral-400 mt-0.5">Inventory and health monitoring of all fleet units.</p>
           </div>
           <button 
              onClick={() => setModalOpen(true)}
              className="bg-slate-900 text-white px-5 py-2 rounded-lg font-semibold text-[10px] uppercase tracking-widest shadow-sm hover:brightness-110 transition-all w-fit"
           >
              ＋ Add Truck
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        <CommonTable 
          title="Fleet Inventory" 
          icon="🚛" 
          columns={columns} 
          data={trucksData} 
          onRowClick={(row) => console.log(row)}
          action={
             <div className="flex gap-2">
                <input
                   type="text"
                   placeholder="Search trucks..."
                   className="bg-white border border-neutral-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:border-primary transition-all w-48 shadow-inner"
                />
             </div>
          }
        />
      </div>

      <CreateTruckModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSubmit={() => {
          alert('Truck Added Successfully');
          setModalOpen(false);
        }} 
      />
    </AdminLayout>
  );
}
