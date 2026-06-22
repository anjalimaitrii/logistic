"use client";

import { useState, useEffect, useMemo } from "react";
import CommonTable from "@/components/admin/CommonTable";
import CreateSecretJobModal from "@/components/admin/CreateSecretJobModal";
import BookingChatPanel from "@/components/admin/BookingChatPanel";
import FinalizeDealDrawer from "@/components/admin/FinalizeDealDrawer";
import EditJobDrawer from "@/components/admin/EditJobDrawer";
import TripDetailsModal from "@/components/TripDetailsModal";
import { bookingService } from "@/services/bookingService";
import {
  ChevronRight,
  Package,
  Eye,
  Search,
  Plus,
  Receipt,
  ShieldOff,
  MessageSquare,
  Edit2,
} from "lucide-react";

export default function SecretDashboard() {
  const [isModalOpen, setModalOpen] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [taxFilter, setTaxFilter] = useState<"all" | "with" | "without">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Same drawer state as normal requests page
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFinalizeDrawerOpen, setIsFinalizeDrawerOpen] = useState(false);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [viewBooking, setViewBooking] = useState<any | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const all = await bookingService.getAll();
      const secret = (all || []).filter((b: any) => {
        const isSecret = b.isSecret === true || b.metadata?.isSecret === true;
        return isSecret;
      });
      setJobs(secret);
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

  const handleUpdateJob = async (id: string, payload: any) => {
    await bookingService.update(id, payload);
    await loadJobs();
  };

  const filtered = useMemo(() => {
    return jobs.filter((b) => {
      const matchesTax =
        taxFilter === "all" ||
        (taxFilter === "with" && b.withTax === true) ||
        (taxFilter === "without" && b.withTax === false);
      const city1 = b.pickupLocations?.[0]?.address?.city || "";
      const city2 = b.dropoffLocations?.[0]?.address?.city || "";
      const clientName = (b.clientId as any)?.name || b.metadata?.client || "";
      const matchesSearch =
        !searchQuery ||
        b._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tripId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city1.toLowerCase().includes(searchQuery.toLowerCase()) ||
        city2.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTax && matchesSearch;
    });
  }, [jobs, taxFilter, searchQuery]);

  const withTaxCount    = jobs.filter((b) => b.withTax === true).length;
  const withoutTaxCount = jobs.filter((b) => b.withTax === false).length;

  const kpis = [
    { label: "Total Special Jobs", value: jobs.length.toString(),     icon: "💎", subText: "Secret assignments",      trend: "Special Ops",  variant: "primary"  as const },
    { label: "With Tax",           value: withTaxCount.toString(),    icon: "🧾", subText: "GST-inclusive jobs",     trend: "Taxable",      variant: "success"  as const },
    { label: "Without Tax",        value: withoutTaxCount.toString(), icon: "🔒", subText: "Tax-exempt assignments", trend: "Without Tax",  variant: "warning"  as const },
    { label: "Pending",            value: jobs.filter((b) => (b.tripStatus || b.status) === "pending" || (b.tripStatus || b.status) === "active").length.toString(), icon: "⏳", subText: "Awaiting finalization", trend: "Queue", variant: "danger" as const },
  ];

  const tableData = filtered.map((b) => {
    const city1 = b.pickupLocations?.[0]?.address?.city || "Origin";
    const city2 = b.dropoffLocations?.[0]?.address?.city || "Dest.";
    const status = (b.status || "active").toLowerCase();
    return {
      id: b.tripId || `#SL-${b._id?.slice(-4).toUpperCase()}`,
      client: (b.clientId as any)?.name || b.metadata?.client || "—",
      route: `${city1} → ${city2}`,
      tax: b.withTax ? "With Tax" : "Without Tax",
      price: b.finalAmount ? `K${b.finalAmount.toLocaleString()}` : "TBD",
      status,
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
      label: "AMOUNT",
      key: "price",
      render: (val: string) => <span className="text-[12px] font-semibold text-slate-900">{val}</span>,
    },
    {
      label: "STATUS",
      key: "status",
      render: (val: string) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${
          val === "finalized"
            ? "bg-emerald-50 text-emerald-600"
            : val === "active" || val === "pending"
            ? "bg-amber-50 text-amber-600"
            : "bg-neutral-50 text-neutral-400"
        }`}>
          <div className={`w-1 h-1 rounded-full ${
            val === "finalized" ? "bg-emerald-500" :
            val === "active" || val === "pending" ? "bg-amber-500" : "bg-neutral-400"
          }`} />
          {val === "active" ? "Accepted" : val}
        </span>
      ),
    },
    {
      label: "ACTIONS",
      key: "actions",
      align: "center" as const,
      render: (_: any, row: any) => {
        const status = (row.raw.status || "active").toLowerCase();
        // A deal is finalized once a price is set or it has moved past finalization
        // (finalized/paid/transit/delivered/completed) — don't show "Finalize" again.
        const isFinalized = (row.raw.finalAmount || 0) > 0
          || ["finalized", "paid", "transit", "delivered", "completed"].includes(status);

        return (
          <div className="flex gap-2 justify-center items-center">
            {/* View detail */}
            <button
              onClick={(e) => { e.stopPropagation(); setViewBooking(row.raw); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-neutral-100 text-neutral-400 hover:text-primary hover:bg-primary/5 transition-all shadow-sm"
              title="View Details"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Active: Chat + Finalize Deal — exactly like normal requests */}
            {!isFinalized && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRequest(row.raw);
                    setIsChatOpen(true);
                  }}
                  className="p-2 bg-neutral-50 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20 group"
                  title="Negotiate Chat"
                >
                  <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRequest(row.raw);
                    setIsFinalizeDrawerOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm flex items-center gap-1.5"
                >
                  Finalize Deal
                </button>
              </>
            )}

            {/* Finalized: Edit button */}
            {isFinalized && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedJob(row.raw);
                  setIsEditDrawerOpen(true);
                }}
                className="p-2 bg-neutral-50 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20 group"
                title="Edit Job"
              >
                <Edit2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
    <div className="p-6 pb-20 space-y-8 bg-neutral-50 min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">
              <span className="hover:text-primary cursor-pointer transition-colors">Special Ops</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary/80">Secret Dashboard</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Special Ledger</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Manage confidential assignments with tax configuration.</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{kpi.icon}</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                  kpi.variant === "primary" ? "bg-primary/10 text-primary" :
                  kpi.variant === "success" ? "bg-emerald-50 text-emerald-600" :
                  kpi.variant === "warning" ? "bg-amber-50 text-amber-600" :
                  "bg-rose-50 text-rose-500"
                }`}>{kpi.trend}</span>
              </div>
              <div className="text-[22px] font-bold text-slate-900 mb-0.5">{kpi.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</div>
              <div className="text-[10px] font-medium text-slate-300 mt-0.5">{kpi.subText}</div>
            </div>
          ))}
        </div>

        {/* Jobs Table */}
        <CommonTable
          title="Special Operations Ledger"
          icon="🔐"
          columns={columns}
          data={isLoading ? [] : tableData}
          onRowClick={(row) => setViewBooking(row.raw)}
          emptyState={
            isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Loading ledger...</p>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Package className="w-8 h-8 text-neutral-200" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">No special jobs found</p>
              </div>
            )
          }
          action={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Tax filter tabs */}
              <div className="flex bg-neutral-50 border border-neutral-100 rounded-xl p-1 gap-1">
                {(["all", "with", "without"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTaxFilter(t)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                      taxFilter === t
                        ? t === "with" ? "bg-primary text-white shadow-sm"
                        : t === "without" ? "bg-amber-500 text-white shadow-sm"
                        : "bg-slate-900 text-white shadow-sm"
                        : "text-neutral-400 hover:text-neutral-700"
                    }`}
                  >
                    {t === "all" ? "All Jobs" : t === "with" ? "With Tax" : "Without Tax"}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-300" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-neutral-100 rounded-xl pl-9 pr-3 py-2 text-[11px] font-medium outline-none focus:border-primary/20 transition-all w-44 shadow-sm"
                />
              </div>

              <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {filtered.length} Job{filtered.length !== 1 ? "s" : ""}
              </div>
            </div>
          }
        />
      </div>

      {/* Create Job Modal */}
      <CreateSecretJobModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateJob}
      />

      {/* Read-only trip details — opened from the view (eye) button / row click */}
      {viewBooking && (
        <TripDetailsModal booking={viewBooking} onClose={() => setViewBooking(null)} />
      )}

      {/* Chat Panel — same as normal requests */}
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

      {/* Finalize Deal Drawer — exact same component as normal requests */}
      <FinalizeDealDrawer
        isOpen={isFinalizeDrawerOpen}
        onClose={() => { setIsFinalizeDrawerOpen(false); setSelectedRequest(null); }}
        request={selectedRequest}
        onSubmit={handleFinalize}
      />

      {/* Edit Job Drawer — exact same component as normal requests */}
      <EditJobDrawer
        isOpen={isEditDrawerOpen}
        onClose={() => { setIsEditDrawerOpen(false); setSelectedJob(null); }}
        job={selectedJob}
        onUpdate={handleUpdateJob}
      />
    </>
  );
}
