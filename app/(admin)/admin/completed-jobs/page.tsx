"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import CommonTable from "@/components/admin/CommonTable";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import {
  Package,
  CheckSquare,
  ChevronRight,
  Eye,
  Search,
  X
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { assignmentService } from "@/services/assignmentService";
import { settlementService } from "@/services/settlementService";
import { completionService } from "@/services/completionService";
import { cleanDriverName } from "@/services/liveTrackingService";
import FinalizeDealDrawer from "@/components/admin/FinalizeDealDrawer";
import InvoiceDrawer from "@/components/admin/InvoiceDrawer";
import ReceivePaymentDrawer from "@/components/admin/ReceivePaymentDrawer";
import { isTripCompleted } from "@/lib/tripCompletion";
import { clientNameOf, companyNameOf, invoicePartyOf } from "@/lib/bookingParty";
import { formatDate, inDateRange } from "@/lib/datetime";
import { getAdminAccountType, type AdminAccountType } from "@/lib/adminRole";

// Same TPIN the invoice prints: one typed on the invoice wins over the company's.
const tpinOf = (b: any): string => String(b?.invoiceTpin ?? b?.clientId?.company?.tpinNumber ?? "").trim();

// The stage filter. A trip is invoiced once its invoice is printed, and paid once
// the billed amount is in — so an invoiced trip can still be awaiting payment.
const STAGES = {
  "invoice-pending": { label: "Invoice Pending", test: (j: any) => !j.isInvoiced },
  invoiced: { label: "Invoiced", test: (j: any) => j.isInvoiced },
  "payment-pending": { label: "Payment Pending", test: (j: any) => !j.isFullyPaid },
};

