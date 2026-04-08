"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateJobModal from "@/components/admin/CreateJobModal";
import { ChevronRight, Eye, Edit2 } from "lucide-react";

export default function AdminDashboard() {
   const [isCreateJobOpen, setCreateJobOpen] = useState(false);

   const kpis = [
      { label: "Total Trucks", value: "40", icon: "🚛", subText: "32 active · 6 idle", trend: "↑ 100%", variant: "primary" as const },
      { label: "Active Jobs", value: "12", icon: "📦", subText: "8 transit · 4 loading", trend: "↑ 4 today", variant: "success" as const },
      { label: "Fuel Used", value: "2,840L", icon: "⛽", subText: "₦ 3.2M total cost", trend: "↑ 12% vs yest", variant: "warning" as const },
      { label: "Payments", value: "₦4.8M", icon: "💳", subText: "7 invoices pending", trend: "↓ 2 cleared", variant: "danger" as const },
   ];

   const recentJobs = [
      { id: "#FL-2851", status: "In Transit", driver: "Adaeze O.", route: "Lagos → Abuja", eta: "14:30", type: "transit" },
      { id: "#FL-2847", status: "Delivered", driver: "Kwame M.", route: "Nairobi → Mom.", eta: "Done", type: "success" },
      { id: "#FL-2843", status: "Delayed", driver: "Fatima O.", route: "Cairo → Alex.", eta: "+2h", type: "danger" },
   ];

   const columns = [
      { label: "Job ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
      {
         label: "Status",
         key: "status",
         render: (val: string, row: any) => (
            <span
               className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${row.type === "transit"
                  ? "bg-primary/10 text-primary"
                  : row.type === "success"
                     ? "bg-emerald-50 text-emerald-600"
                     : "bg-rose-50 text-rose-500"
                  }`}
            >
               <span
                  className={`w-1 h-1 rounded-full ${row.type === "transit" ? "bg-primary animate-pulse" : row.type === "success" ? "bg-emerald-500" : "bg-rose-500"
                     }`}
               />
               {val}
            </span>
         ),
      },
      { label: "Driver", key: "driver", render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
      { label: "Route", key: "route", render: (val: string) => <span className="text-neutral-500">{val}</span> },
      { label: "ETA", key: "eta", render: (val: string) => <span className="font-semibold text-slate-900">{val}</span> },
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
                  <Edit2 className="w-3.5 h-3.5" />
               </button>
            </div>
         ),
      },
   ];

   const handleCreateJob = (data: any) => {
      alert("Job created successfully!");
      setCreateJobOpen(false);
   };


   return (
      <AdminLayout>
         <div className="p-4 md:p-6 pb-20 space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div>
               <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
                  <span>FleetTrack</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                  <span className="text-primary">Dashboard</span>
               </div>
               <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Fleet Overview</h1>
               <p className="text-[11px] text-neutral-400 mt-0.5">April 2026 · Global Logistics Hub · 40 trucks active</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {kpis.map((kpi, i) => (
                  <StatCard key={i} {...kpi} />
               ))}
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
               {/* Map View */}
               <div className="xl:col-span-2 bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                     <div className="text-[13px] font-semibold flex items-center gap-2.5 text-slate-900">
                        <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs">🗺</span>
                        Live Fleet Location
                        <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-medium rounded-full uppercase tracking-widest border border-emerald-100">
                           <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                           Live
                        </span>
                     </div>
                     <button className="bg-white p-2 rounded-xl border border-neutral-100 text-neutral-400 hover:text-emerald-600 transition-all shadow-sm">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                           <polyline points="23 4 23 10 17 10" />
                           <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                     </button>
                  </div>
                  <div className="h-[280px] bg-neutral-50 relative overflow-hidden">
                     <img 
                        src="/images/fleet-map.png" 
                        alt="Fleet Map" 
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                     />
                     <div className="absolute inset-0 bg-linear-to-t from-white/20 to-transparent"></div>
                     <div className="absolute top-[40%] left-[30%] w-5 h-5 bg-emerald-500 rounded-lg rotate-45 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-125 transition-transform z-10"></div>
                     <div className="absolute top-[25%] left-[60%] w-5 h-5 bg-emerald-500 rounded-lg rotate-45 border-2 border-white shadow-lg flex items-center justify-center cursor-pointer hover:scale-125 transition-transform z-10"></div>
                     <div className="absolute top-4 left-4 bg-white/90 border border-neutral-100 rounded-xl p-3 backdrop-blur-md shadow-lg space-y-1.5 z-20">
                        <div className="text-[9px] text-emerald-600 font-medium uppercase tracking-widest flex items-center gap-2 text-nowrap">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 28 In Transit
                        </div>
                        <div className="text-[9px] text-amber-500 font-medium uppercase tracking-widest flex items-center gap-2 text-nowrap">
                           <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 8 Idle
                        </div>
                     </div>
                  </div>
               </div>

               {/* Status Breakdown */}
               <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm flex flex-col">
                  <div className="p-4 border-b border-neutral-100">
                     <div className="text-[13px] font-semibold text-slate-900 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs">🚛</span>
                        Fleet Status
                     </div>
                  </div>
                  <div className="p-5 flex items-center gap-5 flex-1">
                     <div className="w-16 h-16 rounded-full border-[6px] border-neutral-50 border-t-primary border-r-amber-400 flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-semibold text-slate-900">40</span>
                        <span className="text-[7px] font-medium text-neutral-400 uppercase">Total</span>
                     </div>
                     <div className="flex-1 space-y-3">
                        <div className="space-y-1">
                           <div className="flex justify-between text-[9px] font-medium uppercase text-neutral-400">
                              <span>Active</span>
                              <span className="text-slate-900 font-semibold">32</span>
                           </div>
                           <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500 w-[80%] rounded-full" />
                           </div>
                        </div>
                        <div className="space-y-1">
                           <div className="flex justify-between text-[9px] font-medium uppercase text-neutral-400">
                              <span>Maint.</span>
                              <span className="text-slate-900 font-semibold">2</span>
                           </div>
                           <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 w-[5%] rounded-full" />
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="p-2 border-t border-neutral-50 space-y-0.5">
                     <div className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-xl transition-all cursor-pointer group">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-xs text-emerald-600">🏃</div>
                        <div className="flex-1 min-w-0">
                           <div className="text-[12px] font-semibold text-slate-900">In Transit</div>
                           <div className="text-[10px] font-medium text-neutral-400">12 routes active</div>
                        </div>
                        <div className="text-sm font-semibold text-emerald-600">28</div>
                     </div>
                  </div>
               </div>
            </div>




            <div className="flex flex-wrap gap-2.5">

               <button className="bg-white border border-neutral-100 text-neutral-500 px-5 py-2 rounded-lg font-semibold text-[10px] uppercase tracking-widest hover:bg-neutral-50 transition-all shadow-sm">
                  🚛 Dispatch Truck
               </button>
               <button className="bg-white border border-neutral-100 text-neutral-500 px-5 py-2 rounded-lg font-semibold text-[10px] uppercase tracking-widest hover:bg-neutral-50 transition-all shadow-sm">
                  ⛽ Log Fuel
               </button>
            </div>

            {/* Table */}
            <CommonTable
               title="Recent Operations"
               icon="📋"
               columns={columns}
               data={recentJobs}
               onRowClick={(row) => console.log(row)}
               action={
                  <select className="bg-white border border-neutral-100 text-[10px] font-bold text-neutral-400 rounded-lg px-2.5 py-1.5 outline-none focus:border-primary transition-all uppercase tracking-widest cursor-pointer">
                     <option>All Jobs</option>
                     <option>In Transit</option>
                  </select>
               }
            />
         </div >

         <CreateJobModal
            isOpen={isCreateJobOpen}
            onClose={() => setCreateJobOpen(false)}
            onSubmit={handleCreateJob}
         />
      </AdminLayout >
   );
}
