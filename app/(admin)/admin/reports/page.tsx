"use client";

import { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  ChevronRight, RefreshCw, TrendingUp, TrendingDown,
  Fuel, ShieldAlert, Wallet, ReceiptText, Landmark, Truck, X, Download,
} from "lucide-react";
import { bookingService }         from "@/services/bookingService";
import { settlementService }      from "@/services/settlementService";
import { truckInspectionService } from "@/services/truckInspectionService";
import { assignmentService }      from "@/services/assignmentService";

// ── helpers ───────────────────────────────────────────────────────────────────
const N = (v: any) => parseFloat(String(v ?? 0).replace(/[^\d.-]/g, "")) || 0;
const naira   = (n: number) => `₦${Math.round(n).toLocaleString("en")}`;
const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const shortId = (id: any) => (typeof id === "string" ? id : id?._id ?? "")?.slice(-8)?.toUpperCase() || "—";

// clean "null" literals from driver names e.g. "First null Last"
const cleanName = (n: any) =>
  String(n || "").replace(/\bnull\b/gi, "").replace(/\s+/g, " ").trim() || "-";

function exportReport(
  from: string, to: string, stats: any,
  filteredSettlements: any[], filteredInspections: any[],
  driverByBooking: Record<string, string>,
) {
  // Build CSV rows — amounts as plain integers (no currency symbol)
  const rows: string[][] = [];
  const push = (...cols: (string | number)[]) => rows.push(cols.map(c => String(c ?? "")));
  const gap = () => rows.push([]);
  const hdr = (...cols: string[]) => rows.push(cols);   // header labels (same as data, styled in post-processing by Excel)

  push(`Operations Report: ${from} to ${to}`);
  gap();

  hdr("SUMMARY", "Amount (NGN)");
  push("Net P&L",          Math.round(stats.netPnL));
  push("Total Revenue",    Math.round(stats.totalRevenue));
  push("Total Costs",      Math.round(stats.totalCosts));
  push("Advance Received", Math.round(stats.advancePaid));
  push("Pending Revenue",  Math.round(stats.pendingRevenue));
  push("Completed Trips",  stats.completedTrips);
  push("Total Bookings",   stats.totalBookings);
  gap();

  hdr("COST BREAKDOWN", "Amount (NGN)");
  push("Driver Allocation", Math.round(stats.allocationCost));
  push("Fuel Cost",         Math.round(stats.fuelCost));
  push("Toll Charges",      Math.round(stats.tollAmount));
  push("Damages",           Math.round(stats.totalDamages));
  push("Council Levy",      Math.round(stats.councilLevy));
  push("Other Expenses",    Math.round(stats.otherExpenses));
  push("TOTAL COSTS",       Math.round(stats.totalCosts));
  gap();

  // ── Driver Allocation ──
  hdr("DRIVER ALLOCATION DETAILS");
  hdr("Booking Ref", "Driver", "Date", "Cash Allocation (NGN)");
  filteredSettlements.forEach(st => {
    const bId = typeof st.bookingId === "string" ? st.bookingId : st.bookingId?._id;
    const alloc = N(st.financials?.cashAllocation);
    if (!alloc) return;
    push(bId ? bId.slice(-8).toUpperCase() : "-", cleanName(driverByBooking[bId]), fmtDate(st.createdAt), Math.round(alloc));
  });
  push("", "", "TOTAL", Math.round(stats.allocationCost));
  gap();

  // ── Fuel Details ──
  hdr("FUEL COST DETAILS");
  hdr("Booking Ref", "Driver", "Date", "From", "To", "KM", "Liters", "Rate (NGN/L)", "Amount (NGN)");
  filteredSettlements.forEach(st => {
    if (!N(st.financials?.fuelTotal)) return;
    const bId = typeof st.bookingId === "string" ? st.bookingId : st.bookingId?._id;
    const bRef = bId ? bId.slice(-8).toUpperCase() : "-";
    const driver = cleanName(driverByBooking[bId]);
    const legs: any[] = Array.isArray(st.fuelDetails?.legs) ? st.fuelDetails.legs : [];
    if (legs.length) {
      legs.forEach((leg: any) => push(bRef, driver, fmtDate(st.createdAt), leg.from ?? "-", leg.to ?? "-", leg.km ?? "-", leg.liters != null ? Number(leg.liters).toFixed(1) : "-", leg.mileage ?? "-", Math.round(N(leg.amount))));
    } else {
      push(bRef, driver, fmtDate(st.createdAt), "-", "-", "-", "-", "-", Math.round(N(st.financials?.fuelTotal)));
    }
  });
  push("", "", "", "", "", "", "", "TOTAL", Math.round(stats.fuelCost));
  gap();

  // ── Council Levy ──
  hdr("COUNCIL LEVY DETAILS");
  hdr("Booking Ref", "Driver", "Date", "Council Levy (NGN)");
  filteredSettlements.forEach(st => {
    const bId = typeof st.bookingId === "string" ? st.bookingId : st.bookingId?._id;
    const levy = N(st.financials?.councilLevy);
    if (!levy) return;
    push(bId ? bId.slice(-8).toUpperCase() : "-", cleanName(driverByBooking[bId]), fmtDate(st.createdAt), Math.round(levy));
  });
  push("", "", "TOTAL", Math.round(stats.councilLevy));
  gap();

  // ── Damages ──
  hdr("DAMAGE INCIDENTS");
  hdr("Driver", "Truck", "Date", "Item", "Quantity", "Amount (NGN)");
  filteredInspections.filter(i => Array.isArray(i.damages) && i.damages.length > 0).forEach(insp => {
    (insp.damages as any[]).forEach((d: any) => push(
      cleanName(insp.driverId?.name),
      insp.truckId?.truckId || insp.truckId || "-",
      fmtDate(insp.createdAt),
      d.description || "-", d.quantity ?? "-", Math.round(N(d.amount)),
    ));
  });
  push("", "", "", "", "TOTAL", Math.round(stats.totalDamages));
  gap();

  // ── Expense Categories ──
  if (Object.keys(stats.categoryTotals).length) {
    hdr("EXPENSE CATEGORIES");
    hdr("Category", "Amount (NGN)");
    Object.entries(stats.categoryTotals)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([cat, v]) => push(cat, Math.round(v as number)));
    push("TOTAL", Math.round(stats.otherExpenses));
  }

  // Serialise to CSV — quote every cell, escape internal quotes
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");

  // UTF-8 BOM — makes Excel auto-detect encoding correctly (no garbled chars)
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `report_${from}_to_${to}.csv`;
  a.click();
}

