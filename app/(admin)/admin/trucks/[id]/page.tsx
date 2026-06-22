"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import {
   ChevronRight,
   ChevronLeft,
   ArrowLeft,
   Calendar,
   MapPin,
   User,
   Gauge,
   Fuel,
   Activity,
   Navigation,
   Package,
   Clock,
   RotateCcw,
   History,
   FileText,
   RefreshCw
} from "lucide-react";
import { truckService } from "@/services/truckService";
import { assignmentService } from "@/services/assignmentService";
import { cleanDriverName } from "@/services/liveTrackingService";
import { formatDate, formatDateTime } from "@/lib/datetime";

// Days until a date (negative = already past). null if no/invalid date.
const daysUntil = (dateStr?: string): number | null => {
   if (!dateStr) return null;
   const d = new Date(dateStr);
   if (isNaN(d.getTime())) return null;
   return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
};

// Health derived from compliance documents' due dates
const computeHealth = (docs: any[] = []): { label: string; variant: "success" | "warning" | "danger" } => {
   if (!docs.length) return { label: "No Docs", variant: "warning" };
   const expired  = docs.filter(d => { const x = daysUntil(d.dueDate); return x !== null && x <= 0; }).length;
   const expiring = docs.filter(d => { const x = daysUntil(d.dueDate); return x !== null && x > 0 && x <= 20; }).length;
   if (expired > 0)  return { label: "Critical", variant: "danger" };
   if (expiring > 0) return { label: "Fair", variant: "warning" };
   return { label: "Good", variant: "success" };
};

