"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateDriverModal from "@/components/admin/CreateDriverModal";
import { ChevronRight, Eye, Phone, Plus } from "lucide-react";

export default function AdminDrivers() {
  const [isModalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const kpis = [
    { label: "Total Drivers", value: "48", icon: "👤", subText: "Active on roster", trend: "↑ 4 new", variant: "primary" as const },
    { label: "On Duty", value: "32", icon: "🛣️", subText: "Currently driving", trend: "↑ 66%", variant: "success" as const },
    { label: "Off Duty", value: "14", icon: "🏠", subText: "Resting / Available", trend: "↓ 2 today", variant: "warning" as const },
    { label: "License Alert", value: "2", icon: "⚠️", subText: "Expiring within 7 days", trend: "↑ 1 new", variant: "danger" as const },
  ];

  const driversData = [
    { id: "DRV-102", name: "Adaeze Okafor", status: "Active", truck: "TRK-014", contact: "+234 803 123 4567", type: "success" },
    { id: "DRV-088", name: "Kwame Mensah", status: "Active", truck: "TRK-022", contact: "+233 24 555 1234", type: "success" },
    { id: "DRV-115", name: "Fatima Osman", status: "Resting", truck: "TRK-018", contact: "+20 10 9876 5432", type: "warning" },
    { id: "DRV-092", name: "Bongani Nkosi", status: "License Exp.", truck: "N/A", contact: "+27 82 444 7777", type: "danger" },
    { id: "DRV-105", name: "Oluwaseun P.", status: "Active", truck: "TRK-038", contact: "+234 812 345 6789", type: "success" },
  ];

  const columns = [
    { label: "Driver ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
    { label: "Full Name", key: "name", render: (val: string) => (
      <div className="flex items-center gap-2.5 text-nowrap">
         <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center font-semibold text-[10px] text-neutral-400">
            {val.split(' ').map(n => n[0]).join('')}
         </div>
         <span className="font-semibold text-neutral-900">{val}</span>
      </div>
    )},
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
    { label: "Assigned Truck", key: "truck", render: (val: string) => <span className="font-semibold text-slate-700">{val}</span> },
    { label: "Contact", key: "contact", render: (val: string) => <span className="text-neutral-500">{val}</span> },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (val: any, row: any) => (
        <div className="flex gap-2 justify-center">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/drivers/${row.id}`);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-primary transition-all shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-emerald-600 transition-all shadow-sm">
            <Phone className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 pb-20 space-y-8 bg-neutral-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">
                 <span className="hover:text-primary cursor-pointer transition-colors">Operations</span>
                 <ChevronRight className="w-2.5 h-2.5" />
                 <span className="text-primary/80">Drivers Directory</span>
              </div>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Manage Personnel</h1>
              <p className="text-[11px] text-neutral-400 mt-0.5">Oversee driver performance, assignments and compliance.</p>
           </div>
           <button 
              onClick={() => setModalOpen(true)}
              className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:brightness-110 transition-all w-fit flex items-center gap-2"
           >
              <div className="p-0.5 rounded-md bg-white/20">
                <Plus className="w-3 h-3" />
              </div>
              Add New Driver
           </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        <CommonTable 
          title="Staff Directory" 
          icon="👥" 
          columns={columns} 
          data={driversData} 
          onRowClick={(row) => router.push(`/admin/drivers/${row.id}`)}
          action={
             <div className="flex gap-2">
                <div className="relative group">
                   <input
                      type="text"
                      placeholder="Search drivers..."
                      className="bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[11px] font-medium outline-none focus:border-primary/20 transition-all w-56 shadow-sm"
                   />
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within:text-primary transition-colors">
                      🔍
                   </div>
                </div>
             </div>
          }
        />
      </div>

      <CreateDriverModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSubmit={(data) => {
          console.log("Driver Added:", data);
          setModalOpen(false);
        }} 
      />
    </AdminLayout>
  );
}