function inPeriod(dateStr: string | undefined, from: string, to: string) {
  if (!dateStr) return true;
  const d = new Date(dateStr).getTime();
  const f = from ? new Date(from).getTime() : -Infinity;
  const t = to   ? new Date(to + "T23:59:59").getTime() : Infinity;
  return d >= f && d <= t;
}

// ── types ─────────────────────────────────────────────────────────────────────
type DetailType = "allocation" | "fuel" | "levy" | "damages" | null;

// ── accent map ────────────────────────────────────────────────────────────────
const AM: Record<string, { text: string; border: string; iconBg: string }> = {
  emerald: { text: "text-emerald-700", border: "border-emerald-100", iconBg: "bg-emerald-100" },
  rose:    { text: "text-rose-600",    border: "border-rose-100",    iconBg: "bg-rose-100" },
  blue:    { text: "text-blue-600",    border: "border-blue-100",    iconBg: "bg-blue-100" },
  amber:   { text: "text-amber-600",   border: "border-amber-100",   iconBg: "bg-amber-100" },
  violet:  { text: "text-violet-600",  border: "border-violet-100",  iconBg: "bg-violet-100" },
  orange:  { text: "text-orange-600",  border: "border-orange-100",  iconBg: "bg-orange-100" },
  slate:   { text: "text-slate-600",   border: "border-slate-200",   iconBg: "bg-slate-200" },
  indigo:  { text: "text-indigo-600",  border: "border-indigo-100",  iconBg: "bg-indigo-100" },
};

