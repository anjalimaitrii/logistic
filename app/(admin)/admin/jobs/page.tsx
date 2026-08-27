"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import CommonTable from "@/components/admin/CommonTable";
import {
  Package,
  Clock,
  Truck,
  ChevronRight,
  Eye,
  Edit2,
  Search,
  RotateCcw
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { warehouseService } from "@/services/warehouseService";
import { assignmentService } from "@/services/assignmentService";
import { settlementService } from "@/services/settlementService";
import { completionService } from "@/services/completionService";
import { cleanDriverName } from "@/services/liveTrackingService";
import { fetchLiveVehicles } from "@/services/liveTrackingService";
import EditJobDrawer from "@/components/admin/EditJobDrawer";
import { isTripCompleted } from "@/lib/tripCompletion";
import { isLastOffloading, stopCounts } from "@/lib/tripStage";
import { clientNameOf, companyNameOf } from "@/lib/bookingParty";

export default function AdminJobsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [gpsStatusMap, setGpsStatusMap] = useState<Record<string, string>>({});
  // Booking currently being marked as returning, so its button can show progress.
  const [returningId, setReturningId] = useState<string | null>(null);
  // bookingId → new completion id (inv-001 / cash-001) shown once the trip completes
  const [newIdByBooking, setNewIdByBooking] = useState<Record<string, string>>({});

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const [bookingsData, assignmentsData, settlementsData, invoicesData, cashData] = await Promise.all([
        bookingService.getAll(),
        assignmentService.getAll(),
        settlementService.getAll().catch(() => []),
        completionService.getInvoices().catch(() => []),
        completionService.getCash().catch(() => []),
      ]);

      const assignments = assignmentsData || [];
      const settlements = settlementsData || [];

      // bookingId → new id (inv-xxx / cash-xxx) filed at completion
      const idMap: Record<string, string> = {};
      (invoicesData || []).forEach((r: any) => {
        const bId = (r.bookingId?._id || r.bookingId)?.toString();
        if (bId && r.invoiceId) idMap[bId] = String(r.invoiceId).toUpperCase();
      });
      (cashData || []).forEach((r: any) => {
        const bId = (r.bookingId?._id || r.bookingId)?.toString();
        if (bId && r.cashId) idMap[bId] = String(r.cashId).toUpperCase();
      });
      setNewIdByBooking(idMap);

      // Only jobs that have been approved by accountant (settlement exists)
      const approvedBookingIds = new Set(
        settlements
          .filter((s: any) => s.status === "Approved")
          .map((s: any) => (s.bookingId?._id || s.bookingId)?.toString())
      );

      const visibleJobs = (bookingsData || []).filter((b: any) => {
        const s = b.status?.toLowerCase();
        if (s === "cancelled" || s === "rejected") return false;
        // Secret (off-the-books) jobs appear here only during the active trip —
        // i.e. after the accountant stage (settlement exists, checked below) and
        // before completion. Once completed they leave Jobs and live only in the
        // secret section.
        if (b.isSecret === true && b.withTax === false) {
          const ts = (b.tripStatus || "").toLowerCase();
          if (ts === "completed" || ts === "delivered") return false;
        }
        return approvedBookingIds.has(b._id.toString());
      });

      setBookings(visibleJobs);
      setAssignments(assignments);

      // Fetch live GPS status (non-blocking — failures silently ignored)
      fetchLiveVehicles().then(vehicles => {
        const map: Record<string, string> = {};
        vehicles.forEach(v => {
          const id = v.Vehicle_No || v.Vehicle_Name;
          if (id) map[String(id).toUpperCase()] = v.Status; // RUNNING | IDLE | STOP
        });
        setGpsStatusMap(map);
      }).catch(() => {});
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateJob = async (id: string, payload: any) => {
    try {
      await bookingService.update(id, payload);
      await loadBookings(); // Refresh list
    } catch (error) {
      console.error("Failed to update job:", error);
      throw error;
    }
  };

  const getStatusType = (status: string) => {
    if (!status) return 'Pending';
    const s = status.toLowerCase();
    if (s === 'finalized') return 'FINALIZED';
    if (s === 'transit') return 'IN TRANSIT';
    if (s === 'delivered') return 'DELIVERED';
    if (s === 'delayed') return 'DELAYED';
    return s.toUpperCase();
  };

  const getStatusStyles = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'FINALIZED' || s === 'DELIVERED' || s === 'COMPLETED') return 'bg-emerald-50 text-emerald-500 border-emerald-100';
    if (s === 'IN TRANSIT') return 'bg-orange-50 text-orange-500 border-orange-100';
    if (s === 'DELAYED') return 'bg-rose-50 text-rose-500 border-rose-100';
    return 'bg-blue-50 text-blue-500 border-blue-100';
  };

  // Phase of each approved job: notStarted (before start) · active (start→returning) · completed
  const phaseOf = (b: any): "notStarted" | "active" | "completed" => {
    const ts = (b?.tripStatus || "").toLowerCase();
    if (isTripCompleted(b)) return "completed";
    return ts && ts !== "pending" ? "active" : "notStarted";
  };

  // A booking does not carry its own assignment, so anything that wants the driver
  // has to look it up here. The table did; the return dialog was handed the raw
  // booking and showed "Unknown Driver" for every trip.
  const assignmentFor = (b: any) =>
    assignments.find((a) => (a.bookingId?._id || a.bookingId) === (b?._id || b?.id));

  const driverNameFor = (b: any) => {
    const name = assignmentFor(b)?.driverName;
    return name ? cleanDriverName(name) : "Unassigned";
  };

  // Completed jobs leave this page entirely — table, cards and filters all
  // count from this same set.
  const pageBookings = bookings.filter(b => phaseOf(b) !== "completed");

  // Derive unique companies and clients for filter dropdowns
  const uniqueCompanies = Array.from(new Set(
    pageBookings.map(b => companyNameOf(b)).filter(Boolean)
  )) as string[];

  const uniqueClients = Array.from(new Set(
    pageBookings.map(b => clientNameOf(b)).filter(Boolean)
  )) as string[];

  const filteredBookings = pageBookings.filter(b => {
    const pickupCity = b.pickupLocations?.[0]?.address?.city || b.pickup?.address?.city || "";
    const dropoffCity = b.dropoffLocations?.[b.dropoffLocations?.length - 1]?.address?.city || b.dropoff?.address?.city || "";
    const matchesSearch =
      b._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tripId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientNameOf(b).toLowerCase().includes(searchQuery.toLowerCase()) ||
      pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dropoffCity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = companyFilter === "all" || companyNameOf(b) === companyFilter;
    const matchesClient = clientFilter === "all" || clientNameOf(b) === clientFilter;
    return matchesSearch && matchesCompany && matchesClient;
  });

  const jobsData = filteredBookings.map(b => {
    const pickupLocs = b?.pickupLocations?.length > 0 ? b.pickupLocations : (b?.pickup ? [b.pickup] : []);
    const dropoffLocs = b?.dropoffLocations?.length > 0 ? b.dropoffLocations : (b?.dropoff ? [b.dropoff] : []);
    const allLocs = [...pickupLocs, ...dropoffLocs];
    const route = allLocs.map((l: any) => l.address?.city).filter(Boolean) as string[];
    const assignment = assignmentFor(b);
    const truckNo = String(assignment?.truckNumber || "").toUpperCase();
    const gpsStatus = truckNo ? (gpsStatusMap[truckNo] || null) : null;
    const tripStatus = (b?.tripStatus || b?.status || "").toLowerCase();
    // A reassigned trip is NOT done — it is driving the empty leg to the next
    // job's pickup, and it completes on arrival there.
    const effectiveStatus = b?.tripStatus || b?.status;
    const isComplete = isTripCompleted(b) || effectiveStatus?.toLowerCase() === "delivered";
    return {
      id: newIdByBooking[b?._id] || b?.tripId || `#FL-${b?._id?.substring(b._id.length - 4).toUpperCase()}`,
      client: clientNameOf(b, "Direct Client"),
      companyName: companyNameOf(b, "Direct Booking"),
      status: getStatusType(effectiveStatus),
      driver: assignment?.driverName ? cleanDriverName(assignment.driverName) : "Assign Driver",
      route,
      gpsStatus,
      isComplete,
      raw: b
    };
  });

  // Only in-progress trips show here: approved → returning, never completed.
  const displayedData = jobsData.filter(j => !j.isComplete);

  // Offered once the cargo is off and the trip has not already been diverted to
  // another job's pickup — a diverted trip is not going back to the yard.
  const canMarkReturning = (b: any): boolean => {
    // A diverted trip is not going back to the yard at all.
    if (b?.lastPoint?.source === "reassignment") return false;
    // And only the LAST drop counts: a truck emptying the first of three still
    // has two loads aboard, so it is going on to the next drop, not home.
    const { pickups, dropoffs } = stopCounts(b);
    return isLastOffloading(b?.tripStatus, pickups, dropoffs);
  };

  // The distance is asked for HERE, not on another screen. Sending the operator to
  // the settlement to type it left the second half of the job to willpower, and a
  // truck could sit in "returning" for days with its empty run costed at nothing.
  const [returnFor, setReturnFor] = useState<any>(null);
  const [returnKm, setReturnKm] = useState("");
  const [returnTo, setReturnTo] = useState("");
  // What the trip already carries, so the operator can see what they are adding to
  // rather than guessing — and so nobody re-types a figure that is already there.
  const [returnCurrent, setReturnCurrent] = useState({ allocation: 0, levy: 0, toll: 0 });
  const [returnAdd, setReturnAdd] = useState({ allocation: "", levy: "", toll: "" });

  const openReturn = async (b: any) => {
    const bookingId = b?._id || b?.id;
    setReturnFor(b);
    setReturnKm("");
    setReturnAdd({ allocation: "", levy: "", toll: "" });
    setReturnCurrent({ allocation: 0, levy: 0, toll: 0 });

    const [wh, st] = await Promise.all([
      warehouseService.get().catch(() => null),
      settlementService.getByBookingId(String(bookingId)).catch(() => null),
    ]);
    setReturnTo(wh?.city || "");
    const f = (st as any)?.financials || {};
    setReturnCurrent({
      allocation: Number(f.cashAllocation) || 0,
      levy: Number(f.councilLevy) || 0,
      toll: Number(f.tollAmount) || 0,
    });
  };

  const submitReturn = async () => {
    const bookingId = returnFor?._id || returnFor?.id;
    if (!bookingId) return;
    if (!(Number(returnKm) > 0)) {
      alert("Enter the distance of the run back to the yard.");
      return;
    }
    try {
      setReturningId(bookingId);
      await bookingService.markReturning(bookingId, {
        km: Number(returnKm),
        addAllocation: Number(returnAdd.allocation) || 0,
        addCouncilLevy: Number(returnAdd.levy) || 0,
        addToll: Number(returnAdd.toll) || 0,
      });
      setReturnFor(null);
      await loadBookings();
    } catch (error: any) {
      console.error("Failed to mark returning:", error);
      alert(error?.message || "Could not mark the trip as returning.");
    } finally {
      setReturningId(null);
    }
  };

  const columns = [
    {
      label: "TRIP ID",
      key: "id",
      render: (val: string, row: any) => {
        const s = row.gpsStatus;
        const dotClass = row.isComplete
          ? "bg-slate-400"
          : s === "RUNNING" ? "bg-emerald-500 animate-pulse"
          : s === "IDLE"    ? "bg-amber-400"
          : s === "STOP"    ? "bg-rose-500"
          : "bg-slate-200";
        const tip = row.isComplete ? "Trip Completed"
          : s === "RUNNING" ? "Truck Running"
          : s === "IDLE"    ? "Truck Idle"
          : s === "STOP"    ? "Truck Stopped"
          : "No GPS Signal";
        return (
          <div className="flex items-center gap-2">
            <span title={tip} className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
            <span className="text-[12px] font-bold text-orange-500 tracking-tight">{val}</span>
          </div>
        );
      }
    },
    {
      label: "CLIENT",
      key: "client",
      render: (val: string, row: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] font-bold text-slate-900">{row.companyName}</span>
          <span className="text-[10px] font-medium text-slate-400">{val}</span>
        </div>
      )
    },
    {
      label: "STATUS",
      key: "status",
      render: (val: string) => (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(val)}`}>
          <div className={`w-1 h-1 rounded-full mr-1.5 ${val === 'IN TRANSIT' ? 'bg-orange-500' :
            val === 'DELIVERED' ? 'bg-emerald-500' :
              val === 'DELAYED' ? 'bg-rose-500' : 'bg-indigo-500'
            }`} />
          {val}
        </span>
      )
    },
    {
      label: "DRIVER",
      key: "driver",
      render: (val: string) => <span className="text-[12px] font-medium text-slate-600">{val}</span>
    },
    {
      label: "ROUTE",
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
      label: "ACTIONS",
      key: "actions",
      align: "center" as const,
      render: (_: any, row: any) => (
        <div className="flex gap-2 justify-center">
          {/* Returning is not a step in the trip's status flow — at offloading
              time nobody knows whether the truck heads home or gets a new job.
              It is this button instead, offered only once the cargo is off and
              only while the trip has not already been given a next job. */}
          {canMarkReturning(row.raw) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openReturn(row.raw);
              }}
              disabled={returningId === (row.raw._id || row.raw.id)}
              className="px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-all flex items-center gap-1.5"
              title="Truck is heading back to the yard"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {returningId === (row.raw._id || row.raw.id) ? "…" : "Return"}
              </span>
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/admin/jobs/${row.raw._id || row.raw.id}`);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all border border-slate-100"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedJob(row.raw);
              setIsEditDrawerOpen(true);
            }}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900 transition-all border border-slate-100"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  const notStartedCount = pageBookings.filter(b => phaseOf(b) === "notStarted").length;
  const activeCount     = pageBookings.filter(b => phaseOf(b) === "active").length;

  const kpis = [
    {
      label: "NOT STARTED",
      value: notStartedCount.toString(),
      icon: <Clock className="w-5 h-5 text-amber-500" />,
      subText: "Approved · awaiting start",
      trend: "Queue",
      variant: "warning" as const
    },
    {
      label: "IN PROGRESS",
      value: activeCount.toString(),
      icon: <Truck className="w-5 h-5 text-orange-500" />,
      subText: "Started → returning",
      trend: "Live",
      variant: "primary" as const
    },
    {
      label: "TOTAL JOBS",
      value: pageBookings.length.toString(),
      icon: <Package className="w-5 h-5 text-indigo-500" />,
      subText: "Queue + in progress",
      trend: "Overall",
      variant: "indigo" as const
    },
  ];

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
              <span>Speedogistic</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary">Jobs</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Job Management</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Manage and track your logistics operations in real-time.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[24px] font-bold text-slate-900">{kpi.value}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${kpi.variant === 'primary' ? 'bg-emerald-50 text-emerald-500' :
                      kpi.variant === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-emerald-50 text-emerald-500'
                      }`}>
                      {kpi.trend}
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                  <p className="text-[10px] font-medium text-slate-300 italic">● {kpi.subText}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                  {kpi.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Driver-dot legend */}
        <div className="flex items-center justify-end gap-3 flex-wrap mb-3">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-white border border-neutral-100 rounded-xl shadow-sm">
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Driver dot:</span>
            <span className="flex items-center gap-1 text-[9px] font-medium text-slate-500"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Running</span>
            <span className="flex items-center gap-1 text-[9px] font-medium text-slate-500"><span className="w-2 h-2 rounded-full bg-amber-400" />Idle</span>
            <span className="flex items-center gap-1 text-[9px] font-medium text-slate-500"><span className="w-2 h-2 rounded-full bg-rose-500" />Stopped</span>
            <span className="flex items-center gap-1 text-[9px] font-medium text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-400" />Done</span>
          </div>
        </div>

        <CommonTable
          title="Active Trips"
          icon={<Package className="w-4 h-4 text-orange-500" />}
          columns={columns}
          data={isLoading ? [] : displayedData}
          onRowClick={(row) => router.push(`/admin/jobs/${row.raw._id}`)}
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
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {displayedData.length} Result{displayedData.length !== 1 ? 's' : ''}
              </div>
            </div>
          }
          emptyState={
            isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Syncing Fleet Operations...</p>
              </div>
            ) : (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <Package className="w-10 h-10 text-slate-100" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">No Active Trips Found</p>
              </div>
            )
          }
        />

        <EditJobDrawer
          isOpen={isEditDrawerOpen}
          onClose={() => {
            setIsEditDrawerOpen(false);
            setSelectedJob(null);
          }}
          job={selectedJob}
          onUpdate={handleUpdateJob}
        />
      </div>

      {/* Return to the yard — status and distance together, because a return with
          no distance is a status nobody can cost. */}
      {returnFor && (
        <div className="fixed inset-0 z-200 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
              <h3 className="text-[15px] font-bold text-slate-900">Return to yard</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {returnFor?.tripId || "This trip"} &middot; {driverNameFor(returnFor)}
              </p>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">From</label>
                <div className="text-[13px] font-semibold text-slate-900">
                  {returnFor?.dropoffLocations?.[returnFor.dropoffLocations.length - 1]?.address?.city || "Last drop"}
                  <span className="ml-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    Last drop
                  </span>
                </div>
              </div>

              {/* Fixed: the yard is whatever Route Master holds. A truck cannot be
                  sent "home" to somewhere that is not home, so this is shown, not asked. */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">To</label>
                <div className="text-[13px] font-semibold text-slate-900">
                  {returnTo || "—"}
                  <span className="ml-1.5 text-[9px] font-bold uppercase tracking-widest text-violet-600">
                    Warehouse
                  </span>
                </div>
                {!returnTo && (
                  <p className="text-[10px] text-rose-500">
                    No warehouse set. Add it on Route Master first.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  Distance (km) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  autoFocus
                  value={returnKm}
                  onChange={(e) => setReturnKm(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") submitReturn(); }}
                  placeholder="e.g. 120"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2.5 text-[13px] text-slate-900 outline-none focus:border-primary/30 transition-all"
                />
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  This is the empty run home. It is saved onto the settlement as a return
                  leg, so the accountant finds it already costed.
                </p>
              </div>

              {/* Added to what the trip already carries, not replacing it — the
                  outbound allowance is still owed whatever the run home costs. */}
              <div className="pt-1 space-y-3 border-t border-slate-100">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest pt-3">
                  Add for the return
                </p>

                {([
                  { key: "allocation", label: "Driver's allowance", now: returnCurrent.allocation },
                  { key: "levy", label: "Council levy", now: returnCurrent.levy },
                  { key: "toll", label: "Toll", now: returnCurrent.toll },
                ] as const).map((f) => {
                  const add = Number(returnAdd[f.key]) || 0;
                  return (
                    <div key={f.key} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold text-slate-700 truncate">{f.label}</div>
                        <div className="text-[10px] text-slate-400">
                          Now K{f.now.toLocaleString()}
                          {add > 0 && (
                            <span className="text-emerald-600 font-bold">
                              {" "}&rarr; K{(f.now + add).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={returnAdd[f.key]}
                        onChange={(e) => setReturnAdd((p) => ({ ...p, [f.key]: e.target.value }))}
                        placeholder="+ 0"
                        className="w-28 shrink-0 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 text-[13px] text-slate-900 outline-none focus:border-primary/30 transition-all"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setReturnFor(null)}
                className="flex-1 py-3 rounded-2xl border border-neutral-200 text-[11px] font-bold uppercase tracking-widest text-slate-600 hover:border-neutral-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={submitReturn}
                disabled={!!returningId || !(Number(returnKm) > 0) || !returnTo}
                className="flex-1 py-3 rounded-2xl bg-primary text-white text-[11px] font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {returningId ? "Saving..." : "Start Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