export default function AdminCompletedJobsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  // Where a completed trip stands on its invoice and its payment.
  const [stageFilter, setStageFilter] = useState<"all" | keyof typeof STAGES>("all");
  // Created-date range (YYYY-MM-DD), each end optional.
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  // bookingId → new completion id (inv-001 / cash-001) shown once the trip completes
  const [newIdByBooking, setNewIdByBooking] = useState<Record<string, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isFinalizeDrawerOpen, setIsFinalizeDrawerOpen] = useState(false);
  const [invoiceJob, setInvoiceJob] = useState<any | null>(null);
  // Trips ticked for one combined invoice, and the trips of the one being shown.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [invoiceGroup, setInvoiceGroup] = useState<any[] | null>(null);
  const [payTrip, setPayTrip] = useState<any | null>(null);
  // Employees can view completed jobs; finalize, payments and invoices stay with the admin.
  const [accountType, setAccountType] = useState<AdminAccountType>("admin");

  useEffect(() => {
    setAccountType(getAdminAccountType());
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
        // Without-tax secret jobs leave the regular flow once completed — they live
        // only in the secret section, not here.
        if (b.isSecret === true && b.withTax === false) return false;
        return approvedBookingIds.has(b._id.toString());
      });

      setBookings(visibleJobs);
      setAssignments(assignments);
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
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

  // Derive unique companies and clients for filter dropdowns
  const uniqueCompanies = Array.from(new Set(
    bookings.map(b => companyNameOf(b)).filter(Boolean)
  )) as string[];

  const uniqueClients = Array.from(new Set(
    bookings.map(b => clientNameOf(b)).filter(Boolean)
  )) as string[];

  const filteredBookings = bookings.filter(b => {
    const pickupCity = b.pickupLocations?.[0]?.address?.city || b.pickup?.address?.city || "";
    const dropoffCity = b.dropoffLocations?.[b.dropoffLocations?.length - 1]?.address?.city || b.dropoff?.address?.city || "";
    const matchesSearch =
      b._id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.tripId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      // The ID this table shows (INV-xxx / CASH-xxx) and the TPIN column.
      (newIdByBooking[b._id] || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      tpinOf(b).toLowerCase().includes(searchQuery.toLowerCase()) ||
      clientNameOf(b).toLowerCase().includes(searchQuery.toLowerCase()) ||
      pickupCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dropoffCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(assignments.find(a => (a.bookingId?._id || a.bookingId) === b._id)?.truckNumber || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCompany = companyFilter === "all" || companyNameOf(b) === companyFilter;
    const matchesClient = clientFilter === "all" || clientNameOf(b) === clientFilter;
    const matchesDate = inDateRange(b.createdAt || b.metadata?.createdAt, dateFrom, dateTo);
    return matchesSearch && matchesCompany && matchesClient && matchesDate;
  });

  const jobsData = filteredBookings.map(b => {
    const pickupLocs = b?.pickupLocations?.length > 0 ? b.pickupLocations : (b?.pickup ? [b.pickup] : []);
    const dropoffLocs = b?.dropoffLocations?.length > 0 ? b.dropoffLocations : (b?.dropoff ? [b.dropoff] : []);
    const allLocs = [...pickupLocs, ...dropoffLocs];
    const route = allLocs.map((l: any) => l.address?.city).filter(Boolean) as string[];
    const assignment = assignments.find(a => (a.bookingId?._id || a.bookingId) === b._id);
    const tripStatus = (b?.tripStatus || b?.status || "").toLowerCase();
    // A reassigned trip is NOT done — it is driving the empty leg to the next
    // job's pickup, and it completes on arrival there.
    const effectiveStatus = b?.tripStatus || b?.status;
    const isComplete = isTripCompleted(b) || effectiveStatus?.toLowerCase() === "delivered";
    return {
      id: newIdByBooking[b?._id] || b?.tripId || `#FL-${b?._id?.substring(b._id.length - 4).toUpperCase()}`,
      client: clientNameOf(b, "Direct Client"),
      companyName: companyNameOf(b, "Direct Booking"),
      tpin: tpinOf(b),
      status: getStatusType(effectiveStatus),
      driver: assignment?.driverName ? cleanDriverName(assignment.driverName) : "Assign Driver",
      truck: String(assignment?.truckNumber || "").toUpperCase() || "Unassigned",
      date: formatDate(b?.createdAt || b?.metadata?.createdAt) || "—",
      route,
      isComplete,
      // Payment is "finalized" once a final amount has been set on the booking
      isPaymentFinalized: (b?.finalAmount || 0) > 0,
      // Who the invoice is addressed to; a combined invoice holds one party only.
      party: invoicePartyOf(b),
      // Billed tax trips only — cash trips are filed apart and never invoiced.
      // Raised only once printed — editing the drawer's fields does not count.
      isInvoiced: !!b?.invoicedAt || !!b?.invoiceGroupId,
      // An invoiced trip is already billed — combining it again would bill it twice.
      canCombine: isComplete && (b?.finalAmount || 0) > 0 && b?.withTax !== false && !!invoicePartyOf(b)
        && !b?.invoicedAt && !b?.invoiceGroupId,
      // Fully paid → status 'paid' or advance already covers the billed amount
      isFullyPaid: (b?.status || "").toLowerCase() === "paid"
        || ((b?.finalAmount || 0) > 0 && (b?.advancePaid || 0) >= (b?.finalAmount || 0)),
      raw: b
    };
  });

  // Only completed trips show on this page
  const completedRows = jobsData.filter(j => j.isComplete);
  // The stages overlap — an invoiced trip can still be waiting on its payment.
  const displayedData = stageFilter === "all" ? completedRows : completedRows.filter(STAGES[stageFilter].test);

  // Rows read oldest trip first on a combined invoice.
  const oldestFirst = (list: any[]) =>
    [...list].sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

  // The first ticked trip fixes the company; the rest must match it.
  const firstSelected = bookings.find(b => selectedIds.has(String(b._id)));
  const selectedParty = firstSelected ? invoicePartyOf(firstSelected) : "";

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const openCombinedInvoice = () =>
    setInvoiceGroup(oldestFirst(bookings.filter(b => selectedIds.has(String(b._id)))));

  // A trip already on a combined invoice opens that whole invoice.
  const openInvoice = (b: any) => {
    const members = b.invoiceGroupId ? bookings.filter(x => x.invoiceGroupId === b.invoiceGroupId) : [];
    if (members.length > 1) setInvoiceGroup(oldestFirst(members));
    else setInvoiceJob(b);
  };

  const columns = [
    {
      label: "",
      key: "select",
      render: (_: any, row: any) => {
        if (accountType === "employee" || !row.canCombine) return null;
        const id = String(row.raw._id);
        const otherCompany = !!selectedParty && selectedParty !== row.party;
        return (
          <input
            type="checkbox"
            checked={selectedIds.has(id)}
            disabled={otherCompany}
            onClick={(e) => e.stopPropagation()}
            onChange={() => toggleSelect(id)}
            title={otherCompany ? "Only trips of the same company can share an invoice" : "Select for a combined invoice"}
            className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer disabled:cursor-not-allowed disabled:opacity-30"
          />
        );
      }
    },
    {
      label: "TRIP ID",
      key: "id",
      render: (val: string, row: any) => (
        <div className="flex items-center gap-2">
          <span title="Trip Completed" className="w-2 h-2 rounded-full shrink-0 bg-slate-400" />
          <span className="text-[12px] font-bold text-orange-500 tracking-tight">{val}</span>
          {row.raw.invoiceGroupId && (
            <span title="On a combined invoice" className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[8px] font-bold uppercase tracking-wider">
              Combined
            </span>
          )}
        </div>
      )
    },
    {
      // The day the booking was created.
      label: "DATE",
      key: "date",
      render: (val: string) => <span className="text-[11px] font-medium text-slate-500 whitespace-nowrap">{val}</span>
    },
    {
      label: "CLIENT",
      key: "client",
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
      label: "TPIN",
      key: "tpin",
      render: (val: string) => val
        ? <span className="text-[11px] font-semibold text-slate-600 whitespace-nowrap">{val}</span>
        : <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Missing</span>
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
      label: "TRUCK",
      key: "truck",
      render: (val: string, row: any) => (
        <div className="relative group inline-flex">
          <span className="text-[12px] font-medium text-slate-600 cursor-default">{val}</span>
          <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none">
            Driver: {row.driver}
            <div className="absolute top-full left-3 border-4 border-transparent border-t-slate-900" />
          </div>
        </div>
      )
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
        <div className="flex gap-2 justify-center items-center">
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
          {/* Payment not finalized yet → finalize the deal · finalized → generate invoice */}
          {accountType === "employee" ? null : !row.isPaymentFinalized ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedRequest(row.raw);
                setIsFinalizeDrawerOpen(true);
              }}
              className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"
            >
              Finalize
            </button>
          ) : (
            <>
              {/* Not fully paid → record the remaining payment (client ledger) */}
              {!row.isFullyPaid && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPayTrip(row.raw);
                  }}
                  className="px-3 py-1.5 bg-amber-500 text-white text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"
                >
                  Receive Payment
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openInvoice(row.raw);
                }}
                className={row.isInvoiced
                  ? "px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:bg-emerald-50 transition-all"
                  : "px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"}
              >
                {row.isInvoiced ? "View Invoice" : "Generate Invoice"}
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  const kpis = [
    {
      label: "COMPLETED",
      value: completedRows.length.toString(),
      icon: <CheckSquare className="w-5 h-5 text-emerald-500" />,
      subText: "Trips delivered",
      trend: "Done",
      variant: "success" as const
    },
    {
      label: "TOTAL JOBS",
      value: bookings.length.toString(),
      icon: <Package className="w-5 h-5 text-indigo-500" />,
      subText: "All approved jobs",
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
              <span className="text-primary">Completed Jobs</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Completed Jobs</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">All delivered and finished trips.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-primary/20 transition-all">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[24px] font-bold text-slate-900">{kpi.value}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-500">
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

        <CommonTable
          title="Completed Trips"
          icon={<CheckSquare className="w-4 h-4 text-emerald-500" />}
          columns={columns}
          data={isLoading ? [] : displayedData}
          pageSize={10}
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
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)}
                className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer max-w-[180px]"
              >
                <option value="all">All Trips ({completedRows.length})</option>
                {(Object.keys(STAGES) as (keyof typeof STAGES)[]).map(k => (
                  <option key={k} value={k}>{STAGES[k].label} ({completedRows.filter(STAGES[k].test).length})</option>
                ))}
              </select>
              <DateRangeFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t); }} />
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={openCombinedInvoice}
                    disabled={selectedIds.size < 2}
                    title={selectedIds.size < 2 ? "Tick at least two trips" : "One invoice for the ticked trips"}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Combined Invoice ({selectedIds.size})
                  </button>
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    title="Clear selection"
                    className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
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
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">No Completed Trips Found</p>
              </div>
            )
          }
        />

        <FinalizeDealDrawer
          isOpen={isFinalizeDrawerOpen}
          onClose={() => { setIsFinalizeDrawerOpen(false); setSelectedRequest(null); }}
          request={selectedRequest ? {
            ...selectedRequest,
            id: selectedRequest.tripId,
            customer: clientNameOf(selectedRequest, "Direct Client"),
            price: selectedRequest.finalAmount ? `K${selectedRequest.finalAmount}` : "TBD",
          } : null}
          onSubmit={async (data) => {
            if (selectedRequest) {
              await bookingService.updateStatus(selectedRequest._id, "finalized", {
                finalAmount: Number(data.amount),
                advancePaid: Number(data.advancePaid),
                specialRequest: data.specialRequest,
              });
              await loadBookings();
            }
            setIsFinalizeDrawerOpen(false);
            setSelectedRequest(null);
          }}
        />

        <InvoiceDrawer
          isOpen={!!invoiceJob || !!invoiceGroup}
          onClose={() => { setInvoiceJob(null); setInvoiceGroup(null); }}
          booking={invoiceJob}
          invoiceId={invoiceJob ? newIdByBooking[invoiceJob._id] : undefined}
          group={invoiceGroup || undefined}
          invoiceIds={newIdByBooking}
          onInvoiceChanged={() => { setSelectedIds(new Set()); loadBookings(); }}
        />

        <ReceivePaymentDrawer
          isOpen={!!payTrip}
          onClose={() => setPayTrip(null)}
          booking={payTrip}
          onSubmit={async ({ amount }) => {
            if (!payTrip) return;
            const billed = Number(payTrip.finalAmount || 0);
            const newPaid = Number(payTrip.advancePaid || 0) + amount;
            const fullyPaid = billed > 0 && newPaid >= billed;
            await bookingService.updateStatus(
              payTrip._id,
              fullyPaid ? "paid" : "finalized",
              { advancePaid: newPaid }
            );
            await loadBookings();
          }}
        />
      </div>
    </AdminLayout>
  );
}
