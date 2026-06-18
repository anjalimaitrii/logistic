"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import CommonTable from "@/components/admin/CommonTable";
import BookingChatPanel from "@/components/admin/BookingChatPanel";
import { formatDate } from "@/lib/datetime";
import FinalizeDealDrawer from "@/components/admin/FinalizeDealDrawer";
import { MessageSquare, CheckCircle, ChevronRight, Package, Search } from "lucide-react";
import EditJobDrawer from "@/components/admin/EditJobDrawer";
import StatCard from "@/components/admin/StatCard";
import { bookingService } from "@/services/bookingService";
import { useRouter } from "next/navigation";
import CreateBookingDrawer from "@/components/admin/CreateBookingDrawer";

type RequestStatus = "Active" | "Finalized" | "Paid";

export default function BookingRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFinalizeDrawerOpen, setIsFinalizeDrawerOpen] = useState(false);
  const [isEditJobDrawerOpen, setIsEditJobDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");

  useEffect(() => {
    loadRequests();
  }, []);

  // Auto-open chat when navigated from notification (?openChat=<clientId__tripId>)
  useEffect(() => {
    if (requests.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const openChatId = params.get("openChat");
    if (!openChatId) return;
    // roomId format: clientId__tripId — split to match the exact trip
    const [chatClientId, chatTripId] = openChatId.split("__");
    const match = requests.find(r => {
      const rClientId = (r.clientId as any)?._id || r.clientId;
      if (chatTripId) return rClientId === chatClientId && r.tripId === chatTripId;
      // Legacy fallback (no tripId in roomId)
      return rClientId === openChatId || r._id === openChatId;
    });
    if (match) {
      setSelectedRequest(match);
      setIsChatOpen(true);
      router.replace("/admin/requests");
    }
  }, [requests]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await bookingService.getAll();
      // Hide secret without-tax jobs — they only appear on the secret page
      const visible = (Array.isArray(data) ? data : []).filter(
        (b: any) => !(b.isSecret === true && b.withTax === false)
      );
      setRequests(visible);
    } catch (error) {
      console.error("Fetch requests error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBooking = async (data: any) => {
    try {
      await loadRequests();
    } catch (error) {
      console.error("Refresh after booking error:", error);
    }
  };

  const handleUpdateJob = async (id: string, payload: any) => {
    try {
      await bookingService.update(id, payload);
      await loadRequests(); // Refresh list
    } catch (error) {
      console.error("Failed to update job:", error);
      throw error;
    }
  };

  // Fully paid — payment covers the full billed amount.
  const isPaid = (req: any): boolean => {
    const s = (req?.status || "").toLowerCase();
    const billed = req?.finalAmount || 0;
    const paid = req?.advancePaid || 0;
    return s === 'paid' || (billed > 0 && paid >= billed);
  };

  // A deal is finalized once a price is agreed (finalAmount set) or it has moved
  // past finalization. Such bookings should NOT show "Finalize Deal" again.
  const isFinalized = (req: any): boolean => {
    const s = (req?.status || "").toLowerCase();
    return (req?.finalAmount || 0) > 0
      || ['finalized', 'paid', 'transit', 'delivered', 'completed'].includes(s);
  };

  const getStatusLabel = (req: any): RequestStatus =>
    isPaid(req) ? 'Paid' : isFinalized(req) ? 'Finalized' : 'Active';

  const getRequestRoute = (req: any): string[] => {
    const pickups = (req.pickupLocations?.length ? req.pickupLocations : req.pickup ? [req.pickup] : [])
      .map((l: any) => l.address?.city).filter(Boolean);
    const dropoffs = (req.dropoffLocations?.length ? req.dropoffLocations : req.dropoff ? [req.dropoff] : [])
      .map((l: any) => l.address?.city).filter(Boolean);
    const all = [...pickups, ...dropoffs];
    return all.length ? all : ["N/A"];
  };

  // Derive unique companies and clients for filter dropdowns
  const uniqueCompanies = Array.from(new Set(
    requests.map(req => (req.clientId as any)?.company?.companyName).filter(Boolean)
  )) as string[];

  const uniqueClients = Array.from(new Set(
    requests.map(req => (req.clientId as any)?.name).filter(Boolean)
  )) as string[];

  const filteredRequests = requests.filter(req => {
    const pickupCity = req.pickupLocations?.[0]?.address?.city || req.pickup?.address?.city || "";
    const dropoffCity = req.dropoffLocations?.[0]?.address?.city || req.dropoff?.address?.city || "";
    const matchesSearch =
      req._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.tripId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.clientId as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pickupCity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dropoffCity?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = companyFilter === "all" || (req.clientId as any)?.company?.companyName === companyFilter;
    const matchesClient = clientFilter === "all" || (req.clientId as any)?.name === clientFilter;
    return matchesSearch && matchesCompany && matchesClient;
  });

  const tableData = filteredRequests.map(req => ({
    id: req.tripId || `#BR-${req._id?.substring(req._id.length - 7).toUpperCase() || "NEW"}`,
    customer: (req.clientId as any)?.name || "Direct Client",
    companyName: (req.clientId as any)?.company?.companyName || "Direct Booking",
    route: getRequestRoute(req),
    cargo: req.cargoDetails.goodsType,
    weight: `${req.cargoDetails.weight} KG`,
    price: req.finalAmount ? `K${req.finalAmount}` : "TBD",
    date: formatDate(req.createdAt || req.metadata?.createdAt || Date.now()),
    status: getStatusLabel(req),
    raw: req
  }));

  const columns = [
    {
      label: "Job ID",
      key: "id",
      render: (val: string) => <span className="text-[12px] font-semibold text-primary tracking-tight">{val}</span>
    },
    {
      label: "Customer",
      key: "customer",
      render: (val: string, row: any) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[7.5px] font-bold uppercase tracking-wider">{row.companyName}</span>
          </div>
          <span className="text-[12px] font-bold text-slate-700">{val}</span>
        </div>
      )
    },
    {
      label: "Route",
      key: "route",
      render: (val: string[]) => {
        const cities = Array.isArray(val) ? val : [val];
        return (
          <div className="relative group inline-flex items-center gap-1">
            <span className="text-[11px] font-medium text-slate-600 italic">{cities[0]}</span>
            {cities.length > 1 && <span className="text-slate-300 text-[10px] font-bold">→</span>}
            {cities.length > 2 && <span className="text-[11px] text-slate-400 italic">...</span>}
            {cities.length > 2 && <span className="text-slate-300 text-[10px] font-bold">→</span>}
            {cities.length > 1 && <span className="text-[11px] font-medium text-slate-600 italic">{cities[cities.length - 1]}</span>}
            {cities.length > 2 && (
              <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none">
                {cities.join(" → ")}
                <div className="absolute top-full left-3 border-4 border-transparent border-t-slate-900" />
              </div>
            )}
          </div>
        );
      }
    },
    {
      label: "Cargo Detail",
      key: "cargo",
      render: (val: string, row: any) => (
        <div className="flex flex-col">
          <span className="text-[12px] font-medium text-neutral-900">{val}</span>
          <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-tighter">{row.weight}</span>
        </div>
      )
    },
    {
      label: "Proposed",
      key: "price",
      render: (val: string) => <span className="text-[12px] font-semibold text-neutral-900">{val}</span>
    },
    {
      label: "Status",
      key: "status",
      render: (val: RequestStatus) => {
        const styles =
          val === 'Paid'      ? { box: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-600' } :
          val === 'Finalized' ? { box: 'bg-violet-50 text-violet-600',   dot: 'bg-violet-600' } :
                                { box: 'bg-blue-50 text-blue-600',       dot: 'bg-blue-600' };
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-medium uppercase tracking-widest ${styles.box}`}>
            <div className={`w-1 h-1 rounded-full ${styles.dot}`} />
            {val}
          </span>
        );
      }
    },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, row: any) => (
        <div className="flex gap-2 justify-center items-center">
          {row.status === "Active" && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedRequest(row.raw);
                  setIsChatOpen(true);
                }}
                className="p-2 bg-neutral-50 text-neutral-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all border border-transparent hover:border-primary/20 group"
                title="Chat"
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
          {row.status === "Finalized" && (
            <div className="flex items-center gap-1 text-[9px] font-semibold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Done
            </div>
          )}
          {row.status === "Paid" && (
            <div className="flex items-center gap-1 text-[9px] font-semibold text-emerald-700 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Fully Paid
            </div>
          )}
        </div>
      )
    }
  ];

  const stats = [
    { label: "Total Submissions", value: requests.length.toString(), icon: "📩", subText: "Overall Requests", trend: "Live", variant: "primary" as const },
    { label: "Active Bookings", value: requests.filter(r => !isFinalized(r)).length.toString(), icon: "🤝", subText: "Awaiting Finalization", trend: "Live", variant: "success" as const },
    { label: "Finalized", value: requests.filter(r => isFinalized(r)).length.toString(), icon: "✅", subText: "Deals Closed", trend: "Sync", variant: "warning" as const },
    { label: "In Transit", value: requests.filter(r => r.status === 'transit').length.toString(), icon: "🚛", subText: "On The Road", trend: "Live", variant: "danger" as const },
  ];

  return (
    <AdminLayout>
      <div className="p-6 pb-20 space-y-8 bg-neutral-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1.5">
              <span>Operations</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary/80">Booking Requests</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Manage Requests</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Review and finalize client cargo submissions in real-time.</p>
          </div>

          <button
            onClick={() => setIsCreateDrawerOpen(true)}
            className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-slate-200 hover:brightness-110 transition-all w-fit"
          >
            ＋ NEW BOOKING
          </button>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={i} {...s} />
          ))}
        </div>

        <CommonTable
          title="Recent Submissions"
          icon="📩"
          columns={columns}
          data={isLoading ? [] : tableData}
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search ID, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-3 py-2 text-[11px] font-medium outline-none focus:bg-white focus:border-primary/20 transition-all w-40"
                />
              </div>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[160px]"
              >
                <option value="all">All Companies</option>
                {uniqueCompanies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[160px]"
              >
                <option value="all">All Clients</option>
                {uniqueClients.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-blue-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {filteredRequests.length} Result{filteredRequests.length !== 1 ? 's' : ''}
              </div>
            </div>
          }
          onRowClick={(row) => {
            if (row.status === "Active") {
              setSelectedRequest(row.raw);
              setIsFinalizeDrawerOpen(true);
            }
          }}
          emptyState={
            isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Syncing latest submissions...</p>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-2">
                <Package className="w-8 h-8 text-neutral-200" />
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">No active submissions found</p>
              </div>
            )
          }
        />

        <BookingChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          clientId={(selectedRequest?.clientId as any)?._id || (selectedRequest?.clientId as any)?.id || ""}
          tripId={selectedRequest?.tripId || ""}
          request={selectedRequest ? {
            id: selectedRequest.tripId || `#BR-${selectedRequest._id?.substring(selectedRequest._id.length - 7).toUpperCase()}`,
            customer: (selectedRequest.clientId as any)?.name || "Direct Client",
            route: getRequestRoute(selectedRequest),
            cargo: selectedRequest.cargoDetails.goodsType,
            price: "TBD",
            date: formatDate(selectedRequest.createdAt || Date.now()),
            status: getStatusLabel(selectedRequest) as any
          } : null}
          onFinalize={() => {
            setIsChatOpen(false);
            setIsFinalizeDrawerOpen(true);
          }}
        />

        <FinalizeDealDrawer
          isOpen={isFinalizeDrawerOpen}
          onClose={() => setIsFinalizeDrawerOpen(false)}
          request={selectedRequest ? {
            ...selectedRequest,
            id: selectedRequest.tripId,
            customer: (selectedRequest.clientId as any)?.name || "Direct Client",
            route: getRequestRoute(selectedRequest),
            cargo: selectedRequest.cargoDetails.goodsType,
            price: "TBD",
            date: formatDate(selectedRequest.createdAt || Date.now()),
            status: getStatusLabel(selectedRequest) as any
          } : null}
          onSubmit={async (data) => {
            if (selectedRequest) {
              await bookingService.updateStatus(selectedRequest._id, "finalized", {
                finalAmount: Number(data.amount),
                advancePaid: Number(data.advancePaid),
                specialRequest: data.specialRequest
              });
              loadRequests();
            }
            setIsFinalizeDrawerOpen(false);
          }}
        />
        <CreateBookingDrawer
          isOpen={isCreateDrawerOpen}
          onClose={() => setIsCreateDrawerOpen(false)}
          onSubmit={handleCreateBooking}
        />

        <EditJobDrawer
          isOpen={isEditJobDrawerOpen}
          onClose={() => {
            setIsEditJobDrawerOpen(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          onUpdate={handleUpdateJob}
        />
      </div>
    </AdminLayout>
  );
}
