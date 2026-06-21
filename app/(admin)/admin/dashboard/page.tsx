"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import AdminLayout from "@/components/admin/AdminLayout";
import StatCard from "@/components/admin/StatCard";
import CommonTable from "@/components/admin/CommonTable";
import CreateJobModal from "@/components/admin/CreateJobModal";
import { ChevronRight, Eye, Check, X, MessageSquare, Package } from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { settlementService } from "@/services/settlementService";
import { fetchLiveVehicles, getVehicleStatus, cleanDriverName } from "@/services/liveTrackingService";
import { assignmentService } from "@/services/assignmentService";
import BookingChatPanel from "@/components/admin/BookingChatPanel";
import { formatDate } from "@/lib/datetime";
import { canChatForTrip } from "@/lib/chatAvailability";

const DashboardMiniMap = dynamic(() => import("@/components/admin/DashboardMiniMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] flex items-center justify-center bg-neutral-50">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function AdminDashboard() {

   const [isCreateJobOpen, setCreateJobOpen] = useState(false);
   const [bookings, setBookings] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [settlements, setSettlements] = useState<any[]>([]);
   const [assignments, setAssignments] = useState<any[]>([]);
   const [fleetCounts, setFleetCounts] = useState({ total: 0, moving: 0, stopped: 0, parked: 0, inactive: 0 });
   const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
   const [isChatOpen, setIsChatOpen] = useState(false);

   useEffect(() => {
      loadData();
      settlementService.getAll().then((d) => setSettlements(d || [])).catch(() => {});
      assignmentService.getAll().then((d) => setAssignments(d || [])).catch(() => {});
      fetchLiveVehicles()
         .then((vehicles) => {
            const total    = vehicles.length;
            const moving   = vehicles.filter((v) => getVehicleStatus(v) === "moving").length;
            const stopped  = vehicles.filter((v) => getVehicleStatus(v) === "stopped").length;
            const parked   = vehicles.filter((v) => getVehicleStatus(v) === "parked").length;
            const inactive = vehicles.filter((v) => getVehicleStatus(v) === "inactive").length;
            setFleetCounts({ total, moving, stopped, parked, inactive });
         })
         .catch(() => {});
   }, []);

   const loadData = async () => {
      try {
         setIsLoading(true);
         const data = await bookingService.getAll();
         setBookings(data || []);
      } catch (error) {
         console.error("Dashboard load error:", error);
      } finally {
         setIsLoading(false);
      }
   };

   const handleUpdateStatus = async (id: string, newStatus: string) => {
      try {
         await bookingService.updateStatus(id, newStatus);
         loadData(); // Refresh list
      } catch (error) {
         console.error("Status update error:", error);
      }
   };

   // In-progress jobs: accepted/finalized or a trip that's underway, but not yet
   // completed/paid/cancelled. (Status becomes "finalized" once a deal is set, so
   // we can't rely on "accepted" alone.)
   const activeJobsCount = bookings.filter(b => {
      const s = (b?.status || "").toLowerCase();
      const ts = (b?.tripStatus || "").toLowerCase();
      if (["paid", "cancelled", "rejected"].includes(s)) return false;
      if (["completed", "delivered"].includes(ts)) return false;
      return ts !== "" || ["accepted", "finalized", "active", "transit"].includes(s);
   }).length;

   const totalFuelCost   = settlements.reduce((sum, s) => sum + (s.financials?.fuelTotal || 0), 0);
   const totalFuelLiters = settlements.reduce((sum, s) => sum + (s.fuelDetails?.totalLiters || 0), 0);
   const totalRevenue    = bookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0);
   const pendingPayments = bookings.filter(b => !b.finalAmount && b.status !== "rejected" && b.status !== "pending").length;

   // Single currency prefix (K = Kwacha) + full grouped number — avoids the
   // confusing "K 50K" double-K that the abbreviated format produced.
   const fmt = (n: number) => (n > 0 ? `K ${Math.round(n).toLocaleString("en")}` : "--");

   const kpis = [
      {
         label: "Total Trucks",
         value: fleetCounts.total > 0 ? fleetCounts.total.toString() : "--",
         icon: "🚛",
         subText: fleetCounts.total > 0 ? `${fleetCounts.moving} running · ${fleetCounts.stopped + fleetCounts.parked} idle` : "Loading...",
         trend: "Live",
         variant: "primary" as const,
      },
      {
         label: "Active Jobs",
         value: activeJobsCount.toString(),
         icon: "📦",
         subText: activeJobsCount > 0 ? `${activeJobsCount} in progress` : "No active jobs",
         trend: "Live",
         variant: "success" as const,
      },
      {
         label: "Fuel Cost",
         value: totalFuelLiters > 0 ? `${Math.round(totalFuelLiters)}L` : "--",
         icon: "⛽",
         subText: totalFuelCost > 0 ? `${fmt(totalFuelCost)} total cost` : "No settlement data yet",
         trend: settlements.length > 0 ? `${settlements.length} jobs` : "Pending",
         variant: "warning" as const,
      },
      {
         label: "Revenue",
         value: fmt(totalRevenue),
         icon: "💳",
         subText: pendingPayments > 0 ? `${pendingPayments} jobs pending amount` : "All amounts set",
         trend: `${bookings.filter(b => b.finalAmount).length} finalised`,
         variant: "danger" as const,
      },
   ];

   const getRoute = (b: any) => {
      const pickup = b.pickupLocations?.[0]?.address?.city || b.pickup?.address?.city || "N/A";
      const dropoff = b.dropoffLocations?.[b.dropoffLocations?.length - 1]?.address?.city || b.dropoff?.address?.city || "N/A";
      return `${pickup} → ${dropoff}`;
   };

   // bookingId → driver name (from assignments)
   const driverByBooking: Record<string, string> = {};
   assignments.forEach((a: any) => {
      const bId = typeof a.bookingId === "string" ? a.bookingId : a.bookingId?._id;
      if (bId && a.driverName) driverByBooking[bId] = cleanDriverName(a.driverName);
   });

   // Display status: Paid → Completed → Active → (Pending / Cancelled)
   const tripState = (b: any): { label: string; type: string } => {
      const s = (b?.status || "").toLowerCase();
      const ts = (b?.tripStatus || "").toLowerCase();
      if (s === "cancelled" || s === "rejected") return { label: s.charAt(0).toUpperCase() + s.slice(1), type: "danger" };
      if (s === "paid") return { label: "Paid", type: "success" };
      if (ts === "completed" || ts === "delivered") return { label: "Completed", type: "success" };
      if (ts || s === "accepted" || s === "finalized" || s === "active") return { label: "Active", type: "transit" };
      return { label: "Pending", type: "warning" };
   };

   const recentJobsData = bookings.slice(0, 5).map(b => {
      const st = tripState(b);
      return {
         id: b?.tripId || `#FL-${b?._id?.substring(b._id.length - 7).toUpperCase() || "NEW"}`,
         status: st.label,
         driver: driverByBooking[b?._id] || "—",
         route: getRoute(b),
         proposed: b?.finalAmount ? `K${Number(b.finalAmount).toLocaleString()}` : "TBD",
         type: st.type,
         rawId: b?._id,
         raw: b,
      };
   });

   const columns = [
      { label: "Job ID", key: "id", render: (val: string) => <span className="font-semibold text-primary">{val}</span> },
      {
         label: "Status",
         key: "status",
         render: (val: string, row: any) => (
            <span
               className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${
                  row.type === "transit" ? "bg-primary/10 text-primary"
                  : row.type === "success" ? "bg-emerald-50 text-emerald-600"
                  : row.type === "warning" ? "bg-amber-50 text-amber-600"
                  : "bg-rose-50 text-rose-500"
                  }`}
            >
               <span
                  className={`w-1 h-1 rounded-full ${
                     row.type === "transit" ? "bg-primary animate-pulse"
                     : row.type === "success" ? "bg-emerald-500"
                     : row.type === "warning" ? "bg-amber-500"
                     : "bg-rose-500"
                     }`}
               />
               {val}
            </span>
         ),
      },
      { label: "Driver", key: "driver", render: (val: string) => <span className="font-medium text-slate-700">{val}</span> },
      { label: "Route", key: "route", render: (val: string) => <span className="text-neutral-500">{val}</span> },
      { label: "Proposed", key: "proposed", render: (val: string) => <span className="font-semibold text-slate-900">{val}</span> },
      {
         label: "Actions",
         key: "actions",
         align: "center" as const,
         render: (_: any, row: any) => (
            <div className="flex gap-2 justify-center">
               {canChatForTrip(row.raw) ? (
                  <button
                     onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(row.raw);
                        setIsChatOpen(true);
                     }}
                     className="px-4 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-1.5"
                  >
                     <MessageSquare className="w-3 h-3" />
                     Chat
                  </button>
               ) : (
                  <span className="text-[10px] font-medium text-neutral-300">—</span>
               )}
            </div>
         ),
      },
   ];

   const handleCreateJob = (_data: any) => {
      alert("Job created successfully!");
      setCreateJobOpen(false);
   };


   return (
      <AdminLayout>
         <div className="p-4 md:p-6 pb-20 space-y-6 max-w-[1400px] mx-auto">
            {/* Header */}
            <div>
               <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
                  <span>Speedogistic</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                  <span className="text-primary">Dashboard</span>
               </div>
               <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Fleet Overview</h1>
               <p className="text-[11px] text-neutral-400 mt-0.5">
                  {new Date().toLocaleDateString("en", { month: "long", year: "numeric" })} · Global Logistics Hub · {fleetCounts.total > 0 ? `${fleetCounts.total} trucks` : "loading fleet…"}
               </p>
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
                     <a href="/admin/livetrack" className="bg-white p-2 rounded-xl border border-neutral-100 text-neutral-400 hover:text-emerald-600 transition-all shadow-sm">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                           <polyline points="23 4 23 10 17 10" />
                           <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                        </svg>
                     </a>
                  </div>
                  <DashboardMiniMap />
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
                     <div className="w-16 h-16 rounded-full border-[6px] border-neutral-50 border-t-emerald-500 border-r-amber-400 flex flex-col items-center justify-center shrink-0">
                        <span className="text-lg font-semibold text-slate-900">{fleetCounts.total}</span>
                        <span className="text-[7px] font-medium text-neutral-400 uppercase">Total</span>
                     </div>
                     <div className="flex-1 space-y-2.5">
                        {[
                           { label: "Running",   count: fleetCounts.moving,   color: "bg-emerald-500" },
                           { label: "Idle",      count: fleetCounts.stopped,  color: "bg-amber-400" },
                           { label: "Stopped",   count: fleetCounts.parked,   color: "bg-gray-400" },
                           { label: "No Signal", count: fleetCounts.inactive, color: "bg-red-400" },
                        ].map(({ label, count, color }) => {
                           const pct = fleetCounts.total > 0 ? Math.round((count / fleetCounts.total) * 100) : 0;
                           return (
                              <div key={label} className="space-y-0.5">
                                 <div className="flex justify-between text-[9px] font-medium uppercase text-neutral-400">
                                    <span>{label}</span>
                                    <span className="text-slate-900 font-semibold">{count}</span>
                                 </div>
                                 <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
                                    <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
                  <div className="p-2 border-t border-neutral-50 space-y-0.5">
                     <a href="/admin/livetrack" className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-xl transition-all cursor-pointer group">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-xs text-emerald-600">🏃</div>
                        <div className="flex-1 min-w-0">
                           <div className="text-[12px] font-semibold text-slate-900">Running Now</div>
                           <div className="text-[10px] font-medium text-neutral-400">Tap to open live map</div>
                        </div>
                        <div className="text-sm font-semibold text-emerald-600">{fleetCounts.moving}</div>
                     </a>
                  </div>
               </div>
            </div>


   
            {/* Table */}
            <CommonTable
               title="Recent Operations"
               icon="📋"
               columns={columns}
               data={isLoading ? [] : recentJobsData}
               emptyState={
                  isLoading ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Syncing latest operations...</p>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center gap-2">
                       <Package className="w-8 h-8 text-slate-100" />
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">No recent operations</p>
                    </div>
                  )
                }
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

         <BookingChatPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            clientId={(selectedRequest?.clientId as any)?._id || (selectedRequest?.clientId as any)?.id || ""}
            tripId={selectedRequest?.tripId || ""}
            request={selectedRequest ? {
               id: selectedRequest.tripId || `#FL-${selectedRequest._id?.substring(selectedRequest._id.length - 7).toUpperCase()}`,
               customer: (selectedRequest.clientId as any)?.name || "Direct Client",
               route: [getRoute(selectedRequest)],
               cargo: selectedRequest.cargoDetails?.goodsType,
               price: selectedRequest.finalAmount ? `K${selectedRequest.finalAmount}` : "TBD",
               date: formatDate(selectedRequest.createdAt || Date.now()),
               status: "Active" as any,
            } : null}
            onFinalize={() => setIsChatOpen(false)}
         />
      </AdminLayout >
   );
}