// ── SummaryCard ───────────────────────────────────────────────────────────────
function SummaryCard({
  label, value, sub, icon, accent, onClick,
}: {
  label: string; value: string; sub?: string;
  icon: React.ReactNode; accent: string; onClick?: () => void;
}) {
  const c = AM[accent] ?? AM.slate;
  return (
    <div
      onClick={onClick}
      className={`bg-white border ${c.border} rounded-2xl p-5 shadow-sm flex items-start gap-4
        ${onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all" : ""}`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg} ${c.text}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-[22px] font-bold leading-none ${c.text}`}>{value}</p>
        {sub && <p className="text-[10px] text-neutral-400 mt-1">{sub}</p>}
        {onClick && <p className="text-[9px] text-primary font-bold uppercase tracking-widest mt-2">Click for details →</p>}
      </div>
    </div>
  );
}

// ── BreakdownRow ──────────────────────────────────────────────────────────────
function BreakdownRow({ label, value, pct, color }: { label: string; value: string; pct: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-semibold text-slate-700">{label}</span>
        <span className="text-[11px] font-bold text-slate-900">{value}</span>
      </div>
      <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <p className="text-[9px] text-neutral-400 text-right">{pct.toFixed(1)}% of total costs</p>
    </div>
  );
}

// ── th / td helpers ───────────────────────────────────────────────────────────
const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="pb-2.5 pr-4 text-[9px] font-bold text-neutral-400 uppercase tracking-widest whitespace-nowrap">{children}</th>
);
const Td = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <td className={`py-2.5 pr-4 text-[11px] text-slate-600 ${right ? "text-right pr-0" : ""}`}>{children}</td>
);

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [bookings,    setBookings]    = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [detail,      setDetail]      = useState<DetailType>(null);

  const currentYear = new Date().getFullYear();
  const [from, setFrom] = useState(`${currentYear}-01-01`);
  const [to,   setTo]   = useState(new Date().toISOString().slice(0, 10));

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [b, s, i, a] = await Promise.allSettled([
        bookingService.getAll(),
        settlementService.getAll(),
        truckInspectionService.getAll(),
        assignmentService.getAll(),
      ]);
      setBookings(    b.status === "fulfilled" ? (b.value || []) : []);
      setSettlements( s.status === "fulfilled" ? (s.value || []) : []);
      setInspections( i.status === "fulfilled" ? (i.value || []) : []);
      setAssignments( a.status === "fulfilled" ? (a.value || []) : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  // bookingId → driverName  (from assignments)
  const driverByBooking = useMemo(() => {
    const map: Record<string, string> = {};
    assignments.forEach((a: any) => {
      const bId = typeof a.bookingId === "string" ? a.bookingId : a.bookingId?._id;
      if (bId && a.driverName) map[bId] = a.driverName;
    });
    return map;
  }, [assignments]);

  // ── filtered ─────────────────────────────────────────────────────────────────
  const filteredBookings    = useMemo(() => bookings.filter(b  => inPeriod(b.cargoDetails?.loadingDate || b.createdAt, from, to)), [bookings, from, to]);
  const filteredSettlements = useMemo(() => settlements.filter(s => inPeriod(s.createdAt, from, to)), [settlements, from, to]);
  const filteredInspections = useMemo(() => inspections.filter(i => inPeriod(i.createdAt, from, to)), [inspections, from, to]);

  // ── aggregates ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalRevenue   = filteredBookings.reduce((s, b) => s + N(b.finalAmount), 0);
    const advancePaid    = filteredBookings.reduce((s, b) => s + N(b.advancePaid), 0);
    const completedTrips = filteredBookings.filter(b => b.status === "Completed" || b.tripStatus === "delivered").length;
    const pendingRevenue = filteredBookings.filter(b => b.status !== "Completed" && b.tripStatus !== "delivered").reduce((s, b) => s + N(b.finalAmount), 0);

    const allocationCost = filteredSettlements.reduce((s, st) => s + N(st.financials?.cashAllocation), 0);
    const fuelCost       = filteredSettlements.reduce((s, st) => s + N(st.financials?.fuelTotal), 0);
    const tollAmount     = filteredSettlements.reduce((s, st) => s + N(st.tollAmount), 0);
    const councilLevy    = filteredSettlements.reduce((s, st) => s + N(st.financials?.councilLevy), 0);
    const otherExpenses  = filteredSettlements.reduce((s, st) =>
      s + (Array.isArray(st.expenses) ? st.expenses : []).reduce((ea: number, ex: any) => ea + N(ex.amount), 0), 0);

    const totalDamages    = filteredInspections.reduce((s, insp) =>
      s + (Array.isArray(insp.damages) ? insp.damages : []).reduce((da: number, d: any) => da + N(d.amount), 0), 0);
    const damageIncidents = filteredInspections.filter(i => Array.isArray(i.damages) && i.damages.length > 0).length;

    const categoryTotals: Record<string, number> = {};
    filteredSettlements.forEach(st =>
      (Array.isArray(st.expenses) ? st.expenses : []).forEach((ex: any) => {
        const cat = ex.category || "Uncategorized";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + N(ex.amount);
      })
    );

    const totalCosts = allocationCost + fuelCost + tollAmount + councilLevy + otherExpenses + totalDamages;
    const netPnL     = totalRevenue - totalCosts;

    return {
      totalRevenue, advancePaid, pendingRevenue, completedTrips,
      allocationCost, fuelCost, tollAmount, councilLevy, otherExpenses,
      totalDamages, damageIncidents, totalCosts, netPnL,
      categoryTotals, totalBookings: filteredBookings.length, totalSettlements: filteredSettlements.length,
    };
  }, [filteredBookings, filteredSettlements, filteredInspections]);

  const costEntries = [
    { label: "Driver Allocation", value: stats.allocationCost, color: "bg-blue-400" },
    { label: "Fuel Cost",         value: stats.fuelCost,       color: "bg-amber-400" },
    { label: "Toll Charges",      value: stats.tollAmount,     color: "bg-orange-400" },
    { label: "Damages",           value: stats.totalDamages,   color: "bg-rose-400" },
    { label: "Council Levy",      value: stats.councilLevy,    color: "bg-violet-400" },
    { label: "Other Expenses",    value: stats.otherExpenses,  color: "bg-slate-400" },
  ].filter(e => e.value > 0);

  // ── drawer title map ──────────────────────────────────────────────────────────
  const drawerMeta: Record<NonNullable<DetailType>, { title: string; sub: string; accent: string }> = {
    allocation: { title: "Driver Allocation Details", sub: "Cash allocated per trip settlement", accent: "text-blue-600" },
    fuel:       { title: "Fuel Cost Details",         sub: "Fuel legs & consumption per trip",   accent: "text-amber-600" },
    levy:       { title: "Council Levy Details",      sub: "Council levy charged per trip",       accent: "text-violet-600" },
    damages:    { title: "Damage Details by Driver",  sub: "Per-driver damage items & amounts",   accent: "text-rose-600" },
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 pb-20 space-y-8 bg-neutral-50 min-h-screen">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] text-neutral-400 mb-1 font-medium uppercase tracking-widest">
              <span>Operations</span>
              <ChevronRight className="w-2.5 h-2.5" />
              <span className="text-primary">Reports</span>
            </div>
            <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">Financial & Operations Report</h1>
            <p className="text-[11px] text-neutral-400 mt-0.5">Revenue, costs, damages, and trip settlement summary.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="border border-neutral-200 rounded-xl px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-primary bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="border border-neutral-200 rounded-xl px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-primary bg-white" />
            </div>
            <button onClick={loadAll} disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => exportReport(from, to, stats, filteredSettlements, filteredInspections, driverByBooking)}
              disabled={isLoading || (!filteredSettlements.length && !filteredInspections.length)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Loading report data…</p>
          </div>
        )}
        {error && !isLoading && (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-[12px] text-rose-600 font-medium">{error}</div>
        )}

        {!isLoading && !error && (
          <>
            {/* ── P&L Banner ── */}
            <div className={`rounded-2xl p-6 border flex flex-col sm:flex-row sm:items-center justify-between gap-4
              ${stats.netPnL >= 0 ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center
                  ${stats.netPnL >= 0 ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                  {stats.netPnL >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Net P&amp;L · {from} → {to}</p>
                  <p className={`text-[28px] font-bold leading-none mt-0.5 ${stats.netPnL >= 0 ? "text-emerald-700" : "text-rose-600"}`}>
                    {stats.netPnL >= 0 ? "+" : ""}{naira(stats.netPnL)}
                  </p>
                </div>
              </div>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Revenue</p>
                  <p className="text-[16px] font-bold text-emerald-600">{naira(stats.totalRevenue)}</p>
                </div>
                <div className="w-px bg-neutral-200" />
                <div>
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Total Costs</p>
                  <p className="text-[16px] font-bold text-rose-500">{naira(stats.totalCosts)}</p>
                </div>
                <div className="w-px bg-neutral-200" />
                <div>
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Trips Done</p>
                  <p className="text-[16px] font-bold text-slate-700">{stats.completedTrips}</p>
                </div>
              </div>
            </div>

            {/* ── Revenue ── */}
            <div>
              <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Revenue
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard label="Total Revenue"    value={naira(stats.totalRevenue)}   sub={`${stats.totalBookings} bookings`}           icon={<TrendingUp className="w-5 h-5" />} accent="emerald" />
                <SummaryCard label="Advance Received" value={naira(stats.advancePaid)}    sub="Cash collected from clients"                  icon={<Wallet className="w-5 h-5" />}     accent="blue" />
                <SummaryCard label="Pending Revenue"  value={naira(stats.pendingRevenue)} sub="Active / unconfirmed bookings"                icon={<ReceiptText className="w-5 h-5" />} accent="amber" />
                <SummaryCard label="Completed Trips"  value={stats.completedTrips.toString()} sub={`of ${stats.totalBookings} total bookings`} icon={<Truck className="w-5 h-5" />}   accent="indigo" />
              </div>
            </div>

            {/* ── Costs — clickable cards ── */}
            <div>
              <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Costs &amp; Expenses
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SummaryCard label="Driver Allocation" value={naira(stats.allocationCost)} sub={`${stats.totalSettlements} settlements`}                              icon={<Wallet className="w-5 h-5" />}     accent="blue"   onClick={() => setDetail("allocation")} />
                <SummaryCard label="Fuel Cost"         value={naira(stats.fuelCost)}       sub="Total fuel across all trips"                                          icon={<Fuel className="w-5 h-5" />}       accent="amber"  onClick={() => setDetail("fuel")} />
                <SummaryCard label="Toll Charges"      value={naira(stats.tollAmount)}     sub="Accumulated toll fees"                                                icon={<Landmark className="w-5 h-5" />}   accent="orange" />
                <SummaryCard label="Damages"           value={naira(stats.totalDamages)}   sub={`${stats.damageIncidents} incident${stats.damageIncidents !== 1 ? "s" : ""}`} icon={<ShieldAlert className="w-5 h-5" />} accent="rose"   onClick={() => setDetail("damages")} />
                <SummaryCard label="Council Levy"      value={naira(stats.councilLevy)}    sub="Municipal / council taxes"                                            icon={<Landmark className="w-5 h-5" />}   accent="violet" onClick={() => setDetail("levy")} />
                <SummaryCard label="Other Expenses"    value={naira(stats.otherExpenses)}  sub="Misc trip expenses"                                                   icon={<ReceiptText className="w-5 h-5" />} accent="slate" />
              </div>
            </div>

            {/* ── Cost Breakdown + Categories ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm space-y-5">
                <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Cost Breakdown
                </h3>
                {stats.totalCosts === 0
                  ? <p className="text-[11px] text-neutral-300 font-medium text-center py-6">No cost data in this period</p>
                  : <div className="space-y-4">{costEntries.map(e => (
                      <BreakdownRow key={e.label} label={e.label} value={naira(e.value)}
                        pct={stats.totalCosts > 0 ? (e.value / stats.totalCosts) * 100 : 0} color={e.color} />
                    ))}</div>
                }
              </div>
              <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Expense Categories
                </h3>
                {Object.keys(stats.categoryTotals).length === 0
                  ? <p className="text-[11px] text-neutral-300 font-medium text-center py-6">No categorized expenses in this period</p>
                  : <div className="divide-y divide-neutral-50">
                      {Object.entries(stats.categoryTotals).sort(([, a], [, b]) => b - a).map(([cat, amt]) => (
                        <div key={cat} className="flex items-center justify-between py-3">
                          <span className="text-[12px] font-semibold text-slate-700 capitalize">{cat}</span>
                          <span className="text-[12px] font-bold text-amber-600">{naira(amt)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-3">
                        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Total</span>
                        <span className="text-[13px] font-bold text-slate-900">{naira(stats.otherExpenses)}</span>
                      </div>
                    </div>
                }
              </div>
            </div>

            {/* ── Damage Incidents Summary ── */}
            <div className="bg-white border border-neutral-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Damage Incidents
                <span className="ml-auto text-[11px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full">
                  {stats.damageIncidents} incident{stats.damageIncidents !== 1 ? "s" : ""}
                </span>
              </h3>
              {filteredInspections.filter(i => Array.isArray(i.damages) && i.damages.length > 0).length === 0
                ? <p className="text-[11px] text-neutral-300 font-medium text-center py-6">No damage incidents in this period</p>
                : <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-125">
                      <thead>
                        <tr className="border-b border-neutral-100">
                          <Th>Truck</Th><Th>Driver</Th><Th>Date</Th><Th>Items</Th>
                          <th className="pb-2.5 text-right text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Total Damage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-50">
                        {filteredInspections.filter(i => Array.isArray(i.damages) && i.damages.length > 0).map((insp, idx) => {
                          const dmgTotal = (insp.damages as any[]).reduce((s: number, d: any) => s + N(d.amount), 0);
                          return (
                            <tr key={idx}>
                              <Td><span className="font-semibold text-slate-900">{insp.truckId?.truckId || insp.truckId || "—"}</span></Td>
                              <Td>{insp.driverId?.name || "—"}</Td>
                              <Td>{fmtDate(insp.createdAt)}</Td>
                              <Td>{(insp.damages as any[]).length} item{(insp.damages as any[]).length !== 1 ? "s" : ""}</Td>
                              <td className="py-2.5 text-right font-bold text-rose-600 text-[11px]">{naira(dmgTotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-neutral-100">
                          <td colSpan={4} className="pt-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Damages</td>
                          <td className="pt-3 text-right text-[14px] font-bold text-rose-600">{naira(stats.totalDamages)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
              }
            </div>
          </>
        )}
      </div>

      {/* ── Detail Drawer ─────────────────────────────────────────────────────── */}
      {detail && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* backdrop */}
          <div className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm pointer-events-auto" onClick={() => setDetail(null)} />

          {/* panel */}
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl pointer-events-auto flex flex-col">

            {/* header */}
            <div className="p-6 border-b border-neutral-100 flex items-start justify-between gap-4 shrink-0">
              <div>
                <h2 className={`text-[15px] font-semibold ${drawerMeta[detail].accent}`}>{drawerMeta[detail].title}</h2>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{drawerMeta[detail].sub}</p>
              </div>
              <button onClick={() => setDetail(null)} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-neutral-50 text-neutral-400 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* ── ALLOCATION ── */}
              {detail === "allocation" && (
                <table className="w-full text-left">
                  <thead><tr className="border-b border-neutral-100"><Th>Booking Ref</Th><Th>Driver</Th><Th>Date</Th><th className="pb-2.5 text-right text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Cash Allocation</th></tr></thead>
                  <tbody className="divide-y divide-neutral-50">
                    {filteredSettlements.map((st, i) => {
                      const bId = typeof st.bookingId === "string" ? st.bookingId : st.bookingId?._id;
                      const driver = driverByBooking[bId] || "—";
                      const amt = N(st.financials?.cashAllocation);
                      if (!amt) return null;
                      return (
                        <tr key={i}>
                          <Td><span className="font-mono text-[10px] text-slate-500">{shortId(st.bookingId)}</span></Td>
                          <Td><span className="font-semibold text-slate-900">{driver}</span></Td>
                          <Td>{fmtDate(st.createdAt)}</Td>
                          <td className="py-2.5 text-right font-bold text-blue-600 text-[12px]">{naira(amt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-neutral-100">
                      <td colSpan={3} className="pt-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total</td>
                      <td className="pt-3 text-right text-[14px] font-bold text-blue-600">{naira(stats.allocationCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* ── FUEL ── */}
              {detail === "fuel" && (
                <div className="space-y-4">
                  {filteredSettlements.filter(st => N(st.financials?.fuelTotal) > 0).map((st, i) => {
                    const bId = typeof st.bookingId === "string" ? st.bookingId : st.bookingId?._id;
                    const driver = driverByBooking[bId] || "—";
                    const legs: any[] = Array.isArray(st.fuelDetails?.legs) ? st.fuelDetails.legs : [];
                    return (
                      <div key={i} className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-3">
                        {/* trip header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-mono text-[10px] text-slate-400">Booking: {shortId(st.bookingId)}</span>
                            <p className="text-[12px] font-semibold text-slate-900 mt-0.5">{driver}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{fmtDate(st.createdAt)}</p>
                            <p className="text-[14px] font-bold text-amber-600 mt-0.5">{naira(N(st.financials?.fuelTotal))}</p>
                          </div>
                        </div>
                        {/* legs */}
                        {legs.length > 0 && (
                          <table className="w-full text-left">
                            <thead>
                              <tr className="border-b border-neutral-200">
                                <Th>From → To</Th><Th>KM</Th><Th>Liters</Th><Th>Rate</Th>
                                <th className="pb-2 text-right text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                              {legs.map((leg: any, li: number) => (
                                <tr key={li}>
                                  <Td><span className="text-[10px]">{leg.from} → {leg.to}</span></Td>
                                  <Td>{leg.km ?? "—"}</Td>
                                  <Td>{leg.liters?.toFixed(1) ?? "—"} L</Td>
                                  <Td>₦{leg.mileage ?? "—"}/L</Td>
                                  <td className="py-2 text-right font-bold text-amber-600 text-[11px]">{naira(N(leg.amount))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {st.fuelDetails?.totalDistance && (
                          <p className="text-[10px] text-neutral-400">
                            Total: <b>{st.fuelDetails.totalDistance} km</b> · {st.fuelDetails.totalLiters?.toFixed(1)} L
                            · Rate ₦{st.fuelDetails.fuelRate}/L
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Fuel Cost</span>
                    <span className="text-[15px] font-bold text-amber-600">{naira(stats.fuelCost)}</span>
                  </div>
                </div>
              )}

              {/* ── COUNCIL LEVY ── */}
              {detail === "levy" && (
                <table className="w-full text-left">
                  <thead><tr className="border-b border-neutral-100"><Th>Booking Ref</Th><Th>Driver</Th><Th>Date</Th><th className="pb-2.5 text-right text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Council Levy</th></tr></thead>
                  <tbody className="divide-y divide-neutral-50">
                    {filteredSettlements.map((st, i) => {
                      const bId = typeof st.bookingId === "string" ? st.bookingId : st.bookingId?._id;
                      const driver = driverByBooking[bId] || "—";
                      const amt = N(st.financials?.councilLevy);
                      if (!amt) return null;
                      return (
                        <tr key={i}>
                          <Td><span className="font-mono text-[10px] text-slate-500">{shortId(st.bookingId)}</span></Td>
                          <Td><span className="font-semibold text-slate-900">{driver}</span></Td>
                          <Td>{fmtDate(st.createdAt)}</Td>
                          <td className="py-2.5 text-right font-bold text-violet-600 text-[12px]">{naira(amt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-neutral-100">
                      <td colSpan={3} className="pt-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total</td>
                      <td className="pt-3 text-right text-[14px] font-bold text-violet-600">{naira(stats.councilLevy)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}

              {/* ── DAMAGES ── */}
              {detail === "damages" && (
                <div className="space-y-4">
                  {filteredInspections.filter(i => Array.isArray(i.damages) && i.damages.length > 0).length === 0 && (
                    <p className="text-[11px] text-neutral-300 text-center py-10">No damage incidents in this period</p>
                  )}
                  {filteredInspections.filter(i => Array.isArray(i.damages) && i.damages.length > 0).map((insp, idx) => {
                    const dmgTotal = (insp.damages as any[]).reduce((s: number, d: any) => s + N(d.amount), 0);
                    const driverName = insp.driverId?.name || "—";
                    const truckLabel = insp.truckId?.truckId || insp.truckId || "—";
                    return (
                      <div key={idx} className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[12px] font-bold text-slate-900">{driverName}</p>
                            <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Truck: {truckLabel} · {fmtDate(insp.createdAt)}</p>
                          </div>
                          <p className="text-[15px] font-bold text-rose-600">{naira(dmgTotal)}</p>
                        </div>
                        <table className="w-full text-left">
                          <thead>
                            <tr className="border-b border-rose-100">
                              <Th>Damage Item</Th><Th>Qty</Th>
                              <th className="pb-2 text-right text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-50">
                            {(insp.damages as any[]).map((d: any, di: number) => (
                              <tr key={di}>
                                <Td><span className="text-slate-700">{d.description || `Item ${di + 1}`}</span></Td>
                                <Td>{d.quantity || "—"}</Td>
                                <td className="py-2 text-right font-bold text-rose-600 text-[11px]">{naira(N(d.amount))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                  {filteredInspections.filter(i => Array.isArray(i.damages) && i.damages.length > 0).length > 0 && (
                    <div className="flex justify-between items-center pt-2 border-t border-neutral-100">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Damages</span>
                      <span className="text-[15px] font-bold text-rose-600">{naira(stats.totalDamages)}</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
