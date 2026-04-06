"use client";

import React from "react";
import Link from "next/link";
import AdminLayout from "@/components/admin/AdminLayout";
import CommonTable from "@/components/admin/CommonTable";

export default function SecretJobsPage() {
   const secretJobs = [
      { id: "#SL-9921", client: "Apex Logistics", route: "Abuja → Lagos", cargo: "Electronics", weight: "2.4 Tons", date: "06 Apr 2026", tax: "Exempt" },
      { id: "#SL-9918", client: "Global Freight", route: "Accra → Kumasi", cargo: "Industrial Parts", weight: "5.8 Tons", date: "05 Apr 2026", tax: "With Tax" },
      { id: "#SL-9915", client: "Skyway Express", route: "Nairobi → Mom.", cargo: "Pharma Supplies", weight: "1.2 Tons", date: "05 Apr 2026", tax: "Exempt" },
      { id: "#SL-9912", client: "Bridge-Link", route: "Lagos → Port Har.", cargo: "Construction", weight: "12 Tons", date: "04 Apr 2026", tax: "With Tax" },
      { id: "#SL-9909", client: "Apex Logistics", route: "Kano → Abuja", cargo: "Beverages", weight: "8.5 Tons", date: "03 Apr 2026", tax: "Exempt" },
   ];

   const columns = [
      { label: "Job ID", key: "id", render: (val: string) => <span className="font-bold text-indigo-600">{val}</span> },
      { label: "Client", key: "client", render: (val: string) => <span className="font-bold text-neutral-900">{val}</span> },
      { label: "Route", key: "route" },
      { label: "Cargo", key: "cargo" },
      { label: "Weight", key: "weight" },
      { label: "Date", key: "date", render: (val: string) => <span className="text-neutral-400 font-medium">{val}</span> },
      { 
         label: "Tax Status", 
         key: "tax",
         render: (val: string) => (
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
            <div className="flex gap-2 justify-center">
               <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all shadow-sm">
                  👁
               </button>
               <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-neutral-100 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm">
                  🗑️
               </button>
            </div>
         )
      }
   ];

   return (
      <div className="p-6 pb-20 space-y-6 bg-[#F8FAFC] min-h-screen">
         {/* Breadcrumbs */}
         <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            <Link href="/admin/secret" className="hover:text-indigo-600 transition-colors">Secret Dashboard</Link>
            <span>/</span>
            <span className="text-indigo-600 font-black">Job Ledger</span>
         </div>

         <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
            <div>
               <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Master Job Ledger</h1>
               <p className="text-[12px] font-medium text-neutral-400 mt-0.5">Comprehensive history of all specialized secret operations</p>
            </div>
            <div className="flex gap-3">
               <button className="px-4 py-2 bg-neutral-50 text-neutral-500 border border-neutral-100 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-neutral-100 transition-all flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                  Export CSV
               </button>
            </div>
         </div>

         <CommonTable 
            title="All Secret Assignments"
            icon="📚"
            columns={columns}
            data={secretJobs}
            action={
               <div className="flex gap-2">
                  <select className="bg-white border border-neutral-100 text-[10px] font-bold text-neutral-400 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-600 transition-all uppercase tracking-widest cursor-pointer">
                     <option>All Status</option>
                     <option>Tax Exempt</option>
                     <option>With Tax</option>
                  </select>
               </div>
            }
         />
      </div>
   );
}
