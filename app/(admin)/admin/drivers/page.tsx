"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateDriverModal from "@/components/admin/CreateDriverModal";

export default function AdminDrivers() {
  const [isModalOpen, setModalOpen] = useState(false);

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
    { label: "Driver ID", key: "id", render: (val: string) => <span className="font-bold text-primary">{val}</span> },
    { label: "Full Name", key: "name", render: (val: string) => (
       <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-neutral-100 flex items-center justify-center font-bold text-[10px] text-neutral-400">
             {val.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="font-bold text-[#0F172A]">{val}</span>
       </div>
    )},
    {
      label: "Status",
      key: "status",
      render: (val: string, row: any) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
            row.type === "success"
              ? "bg-[#ECFDF5] text-[#10B981]"
              : row.type === "warning"
              ? "bg-amber-50 text-amber-500"
              : "bg-rose-50 text-rose-500"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              row.type === "success" ? "bg-[#10B981]" : row.type === "warning" ? "bg-amber-500" : "bg-rose-500"
            }`}
          />
          {val}
        </span>
      ),
    },
    { label: "Assigned Truck", key: "truck", render: (val: string) => <span className="font-bold">{val}</span> },
    { label: "Contact", key: "contact", render: (val: string) => <span className="text-neutral-500">{val}</span> },
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
            📞
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
                 <span className="text-primary">Drivers</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Driver Management</h1>
              <p className="text-[12px] text-neutral-500 mt-0.5">Oversee driver performance, assignments and compliance.</p>
           </div>
           <button 
              onClick={() => setModalOpen(true)}
              className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
           >
              ＋ Add Driver
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
          onRowClick={(row) => console.log(row)}
          action={
             <div className="flex gap-2">
                <input
                   type="text"
                   placeholder="Search drivers..."
                   className="bg-white border border-neutral-100 rounded-lg px-3 py-1.5 text-[10px] font-bold outline-none focus:border-primary transition-all w-48 shadow-inner"
                />
             </div>
          }
        />
      </div>

      <CreateDriverModal 
        isOpen={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        onSubmit={() => {
          alert('Driver Added Successfully');
          setModalOpen(false);
        }} 
      />
    </AdminLayout>
  );
}
