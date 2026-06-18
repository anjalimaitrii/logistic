"use client";

import { useState, useEffect } from "react";
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
  Navigation,
  Package
} from "lucide-react";
import { driverService } from "@/services/driverService";
import { assignmentService } from "@/services/assignmentService";
import { format } from "date-fns";
import { formatDate } from "@/lib/datetime";
import { cleanDriverName } from "@/services/liveTrackingService";


export default function DriverProfilePage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.id as string;

  const [driver, setDriver] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (driverId) {
      loadData();
    }
  }, [driverId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [driverData, assignmentsData] = await Promise.all([
        driverService.getById(driverId),
        assignmentService.getByDriverId(driverId)
      ]);
      setDriver(driverData);
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error("Failed to fetch driver details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const kpis = [
    { label: "Total Trips", value: assignments.length.toString(), icon: "🛣️", subText: "Lifetime completions", trend: "Live", variant: "primary" as const },
    { label: "On-Time Delivery", value: "98%", icon: "⏱️", subText: "Scheduled precision", trend: "Stable", variant: "success" as const },
    { label: "Experience", value: driver?.experience ? `${driver.experience} Years` : "N/A", icon: "📏", subText: "Career depth", trend: "—", variant: "warning" as const },
    { label: "Status", value: driver?.status || "Active", icon: "🛡️", subText: "Current standing", trend: "Normal", variant: "success" as const },
  ];

  const tripHistory = assignments.map(a => ({
    id: a.bookingId?.tripId || "N/A",
    date: a.assignedAt ? format(new Date(a.assignedAt), "yyyy-MM-dd") : "N/A",
    route: `${a.bookingId?.pickup?.address?.city || 'N/A'} → ${a.bookingId?.dropoff?.address?.city || 'N/A'}`,
    truck: a.truckNumber,
    status: a.status,
    distance: "TBD"
  }));

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

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 bg-neutral-50 min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!driver) {
    return (
      <AdminLayout>
        <div className="p-6 bg-neutral-50 min-h-screen flex flex-col items-center justify-center gap-4">
          <Package className="w-12 h-12 text-neutral-200" />
          <h2 className="text-xl font-bold text-slate-900">Driver Not Found</h2>
          <button onClick={() => router.push('/admin/drivers')} className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest">Back to Drivers</button>
        </div>
      </AdminLayout>
    );
  }

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
                       <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{cleanDriverName(driver.name)}</h1>
                       <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border ${
                          driver.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          driver.status === 'On Leave' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                          'bg-rose-50 text-rose-500 border-rose-100'
                       }`}>
                          <span className={`w-1 h-1 rounded-full ${
                             driver.status === 'Active' ? 'bg-emerald-500 animate-pulse' :
                             driver.status === 'On Leave' ? 'bg-amber-500' : 'bg-rose-500'
                          }`} />
                          {driver.status}
                       </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1.5 text-[11px] text-neutral-400 font-medium">
                       <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-amber-500" /> {driver.experience} Yrs Exp</span>
                       <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Registered {formatDate(driver.createdAt, { day: undefined })}</span>
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
                 <span className="text-[16px] font-bold text-slate-900 tracking-tight leading-none">
                    {driver.assignedTruck?.truckId || "No asset assigned"}
                 </span>
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
