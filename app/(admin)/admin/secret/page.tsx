"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import CreateSecretJobModal from "@/components/admin/CreateSecretJobModal";
import CommonTable from "@/components/admin/CommonTable";
import BookingChatPanel from "@/components/admin/BookingChatPanel";
import FinalizeDealDrawer from "@/components/admin/FinalizeDealDrawer";
import TripDetailsModal from "@/components/TripDetailsModal";
import StatCard from "@/components/admin/StatCard";
import { bookingService } from "@/services/bookingService";
import { fetchLiveVehicles, getVehicleStatus } from "@/services/liveTrackingService";
import { ChevronRight, Plus, Eye, MessageSquare, Receipt, ShieldOff, Package } from "lucide-react";

const DashboardMiniMap = dynamic(() => import("@/components/admin/DashboardMiniMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] flex items-center justify-center bg-neutral-50">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function SecretDashboard() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fleetCounts, setFleetCounts] = useState({ total: 0, moving: 0, stopped: 0, parked: 0, inactive: 0 });
  // Finalize / chat / view state
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFinalizeDrawerOpen, setIsFinalizeDrawerOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<any | null>(null);

  useEffect(() => {
    loadJobs();
    fetchLiveVehicles()
      .then((vehicles) => {
        const total = vehicles.length;
        const moving = vehicles.filter((v) => getVehicleStatus(v) === "moving").length;
        const stopped = vehicles.filter((v) => getVehicleStatus(v) === "stopped").length;
        const parked = vehicles.filter((v) => getVehicleStatus(v) === "parked").length;
        const inactive = vehicles.filter((v) => getVehicleStatus(v) === "inactive").length;
        setFleetCounts({ total, moving, stopped, parked, inactive });
      })
      .catch(() => {});
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      // Cards show the OVERALL picture, so keep all bookings here.
      const all = await bookingService.getAll();
      setJobs(all || []);
    } catch (err) {
      console.error("Failed to load secret jobs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async () => {
    await loadJobs();
  };

  const handleFinalize = async (data: { amount: string; advancePaid: string; specialRequest: string }) => {
    if (!selectedRequest) return;
    await bookingService.updateStatus(selectedRequest._id, "finalized", {
      finalAmount: parseFloat(data.amount),
      advancePaid: parseFloat(data.advancePaid) || 0,
      specialRequest: data.specialRequest,
    });
    setIsFinalizeDrawerOpen(false);
    setSelectedRequest(null);
    await loadJobs();
  };

  // A secret job leaves this list once its deal is finalized (amount set / past finalize).
  const isFinalized = (b: any) => {
    const s = (b?.status || "").toLowerCase();
    return (b?.finalAmount || 0) > 0
      || ["finalized", "paid", "transit", "delivered", "completed"].includes(s);
  };
  // Pending table is secret-only (finalize flow); cards stay overall.
  const secretJobs = jobs.filter((b) => b.isSecret === true || b.metadata?.isSecret === true);
  const pendingJobs = secretJobs.filter((b) => !isFinalized(b));

  const tableData = pendingJobs.map((b) => {
    const city1 = b.pickupLocations?.[0]?.address?.city || "Origin";
    const city2 = b.dropoffLocations?.[0]?.address?.city || "Dest.";
    return {
      id: b.tripId || `#SL-${b._id?.slice(-4).toUpperCase()}`,
      client: (b.clientId as any)?.name || b.metadata?.client || "—",
      route: `${city1} → ${city2}`,
      tax: b.withTax ? "With Tax" : "Without Tax",
      status: (b.status || "active").toLowerCase(),
      raw: b,
    };
  });

  const columns = [
    {
      label: "JOB ID",
      key: "id",
      render: (val: string) => <span className="text-[12px] font-bold text-primary tracking-tight">{val}</span>,
    },
    {
      label: "CLIENT",
      key: "client",
      render: (val: string) => <span className="text-[12px] font-bold text-slate-800">{val}</span>,
    },
    {
      label: "ROUTE",
      key: "route",
      render: (val: string) => <span className="text-[12px] font-medium text-slate-500 italic">{val}</span>,
    },
    {
      label: "TAX STATUS",
      key: "tax",
      render: (val: string) => (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          val === "Without Tax"
            ? "bg-amber-50 text-amber-600 border-amber-200"
            : "bg-primary/10 text-primary border-primary/20"
        }`}>
          {val === "Without Tax"
            ? <><ShieldOff className="w-2.5 h-2.5 inline mr-1" />Without Tax</>
            : <><Receipt className="w-2.5 h-2.5 inline mr-1" />With Tax</>}
        </span>
      ),
    },
    {
      label: "ACTIONS",
      key: "actions",
      align: "center" as const,
      render: (_: any, row: any) => (
        <div className="flex gap-2 justify-center items-center">
          <button
            onClick={(e) => { e.stopPropagation(); setViewBooking(row.raw); }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedRequest(row.raw); setIsChatOpen(true); }}
            className="p-2 bg-neutral-50 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20 group"
            title="Negotiate Chat"
          >
            <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedRequest(row.raw); setIsFinalizeDrawerOpen(true); }}
            className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"
          >
            Finalize Deal
          </button>
        </div>
      ),
    },
  ];

  // Overall counts across ALL bookings (cancelled/rejected excluded).
  const countableJobs = jobs.filter((b) => !["cancelled", "rejected"].includes((b.status || "").toLowerCase()));
  const withoutTaxCount = countableJobs.filter((b) => b.withTax === false).length;
  const withTaxCount = countableJobs.filter((b) => b.withTax !== false).length; // normal + secret with-tax

  const kpis = [
    {
      label: "With Tax Trips",
      value: isLoading ? "--" : withTaxCount.toString(),
      icon: "🧾",
      subText: "GST-inclusive jobs",
      trend: "Taxable",
      variant: "success" as const,
    },
    {
      label: "Without Tax Trips",
      value: isLoading ? "--" : withoutTaxCount.toString(),
      icon: "🔒",
      subText: "Tax-exempt assignments",
      trend: "Off-Books",
      variant: "warning" as const,
    },
    {
      label: "Total Jobs",
      value: isLoading ? "--" : countableJobs.length.toString(),
      icon: "💎",
      subText: "All bookings (overall)",
      trend: "Overall",
      variant: "primary" as const,
    },
  ];

  return (
    <>
      <div className="p-4 md:p-6 pb-20 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">
              <span>Special Ops</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary/80">Secret Dashboard</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Secret Overview</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Confidential assignments · live fleet tracking · tax split.
            </p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 hover:brightness-110 transition-all w-fit flex items-center gap-2"
          >
            <div className="p-0.5 rounded-md bg-white/20">
              <Plus className="w-3 h-3" />
            </div>
            Create Special Job
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpis.map((kpi, i) => (
            <StatCard key={i} {...kpi} />
          ))}
        </div>

        {/* Live Fleet Map */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-white border border-neutral-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="text-[13px] font-semibold flex items-center gap-2.5 text-slate-900">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs">🗺</span>
                Live Fleet Location
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-medium rounded-full uppercase tracking-widest border border-emerald-100">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                  Live
                </span>
              </div>
              <a href="/admin/livetrack" className="bg-white p-2 rounded-xl border border-neutral-100 text-neutral-400 hover:text-indigo-600 transition-all shadow-sm">
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </a>
            </div>
            <DashboardMiniMap />
          </div>

          {/* Fleet Status Breakdown */}
          <div className="bg-white border border-neutral-100 rounded-2xl shadow-sm flex flex-col">
            <div className="p-4 border-b border-neutral-100">
              <div className="text-[13px] font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 text-xs">🚛</span>
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
                  { label: "Running", count: fleetCounts.moving, color: "bg-emerald-500" },
                  { label: "Idle", count: fleetCounts.stopped, color: "bg-amber-400" },
                  { label: "Stopped", count: fleetCounts.parked, color: "bg-gray-400" },
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

        {/* Pending Special Jobs — finalize the deal here */}
        <CommonTable
          title="Pending Special Jobs"
          icon="🔐"
          columns={columns}
          data={isLoading ? [] : tableData}
          onRowClick={(row) => setViewBooking(row.raw)}
          emptyState={
            isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Loading...</p>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Package className="w-8 h-8 text-neutral-200" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">No pending special jobs</p>
              </div>
            )
          }
        />
      </div>

      {/* Create Job Modal */}
      <CreateSecretJobModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateJob}
      />

      {/* Read-only trip details — view (eye) button / row click */}
      {viewBooking && (
        <TripDetailsModal booking={viewBooking} onClose={() => setViewBooking(null)} />
      )}

      {/* Negotiate Chat */}
      <BookingChatPanel
        isOpen={isChatOpen}
        onClose={() => { setIsChatOpen(false); setSelectedRequest(null); }}
        clientId={(selectedRequest?.clientId as any)?._id || (selectedRequest?.clientId as any)?.id || ""}
        tripId={selectedRequest?.tripId || ""}
        request={selectedRequest ? {
          id: selectedRequest.tripId || `#SL-${selectedRequest._id?.slice(-4).toUpperCase()}`,
          customer: (selectedRequest.clientId as any)?.name || selectedRequest.metadata?.client || "Direct Client",
          route: `${selectedRequest.pickupLocations?.[0]?.address?.city || "Origin"} → ${selectedRequest.dropoffLocations?.[0]?.address?.city || "Dest."}`,
        } : null}
        onFinalize={() => {
          setIsChatOpen(false);
          setIsFinalizeDrawerOpen(true);
        }}
      />

      {/* Finalize Deal Drawer */}
      <FinalizeDealDrawer
        isOpen={isFinalizeDrawerOpen}
        onClose={() => { setIsFinalizeDrawerOpen(false); setSelectedRequest(null); }}
        request={selectedRequest}
        onSubmit={handleFinalize}
      />
    </>
  );
}
