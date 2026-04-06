"use client";

import React, { useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateSecretJobModal from "@/components/admin/CreateSecretJobModal";

export default function AdminSecretDashboard() {
   const [isCreateModalOpen, setCreateModalOpen] = useState(false);

   const specialKpis = [
      { label: "Total Secret Jobs", value: "24", icon: "💎", subText: "Special assignments", trend: "↑ 2 today", variant: "primary" as const },
      { label: "Tax-Exempt Vol.", value: "₦1.8M", icon: "📉", subText: "-18.5% total rev", trend: "↓ 4% vs last", variant: "warning" as const },
      { label: "Elite Partners", value: "12", icon: "🎩", subText: "Non-Taxable Entities", trend: "Steady", variant: "success" as const },
      { label: "Master Ledger", value: "v4.2", icon: "🛡️", subText: "Active protocol", trend: "Secure", variant: "danger" as const },
   ];

   const secretJobs = [
      { id: "#SL-9921", client: "Apex Logistics", route: "Abuja → Lagos", tax: "Exempt", type: "warning" },
      { id: "#SL-9918", client: "Global Freight", route: "Accra → Kumasi", tax: "With Tax", type: "primary" },
      { id: "#SL-9915", client: "Skyway Express", route: "Nairobi → Mom.", tax: "Exempt", type: "warning" },
   ];

   const columns = [
      { label: "Job ID", key: "id", render: (val: string) => <span className="font-bold text-indigo-600">{val}</span> },
      { label: "Client", key: "client", render: (val: string) => <span className="font-bold text-neutral-900">{val}</span> },
      { label: "Route", key: "route" },
      { 
         label: "Tax Status", 
         key: "tax",
         render: (val: string, row: any) => (
            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
               val === 'Exempt' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
            }`}>
               {val}
            </span>
         )
      },
      {
         label: "Actions",
         key: "actions",
         align: "center" as const,
         render: () => (
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
               👁
            </button>
         )
      }
   ];

   const handleCreateJob = (data: any) => {
      alert(`Special job created! Tax Status: ${data.withTax ? 'With Tax' : 'Exempt'}`);
      setCreateModalOpen(false);
   };

   return (
      <div className="p-6 pb-20 space-y-8 bg-[#F8FAFC] min-h-screen">
         {/* Header with Secret Flavor */}
         <div className="flex items-center justify-between font-sans">
            <div>
               <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  Special Ledger Protocol
               </div>
               <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Secret Dashboard</h1>
               <p className="text-[12px] font-medium text-neutral-400 mt-1 uppercase tracking-widest">Master Admin Level Access Required</p>
            </div>

            <div className="flex gap-2">
               <button 
                 onClick={() => setCreateModalOpen(true)}
                 className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:-translate-y-0.5 transition-all active:scale-95"
               >
                  ＋ Create Special Job
               </button>
            </div>
         </div>

         {/* Secret KPIs */}
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {specialKpis.map((kpi, i) => (
               <StatCard key={i} {...kpi} />
            ))}
         </div>

         {/* Main Content Area */}
         <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
               <CommonTable 
                  title="Recent Special Operations"
                  icon="🔐"
                  columns={columns}
                  data={secretJobs}
                  action={
                     <Link 
                        href="/admin/secret/jobs" 
                        className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest"
                     >
                        View Full Ledger
                     </Link>
                  }
               />
            </div>

            <div className="space-y-4">
               <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-neutral-900 mb-4">Master Controls</h3>
                  <div className="space-y-2">
                     <button className="w-full text-left p-3 rounded-xl border border-neutral-50 hover:bg-neutral-50 transition-all flex items-center gap-3">
                        <span className="text-lg">📊</span>
                        <div className="flex-1">
                           <div className="text-[11px] font-bold text-neutral-900">Tax Exemption Audit</div>
                           <div className="text-[9px] text-neutral-400 font-medium">Verify non-taxable entity certificates</div>
                        </div>
                     </button>
                     <button className="w-full text-left p-3 rounded-xl border border-neutral-50 hover:bg-neutral-50 transition-all flex items-center gap-3">
                        <span className="text-lg">📤</span>
                        <div className="flex-1">
                           <div className="text-[11px] font-bold text-neutral-900">Export Encrypted Log</div>
                           <div className="text-[9px] text-neutral-400 font-medium">Generate PGP-signed CSV</div>
                        </div>
                     </button>
                  </div>
               </div>

               <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                     <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">System Health</div>
                     <div className="text-xl font-bold mb-3">All Protocols Secure</div>
                     <div className="h-1 bg-white/20 rounded-full mb-4">
                        <div className="w-[92%] h-full bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,1)]" />
                     </div>
                     <button className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all uppercase tracking-widest">Check Services</button>
                  </div>
               </div>
            </div>
         </div>

         <CreateSecretJobModal 
            isOpen={isCreateModalOpen}
            onClose={() => setCreateModalOpen(false)}
            onSubmit={handleCreateJob}
         />
      </div>
   );
}
