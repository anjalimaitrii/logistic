"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import CommonTable from "@/components/admin/CommonTable";
import FinalizeDealDrawer from "@/components/admin/FinalizeDealDrawer";
import ReceivePaymentDrawer from "@/components/admin/ReceivePaymentDrawer";
import InvoiceDrawer from "@/components/admin/InvoiceDrawer";
import { bookingService } from "@/services/bookingService";
import { completionService } from "@/services/completionService";
import { Package, ChevronRight, Receipt, ShieldOff } from "lucide-react";
import { formatDate, toAppDateKey } from "@/lib/datetime";

export default function SecretJobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // bookingId → new id (INV-xxx / CASH-xxx) filed at completion
  const [newIdByBooking, setNewIdByBooking] = useState<Record<string, string>>({});

  // Filters
  const [taxFilter, setTaxFilter] = useState<"all" | "with" | "without">("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // Action drawers
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isFinalizeDrawerOpen, setIsFinalizeDrawerOpen] = useState(false);
  const [payTrip, setPayTrip] = useState<any | null>(null);
  const [invoiceJob, setInvoiceJob] = useState<any | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setIsLoading(true);
      const [all, invData, cashData] = await Promise.all([
        bookingService.getAll(),
        completionService.getInvoices().catch(() => []),
        completionService.getCash().catch(() => []),
      ]);
      // All COMPLETED trips (with or without tax, from any source) — i.e. trips whose
      // id has already rolled over to a completion id (INV-xxx / CASH-xxx).
      const completed = (all || []).filter((b: any) => {
        const ts = (b.tripStatus || "").toLowerCase();
        const hasNewJob = (b.timeline || []).some((e: any) => e.title === "New Job Assigned");
        return ts === "completed" || ts === "delivered" || (ts === "returning" && hasNewJob);
      });
      setJobs(completed);

      // bookingId → INV-xxx / CASH-xxx
      const idMap: Record<string, string> = {};
      (invData || []).forEach((r: any) => {
        const bId = (r.bookingId?._id || r.bookingId)?.toString();
        if (bId && r.invoiceId) idMap[bId] = String(r.invoiceId).toUpperCase();
      });
      (cashData || []).forEach((r: any) => {
        const bId = (r.bookingId?._id || r.bookingId)?.toString();
        if (bId && r.cashId) idMap[bId] = String(r.cashId).toUpperCase();
      });
      setNewIdByBooking(idMap);
    } catch (err) {
      console.error("Failed to load secret jobs:", err);
    } finally {
      setIsLoading(false);
    }
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

  // Unique clients / companies for the filter dropdowns
  const uniqueClients = Array.from(new Set(
    jobs.map((b) => (b.clientId as any)?.name || b.metadata?.client).filter(Boolean)
  )) as string[];
  const uniqueCompanies = Array.from(new Set(
    jobs.map((b) => (b.clientId as any)?.company?.companyName).filter(Boolean)
  )) as string[];

  const filtered = useMemo(() => {
    return jobs.filter((b) => {
      const matchesTax =
        taxFilter === "all" ||
        (taxFilter === "with" && b.withTax === true) ||
        (taxFilter === "without" && b.withTax === false);

      const clientName = (b.clientId as any)?.name || b.metadata?.client || "";
      const matchesClient = clientFilter === "all" || clientName === clientFilter;

      const companyName = (b.clientId as any)?.company?.companyName || "";
      const matchesCompany = companyFilter === "all" || companyName === companyFilter;

      let matchesDate = true;
      if (dateFilter) {
        const created = b.createdAt ? toAppDateKey(b.createdAt) : "";
        matchesDate = created === dateFilter;
      }

      return matchesTax && matchesClient && matchesCompany && matchesDate;
    });
  }, [jobs, taxFilter, clientFilter, companyFilter, dateFilter]);

  const tableData = filtered.map((b) => ({
    id: newIdByBooking[b._id] || b.tripId || `#SL-${b._id?.slice(-4).toUpperCase()}`,
    client: (b.clientId as any)?.name || b.metadata?.client || "—",
    company: (b.clientId as any)?.company?.companyName || "Direct Booking",
    route: `${b.pickupLocations?.[0]?.address?.city || "Origin"} → ${b.dropoffLocations?.[0]?.address?.city || "Dest."}`,
    cargo: Array.isArray(b.cargoDetails?.goodsType) ? b.cargoDetails.goodsType.join(", ") : (b.cargoDetails?.goodsType || "—"),
    weight: b.cargoDetails?.weight ? `${b.cargoDetails.weight} KG` : "—",
    finalAmount: b.finalAmount ? `K${b.finalAmount.toLocaleString()}` : "TBD",
    advancePaid: b.advancePaid ? `K${b.advancePaid.toLocaleString()}` : "TBD",
    date: b.createdAt ? formatDate(b.createdAt) : "—",
    withTax: b.withTax === true,
    // Payment flags (same as normal completed-jobs page)
    isPaymentFinalized: (b?.finalAmount || 0) > 0,
    isFullyPaid: (b?.status || "").toLowerCase() === "paid"
      || ((b?.finalAmount || 0) > 0 && (b?.advancePaid || 0) >= (b?.finalAmount || 0)),
    raw: b,
  }));

  const columns = [
    {
      label: "Job ID",
      key: "id",
      render: (val: string) => <span className="font-bold text-indigo-600 text-[12px]">{val}</span>,
    },
    {
      label: "Client",
      key: "client",
      render: (val: string, row: any) => (
        <div className="flex flex-col gap-0.5">
          <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[7.5px] font-bold uppercase tracking-wider w-fit">{row.company}</span>
          <span className="font-bold text-neutral-900 text-[12px] capitalize">{val}</span>
        </div>
      ),
    },
    {
      label: "Route",
      key: "route",
      render: (val: string) => <span className="text-[12px] font-medium text-neutral-500 italic">{val}</span>,
    },
    {
      label: "Cargo",
      key: "cargo",
      render: (val: string, row: any) => (
        <div>
          <div className="text-[12px] font-medium text-neutral-900">{val}</div>
          <div className="text-[10px] text-neutral-400">{row.weight}</div>
        </div>
      ),
    },
    {
      label: "Final Amount",
      key: "finalAmount",
      render: (val: string) => <span className="text-[12px] font-bold text-slate-900">{val}</span>,
    },
    {
      label: "Advance Paid",
      key: "advancePaid",
      render: (val: string) => <span className="text-[12px] font-medium text-slate-500">{val}</span>,
    },
    {
      label: "Date",
      key: "date",
      render: (val: string) => <span className="text-[11px] text-neutral-400 font-medium">{val}</span>,
    },
    {
      label: "Tax",
      key: "withTax",
      render: (val: boolean) => (
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
          val
            ? "bg-indigo-50 text-indigo-600 border-indigo-200"
            : "bg-amber-50 text-amber-600 border-amber-200"
        }`}>
          {val
            ? <><Receipt className="w-2.5 h-2.5 inline mr-1" />With Tax</>
            : <><ShieldOff className="w-2.5 h-2.5 inline mr-1" />Without Tax</>}
        </span>
      ),
    },
    {
      label: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, row: any) => (
        <div className="flex gap-2 justify-center items-center">
          {/* Not finalized → finalize the deal · finalized → receive payment + generate invoice */}
          {!row.isPaymentFinalized ? (
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedRequest(row.raw); setIsFinalizeDrawerOpen(true); }}
              className="px-3 py-1.5 bg-slate-900 text-white text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"
            >
              Finalize
            </button>
          ) : (
            <>
              {!row.isFullyPaid && (
                <button
                  onClick={(e) => { e.stopPropagation(); setPayTrip(row.raw); }}
                  className="px-3 py-1.5 bg-amber-500 text-white text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"
                >
                  Receive Payment
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setInvoiceJob(row.raw); }}
                className="px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-semibold rounded-lg uppercase tracking-widest hover:brightness-110 transition-all shadow-sm"
              >
                Generate Invoice
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 pb-20 space-y-6 bg-neutral-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[9px] font-medium text-neutral-400 uppercase tracking-widest">
        <Link href="/admin/secret" className="hover:text-indigo-600 transition-colors">Secret Dashboard</Link>
        <ChevronRight className="w-2.5 h-2.5" />
        <span className="text-indigo-600 font-bold">Secret Jobs</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 rounded-l-2xl" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">Secret Jobs</h1>
          <p className="text-[11px] font-medium text-neutral-400 mt-0.5">All completed trips — with & without tax</p>
        </div>
        <div className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          {filtered.length} Job{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <CommonTable
        title="Completed Trips Ledger"
        icon="🔐"
        columns={columns}
        data={isLoading ? [] : tableData}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Tax toggle */}
            <div className="flex bg-neutral-50 border border-neutral-100 rounded-xl p-1 gap-1">
              {(["all", "without", "with"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTaxFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                    taxFilter === t
                      ? t === "with" ? "bg-indigo-600 text-white shadow-sm"
                      : t === "without" ? "bg-amber-500 text-white shadow-sm"
                      : "bg-slate-900 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-700"
                  }`}
                >
                  {t === "all" ? "All" : t === "with" ? "With Tax" : "Without Tax"}
                </button>
              ))}
            </div>

            {/* Date filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-neutral-100 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-600 outline-none focus:border-indigo-300 transition-all shadow-sm"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter("")}
                className="px-2.5 py-2 text-[9px] font-bold text-neutral-400 hover:text-rose-500 uppercase tracking-widest"
              >
                Clear
              </button>
            )}

            {/* Company filter */}
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-100 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:border-indigo-300 cursor-pointer max-w-[160px] shadow-sm"
            >
              <option value="all">All Companies</option>
              {uniqueCompanies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Client filter */}
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-neutral-100 rounded-xl text-[11px] font-bold text-slate-600 outline-none focus:border-indigo-300 cursor-pointer max-w-[160px] shadow-sm"
            >
              <option value="all">All Clients</option>
              {uniqueClients.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        }
        emptyState={
          isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Loading...</p>
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Package className="w-8 h-8 text-neutral-200" />
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">No secret jobs found</p>
            </div>
          )
        }
      />

      <FinalizeDealDrawer
        isOpen={isFinalizeDrawerOpen}
        onClose={() => { setIsFinalizeDrawerOpen(false); setSelectedRequest(null); }}
        request={selectedRequest}
        onSubmit={handleFinalize}
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
          await loadJobs();
        }}
      />

      <InvoiceDrawer
        isOpen={!!invoiceJob}
        onClose={() => setInvoiceJob(null)}
        booking={invoiceJob}
        invoiceId={invoiceJob ? newIdByBooking[invoiceJob._id] : undefined}
      />
    </div>
  );
}
