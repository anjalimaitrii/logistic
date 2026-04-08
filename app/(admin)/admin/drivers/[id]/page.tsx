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
  Truck, 
  Award,
  Clock,
  Navigation
} from "lucide-react";

export default function DriverProfilePage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  // Mock data for the driver profile
  const driverDetails = {
    id: driverId,
    name: "Adaeze Okafor",
    status: "Active",
    assignedTruck: "TRK-014",
    phone: "+234 803 123 4567",
    experience: "5 Years",
    rating: "4.9/5"
  };

  const kpis = [
    { label: "Total Trips", value: "142", icon: "🛣️", subText: "Lifetime completions", trend: "↑ 12%", variant: "primary" as const },
    { label: "On-Time Delivery", value: "98%", icon: "⏱️", subText: "Scheduled precision", trend: "Stable", variant: "success" as const },
    { label: "Total Distance", value: "42,400", icon: "📏", subText: "KM covered", trend: "—", variant: "warning" as const },
    { label: "Asset health", value: "A+", icon: "🛡️", subText: "Safety score", trend: "No incidents", variant: "success" as const },
  ];

  const tripHistory = [
    { id: "JOB-4521", date: "2026-04-05", route: "Lagos → Abuja", truck: "TRK-014", status: "Completed", distance: "750 km" },
    { id: "JOB-4498", date: "2026-04-02", route: "Kano → Lagos", truck: "TRK-014", status: "Completed", distance: "1,100 km" },
    { id: "JOB-4450", date: "2026-03-28", route: "Lagos → Port Harcourt", truck: "TRK-022", status: "Completed", distance: "600 km" },
    { id: "JOB-4389", date: "2026-03-20", route: "Abuja → Lagos", truck: "TRK-014", status: "Completed", distance: "750 km" },
    { id: "JOB-4322", date: "2026-03-15", route: "Enugu → Lagos", truck: "TRK-007", status: "Completed", distance: "550 km" },
  ];

  const columns = [
    { label: "Date", key: "date", render: (val: string) => (
      <div className="flex items-center gap-2 text-neutral-500 font-medium">
        <Calendar className="w-3.5 h-3.5" />
        {val}
      </div>
    )},
    { label: "Job ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
    { label: "Route Log", key: "route", render: (val: string) => (
      <div className="flex items-center gap-2">
        <MapPin className="w-3.5 h-3.5 text-rose-500" />
        <span className="font-semibold text-slate-900">{val}</span>
      </div>
    )},
    { label: "Asset Used", key: "truck", render: (val: string) => (
       <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-400">
             <Truck className="w-3 h-3" />
          </div>
          <span className="font-semibold text-slate-700">{val}</span>
       </div>
    )},
    { label: "Distance", key: "distance", render: (val: string) => <span className="font-medium text-slate-400 text-[11px]">{val}</span> },
    { 
      label: "Status", 
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
                 <button onClick={() => router.push('/admin/drivers')} className="hover:text-primary transition-colors">Drivers</button>
                 <ChevronRight className="w-2.5 h-2.5" />
                 <span className="text-primary/80">Profile Overview</span>
                 <ChevronRight className="w-2.5 h-2.5" />
                 <span className="text-neutral-300">{driverId}</span>
              </div>
              <div className="flex items-center gap-5">
                 <button 
                    onClick={() => router.push('/admin/drivers')}
                    className="w-10 h-10 rounded-2xl border border-neutral-100 bg-white flex items-center justify-center text-neutral-400 hover:text-primary hover:border-primary/20 transition-all shadow-sm"
                 >
                    <ArrowLeft className="w-5 h-5" />
                 </button>
                 <div>
                    <div className="flex items-center gap-3">
                       <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{driverDetails.name}</h1>
                       <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                          {driverDetails.status}
                       </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-neutral-400 font-medium">
                       <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-500" /> {driverDetails.experience} Exp</span>
                       <span className="flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> Rated {driverDetails.rating}</span>
                       <span className="text-neutral-200">|</span>
                       <span>ID: <span className="text-slate-900 font-bold tracking-wider">{driverId}</span></span>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-3 bg-white p-3 rounded-[24px] border border-neutral-100 shadow-sm pr-6">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                 <Truck className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.2em] leading-none mb-1">Assigned Asset</span>
                 <span className="text-[16px] font-bold text-slate-900 tracking-tight leading-none">{driverDetails.assignedTruck}</span>
              </div>
           </div>
        </div>

        {/* Statistics Dashlets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        {/* History Ledger */}
        <CommonTable 
          title="Trip History Ledger" 
          icon="📋" 
          columns={columns} 
          data={tripHistory} 
          onRowClick={(row) => router.push(`/admin/jobs/${row.id}`)}
          action={
             <div className="flex gap-2">
                <div className="relative group">
                   <input
                      type="text"
                      placeholder="Search routes..."
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