export default function TruckProfilePage() {
   const params = useParams();
   const router = useRouter();
   const id = params.id as string;
   const [truck, setTruck] = useState<any>(null);
   const [assignments, setAssignments] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [periodOffset, setPeriodOffset] = useState(0); // 0 = latest 10-day window

   useEffect(() => {
      if (id) {
         loadData();
      }
   }, [id]);

   const loadData = async () => {
      try {
         setIsLoading(true);
         const [truckData, assignmentsData] = await Promise.all([
            truckService.getById(id),
            assignmentService.getByTruckId(id)
         ]);
         setTruck(truckData);
         setAssignments(assignmentsData || []);
      } catch (error) {
         console.error("Failed to fetch truck details:", error);
      } finally {
         setIsLoading(false);
      }
   };

   // ── Dynamic stats from real data ──
   const docs = truck?.complianceDocs || [];
   const totalDocs = docs.length;
   const validDocs = docs.filter((d: any) => { const x = daysUntil(d.dueDate); return x === null || x > 0; }).length;
   const health = computeHealth(docs);
   const activeTrips = assignments.filter((a: any) =>
      ["active", "queued", "in-progress", "transit"].includes((a.status || "").toLowerCase())
   ).length;

   const kpis = [
      { label: "Lifetime Routes", value: assignments.length.toString(), icon: "🛣️", subText: "Total trips logged", trend: "Live", variant: "primary" as const },
      { label: "Active Trips", value: activeTrips.toString(), icon: "🚚", subText: "Currently running", trend: activeTrips > 0 ? "Live" : "Idle", variant: "warning" as const },
      { label: "Compliance", value: totalDocs ? `${validDocs}/${totalDocs}` : "—", icon: "📋", subText: totalDocs ? "Documents valid" : "No docs on file", trend: validDocs === totalDocs && totalDocs > 0 ? "OK" : "Check", variant: validDocs === totalDocs && totalDocs > 0 ? "success" as const : "danger" as const },
      { label: "Health Index", value: health.label, icon: "🛡️", subText: "Based on compliance", trend: health.variant === "success" ? "Good" : health.variant === "warning" ? "Watch" : "Action", variant: health.variant },
   ];

   const routeLog = assignments.map(a => {
      const b = a.bookingId || {};
      const fromCity = b.pickupLocations?.[0]?.address?.city || b.pickup?.address?.city || "N/A";
      const toCity = b.dropoffLocations?.[b.dropoffLocations.length - 1]?.address?.city || b.dropoff?.address?.city || "N/A";
      const goods = Array.isArray(b.cargoDetails?.goodsType) ? b.cargoDetails.goodsType.join(", ") : b.cargoDetails?.goodsType;
      const cargo = goods
         ? `${goods}${b.cargoDetails.weight ? ` · ${b.cargoDetails.weight} kg` : ""}`
         : "—";
      return {
         id: b.tripId || "N/A",
         date: a.assignedAt ? formatDate(a.assignedAt) : "N/A",
         route: `${fromCity} → ${toCity}`,
         driver: cleanDriverName(a.driverName),
         status: a.status || "—",
         cargo,
      };
   });

   // ── Truck activity timeline — only: docs, collections, driver change, new job ──
   const truckTimeline = (() => {
      type Kind = "doc" | "collection" | "driver" | "assign" | "newjob";
      type Ev = { time: number; title: string; desc: string; kind: Kind };
      const events: Ev[] = [];

      // 1. Truck-level activity log (Document Uploaded, Collection Added/Renewed)
      (truck?.activityLog || []).forEach((e: any) => {
         const kind: Kind = e.title?.startsWith("Document") ? "doc" : "collection";
         events.push({ time: e.time ? new Date(e.time).getTime() : 0, title: e.title, desc: e.description || "", kind });
      });

      // 2. Driver assigned / changed + New Job Assigned (from assignments)
      const sorted = [...assignments].sort(
         (a, b) => new Date(a.assignedAt || 0).getTime() - new Date(b.assignedAt || 0).getTime()
      );
      let prevDriver: string | null = null;
      sorted.forEach(a => {
         const b = a.bookingId || {};
         const trip = b.tripId || "Trip";
         const driver = cleanDriverName(a.driverName);
         const at = a.assignedAt ? new Date(a.assignedAt).getTime() : 0;

         if (prevDriver && driver && driver !== prevDriver) {
            events.push({ time: at, title: "Driver Changed", desc: `${prevDriver} → ${driver} · ${trip}`, kind: "driver" });
         } else {
            events.push({ time: at, title: "Driver Assigned", desc: `${driver} · ${trip}`, kind: "assign" });
         }
         if (driver) prevDriver = driver;

         // Only the "New Job Assigned" event from booking timeline (skip trip lifecycle)
         (b.timeline || [])
            .filter((e: any) => e.title === "New Job Assigned")
            .forEach((e: any) => {
               events.push({
                  time: e.time ? new Date(e.time).getTime() : at,
                  title: "New Job Assigned",
                  desc: `${trip}${e.description ? ` · ${e.description}` : ""}`,
                  kind: "newjob",
               });
            });
      });

      // Newest first
      return events.sort((a, b) => b.time - a.time);
   })();

   // ── 10-day window filter ──
   const PERIOD_DAYS = 10;
   const PERIOD_MS = PERIOD_DAYS * 86_400_000;
   const nowMs = Date.now();
   const windowEnd = nowMs - periodOffset * PERIOD_MS;
   const windowStart = windowEnd - PERIOD_MS;
   const windowedTimeline = truckTimeline.filter(e => e.time > windowStart && e.time <= windowEnd);
   const hasOlder = truckTimeline.some(e => e.time <= windowStart);

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
      { label: "Cargo", key: "cargo", render: (val: string) => <span className="font-medium text-slate-500 text-[11px]">{val}</span> },
      {
         label: "Phase Status",
         key: "status",
         render: (val: string) => {
            const s = (val || "").toLowerCase();
            const st = ["completed", "paid", "delivered"].includes(s)
               ? { box: "bg-emerald-50 text-emerald-600 border-emerald-100", dot: "bg-emerald-500" }
               : ["active", "transit", "in-progress"].includes(s)
                  ? { box: "bg-blue-50 text-blue-600 border-blue-100", dot: "bg-blue-500 animate-pulse" }
                  : s === "queued"
                     ? { box: "bg-amber-50 text-amber-600 border-amber-100", dot: "bg-amber-500" }
                     : { box: "bg-neutral-50 text-neutral-400 border-neutral-100", dot: "bg-neutral-300" };
            return (
               <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${st.box}`}>
                  <div className={`w-1 h-1 rounded-full ${st.dot}`} />
                  {val}
               </span>
            );
         }
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

   if (!truck) {
      return (
         <AdminLayout>
            <div className="p-6 bg-neutral-50 min-h-screen flex flex-col items-center justify-center gap-4">
               <Package className="w-12 h-12 text-neutral-200" />
               <h2 className="text-xl font-bold text-slate-900">Truck Not Found</h2>
               <button onClick={() => router.push('/admin/trucks')} className="px-6 py-2 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest">Back to Fleet</button>
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
                     <button onClick={() => router.push('/admin/trucks')} className="hover:text-primary transition-colors">Fleet Directory</button>
                     <ChevronRight className="w-2.5 h-2.5" />
                     <span className="text-primary/80">Asset Profile</span>
                     <ChevronRight className="w-2.5 h-2.5" />
                     <span className="text-neutral-300">{truck.truckId}</span>
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
                           <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{truck.vehicleModel}</h1>
                           <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 border ${truck.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              truck.status === 'Idle' ? 'bg-amber-50 text-amber-500 border-amber-100' :
                                 'bg-rose-50 text-rose-500 border-rose-100'
                              }`}>
                              <span className={`w-1 h-1 rounded-full ${truck.status === 'Active' ? 'bg-emerald-500 animate-pulse' :
                                 truck.status === 'Idle' ? 'bg-amber-500' : 'bg-rose-500'
                                 }`} />
                              {truck.status}
                           </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1.5 text-[11px] text-neutral-400 font-medium">
                           <span className="flex items-center gap-1.5"><Gauge className="w-3.5 h-3.5 text-blue-500" /> {truck.odometer || "0 km"}</span>
                           <span className="text-neutral-200">|</span>
                           <span>Asset ID: <span className="text-slate-900 font-bold tracking-wider">{truck.truckId}</span></span>
                           <span className="text-neutral-200">|</span>
                           <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-amber-500" /> Next Service: {(() => { const d = truck.nextServiceDate || truck.estNextServiceDate || truck.maintenanceDate; return d ? formatDate(d) : "Not scheduled"; })()}</span>
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
                     <span className="text-[16px] font-bold text-slate-900 tracking-tight leading-none">
                        {assignments[0]?.driverName ? cleanDriverName(assignments[0].driverName) : "No active driver"}
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

            {/* Operational Route Log */}
            <CommonTable
               title="Asset Utilization Log"
               icon="🚐"
               columns={columns}
               data={routeLog}
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

            {/* ── Overall Activity Timeline ── */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
               <div className="px-5 py-4 border-b border-neutral-50 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <History className="w-4 h-4" />
                     </div>
                     <div>
                        <h3 className="text-[13px] font-bold text-slate-900">Activity Timeline</h3>
                        <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">
                           {formatDate(windowStart + 1)} – {formatDate(windowEnd)} · {windowedTimeline.length} events
                        </p>
                     </div>
                  </div>
                  {/* 10-day window navigation */}
                  <div className="flex items-center gap-1.5">
                     <button
                        onClick={() => setPeriodOffset(o => o + 1)}
                        disabled={!hasOlder}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-100 bg-white text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:border-primary/30 hover:text-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                     >
                        <ChevronLeft className="w-3 h-3" /> Previous 10 days
                     </button>
                     {periodOffset > 0 && (
                        <button
                           onClick={() => setPeriodOffset(o => Math.max(0, o - 1))}
                           className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-100 bg-white text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:border-primary/30 hover:text-primary transition-all"
                        >
                           Newer <ChevronRight className="w-3 h-3" />
                        </button>
                     )}
                  </div>
               </div>

               <div className="p-5">
                  {truckTimeline.length === 0 ? (
                     <p className="text-center text-[11px] text-neutral-300 font-bold uppercase tracking-widest py-8">No activity yet</p>
                  ) : windowedTimeline.length === 0 ? (
                     <div className="text-center py-8">
                        <p className="text-[11px] text-neutral-300 font-bold uppercase tracking-widest">No events in this 10-day window</p>
                        {hasOlder && (
                           <button onClick={() => setPeriodOffset(o => o + 1)} className="mt-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">← See previous 10 days</button>
                        )}
                     </div>
                  ) : (
                     <div className="relative pl-6">
                        {/* vertical line */}
                        <div className="absolute left-[9px] top-1 bottom-1 w-px bg-neutral-100" />
                        <div className="space-y-5">
                           {windowedTimeline.map((e, i) => {
                              const style =
                                 e.kind === "doc" ? { ring: "bg-indigo-500", box: "bg-indigo-50 text-indigo-600", Icon: FileText } :
                                 e.kind === "collection" ? { ring: "bg-teal-500", box: "bg-teal-50 text-teal-600", Icon: Package } :
                                 e.kind === "driver" ? { ring: "bg-violet-500", box: "bg-violet-50 text-violet-600", Icon: RefreshCw } :
                                 e.kind === "newjob" ? { ring: "bg-amber-500", box: "bg-amber-50 text-amber-600", Icon: RotateCcw } :
                                                       { ring: "bg-blue-500", box: "bg-blue-50 text-blue-600", Icon: User };
                              const Icon = style.Icon;
                              return (
                                 <div key={i} className="relative flex items-start gap-3">
                                    <div className={`absolute -left-[18px] mt-0.5 w-[18px] h-[18px] rounded-full ${style.ring} flex items-center justify-center ring-4 ring-white`}>
                                       <Icon className="w-2.5 h-2.5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-2 flex-wrap">
                                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${style.box}`}>{e.title}</span>
                                          <span className="text-[9px] text-neutral-300 font-medium flex items-center gap-1">
                                             <Clock className="w-2.5 h-2.5" />
                                             {e.time ? formatDateTime(new Date(e.time)) : "—"}
                                          </span>
                                       </div>
                                       <p className="text-[12px] font-medium text-slate-700 mt-1">{e.desc}</p>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </AdminLayout>
   );
}
