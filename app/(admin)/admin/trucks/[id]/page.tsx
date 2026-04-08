"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import {
   ChevronRight,
   ArrowLeft,
   Calendar,
   MapPin,
   User,
   Gauge,
   Fuel,
   Activity,
   Navigation
} from "lucide-react";

export default function TruckProfilePage() {
   const params = useParams();
   const router = useRouter();
   const truckId = params.id as string;

   // Mock data for the truck profile
   const truckDetails = {
      id: truckId,
      model: "Volvo FH16 - Heavy Duty",
      status: "Active",
      currentDriver: "Adaeze Okafor",
      odometer: "12,400 km",
      lastService: "10 Jan 2026"
   };

   const kpis = [
      { label: "Lifetime Routes", value: "86", icon: "🛣️", subText: "Completed legs", trend: "↑ 8%", variant: "primary" as const },
      { label: "Fuel Efficiency", value: "2.4 km/l", icon: "⛽", subText: "Average consumption", trend: "Stable", variant: "warning" as const },
      { label: "Fleet Uptime", value: "94%", icon: "⚡", subText: "Operational active", trend: "↑ 2%", variant: "success" as const },
      { label: "Health Index", value: "92/100", icon: "🛡️", subText: "No major faults", trend: "Normal", variant: "success" as const },
   ];

   const routeLog = [
      { id: "JOB-4521", date: "2026-04-05", route: "Lagos → Abuja", driver: "Adaeze Okafor", status: "Completed", fuelUsed: "220 L" },
      { id: "JOB-4482", date: "2026-04-01", route: "Abuja → Kano", driver: "Kwame Mensah", status: "Completed", fuelUsed: "180 L" },
      { id: "JOB-4415", date: "2026-03-25", route: "Lagos → Benin City", driver: "Oluwaseun P.", status: "Completed", fuelUsed: "95 L" },
      { id: "JOB-4367", date: "2026-03-18", route: "Enugu → Lagos", driver: "Adaeze Okafor", status: "Completed", fuelUsed: "155 L" },
      { id: "JOB-4310", date: "2026-03-10", route: "Port Harcourt → Lagos", driver: "Fatima Osman", status: "Completed", fuelUsed: "190 L" },
   ];

   const columns = [
      {
         label: "Date", key: "date", render: (val: string) => (
            <div className="flex items-center gap-2 text-neutral-500 font-medium">
               <Calendar className="w-3.5 h-3.5" />
               {val}
            </div>
         )
      },
      { label: "Job ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
      {
         label: "Operational Route", key: "route", render: (val: string) => (
            <div className="flex items-center gap-2">
               <Navigation className="w-3.5 h-3.5 text-primary/60" />
               <span className="font-semibold text-slate-900">{val}</span>
            </div>
         )
      },
      {
         label: "Responsible Driver", key: "driver", render: (val: string) => (
            <div className="flex items-center gap-2">
               <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
                  <User className="w-3 h-3" />
               </div>
               <span className="font-semibold text-slate-700">{val}</span>
            </div>
         )
      },
      { label: "Consumables", key: "fuelUsed", render: (val: string) => <span className="font-medium text-slate-400 text-[11px]">{val}</span> },
      {
         label: "Phase Status",
         key: "status",
         render: (val: string) => (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-bold uppercase tracking-widest border border-emerald-100">
               <div className="w-1 h-1 rounded-full bg-emerald-500" />
               {val}
            </span>
         )
      },
   ];

   return (
      <AdminLayout>
         <div className="p-6 pb-20 space-y-8 bg-neutral-50 min-h-screen">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest">
                     <button onClick={() => router.push('/admin/trucks')} className="hover:text-primary transition-colors">Fleet Directory</button>
                     <ChevronRight className="w-2.5 h-2.5" />
                     <span className="text-primary/80">Asset Profile</span>
                     <ChevronRight className="w-2.5 h-2.5" />
                     <span className="text-neutral-300">{truckId}</span>
                  </div>
                  <div className="flex items-center gap-5">
                     <button
                        onClick={() => router.push('/admin/trucks')}
                        className="w-10 h-10 rounded-2xl border border-neutral-100 bg-white flex items-center justify-center text-neutral-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                     >
                        <ArrowLeft className="w-5 h-5" />
                     </button>
                     <div>
                        <div className="flex items-center gap-3">
                           <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{truckDetails.model}</h1>
                           <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                              <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                              {truckDetails.status}
                           </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-[11px] text-neutral-400 font-medium">
                           <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-blue-500" /> {truckDetails.odometer}</span>
                           <span className="text-neutral-200">|</span>
                           <span>Asset ID: <span className="text-slate-900 font-bold tracking-wider">{truckId}</span></span>
                           <span className="text-neutral-200">|</span>
                           <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-500" /> Last Service: {truckDetails.lastService}</span>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-3 bg-white p-3 rounded-[24px] border border-neutral-100 shadow-sm pr-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                     <User className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.2em] leading-none mb-1">Active Pilot</span>
                     <span className="text-[16px] font-bold text-slate-900 tracking-tight leading-none">{truckDetails.currentDriver}</span>
                  </div>
               </div>
            </div>

            {/* Statistics Dashlets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
               {kpis.map((kpi, i) => (
                  <StatCard key={i} {...kpi} />
               ))}
            </div>

            {/* Operational Route Log */}
            <CommonTable
               title="Asset Utilization Log"
               icon="🚐"
               columns={columns}
               data={routeLog}
               onRowClick={(row) => router.push(`/admin/jobs/${row.id}`)}
               action={
                  <div className="flex gap-2">
                     <div className="relative group">
                        <input
                           type="text"
                           placeholder="Search trip IDs..."
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
      </AdminLayout>
   );
}
