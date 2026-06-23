"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronRight, RefreshCw, TrendingUp, TrendingDown,
  Fuel, ShieldAlert, Wallet, ReceiptText, Landmark, Truck, X, Download, Scale,
} from "lucide-react";
import { bookingService }         from "@/services/bookingService";
import { settlementService }      from "@/services/settlementService";
import { truckInspectionService } from "@/services/truckInspectionService";
import { assignmentService }      from "@/services/assignmentService";
import { routeService }           from "@/services/routeService";
import { formatDate } from "@/lib/datetime";
import { cleanDriverName } from "@/services/liveTrackingService";

// ── helpers ───────────────────────────────────────────────────────────────────
const N = (v: any) => parseFloat(String(v ?? 0).replace(/[^\d.-]/g, "")) || 0;
const naira   = (n: number) => `K ${Math.round(n).toLocaleString("en")}`;
const fmtDate = (d: any) => d ? formatDate(d) : "—";
const shortId = (id: any) => (typeof id === "string" ? id : id?._id ?? "")?.slice(-8)?.toUpperCase() || "—";

// clean "null" literals from driver names e.g. "First null Last"
const cleanName = (n: any) =>
  String(n || "").replace(/\bnull\b/gi, "").replace(/\s+/g, " ").trim() || "-";

// ── Excel helpers ─────────────────────────────────────────────────────────────
function xlCell(val: string | number, type: "String" | "Number" = "String", bold = false, bg = "") {
  const style = (bold || bg)
    ? ` ss:StyleID="${bold && bg ? "hb" : bold ? "h" : "bg"}"`
    : "";
  const t = type === "Number" && !isNaN(Number(val)) ? "Number" : "String";
  return `<Cell${style}><Data ss:Type="${t}">${String(val ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Data></Cell>`;
}
function xlRow(...cells: string[]) { return `<Row>${cells.join("")}</Row>`; }
function xlBlank(cols = 2) { return `<Row>${Array(cols).fill('<Cell><Data ss:Type="String"></Data></Cell>').join("")}</Row>`; }
function xlSheet(name: string, rows: string[]) {
  return `<Worksheet ss:Name="${name}"><Table>${rows.join("")}</Table></Worksheet>`;
}

function exportReport(
  from: string, to: string, stats: any,
  filteredBookings: any[], filteredSettlements: any[], filteredInspections: any[],
  driverByBooking: Record<string, string>,
) {
  const S = (v: string | number) => xlCell(v, "String");
  const N2 = (v: number) => xlCell(v, "Number");
  const H = (v: string) => xlCell(v, "String", true, "#1e293b");   // bold header (dark)
  const SH = (v: string | number, bold = false) => xlCell(v, "String", bold);

  // ── Sheet 1: Summary ────────────────────────────────────────────────────────
  const summaryRows = [
    xlRow(xlCell(`Operations Report: ${from} to ${to}`, "String", true)),
    xlBlank(),
    xlRow(H("Metric"), H("Amount (NGN)")),
    xlRow(S("Net P&L"),          N2(Math.round(stats.netPnL))),
    xlRow(S("Total Revenue"),    N2(Math.round(stats.totalRevenue))),
    xlRow(S("Total Costs"),      N2(Math.round(stats.totalCosts))),
    xlRow(S("Advance Received"), N2(Math.round(stats.advancePaid))),
    xlRow(S("Pending Revenue"),  N2(Math.round(stats.pendingRevenue))),
    xlRow(S("Paid Trips"),  N2(stats.completedTrips)),
    xlRow(S("Total Bookings"),   N2(stats.totalBookings)),
    xlBlank(),
    xlRow(H("Cost Item"), H("Amount (NGN)")),
    xlRow(S("Driver Allocation"), N2(Math.round(stats.allocationCost))),
    xlRow(S("Fuel Cost"),         N2(Math.round(stats.fuelCost))),
    xlRow(S("Toll Charges"),      N2(Math.round(stats.tollAmount))),
    xlRow(S("Damages"),           N2(Math.round(stats.totalDamages))),
    xlRow(S("Council Levy"),      N2(Math.round(stats.councilLevy))),
    xlRow(S("Other Expenses"),    N2(Math.round(stats.otherExpenses))),
    xlRow(SH("TOTAL COSTS", true), N2(Math.round(stats.totalCosts))),
  ];
  if (Object.keys(stats.categoryTotals).length) {
    summaryRows.push(xlBlank(), xlRow(H("Expense Category"), H("Amount (NGN)")));
    Object.entries(stats.categoryTotals).sort(([, a], [, b]) => (b as number) - (a as number))
      .forEach(([cat, v]) => summaryRows.push(xlRow(S(cat), N2(Math.round(v as number)))));
  }

  // ── Sheet 2: Revenue ────────────────────────────────────────────────────────
  const revRows = [xlRow(H("Trip ID"), H("Driver"), H("Route"), H("Loading Date"), H("Final Amount (NGN)"), H("Advance Paid (NGN)"), H("Balance (NGN)"), H("Status"))];
  filteredBookings.filter(b => N(b.finalAmount) > 0).forEach(b => {
    const bId = b._id ?? "";
    const tripLabel = b.tripId || bId.slice(-7).toUpperCase();
    const driver = cleanName(driverByBooking[bId]);
    const locStr  = (v: any): string => { if (!v) return "-"; if (typeof v === "string") return v; return v?.address || [v?.plotNo, v?.street, v?.city, v?.state, v?.country].filter(Boolean).join(", ") || "-"; };
    const pickup  = locStr(Array.isArray(b.pickupLocations)  ? b.pickupLocations[0]  : (b.pickupLocations  || b.pickupLocation));
    const dropoff = locStr(Array.isArray(b.dropoffLocations) ? b.dropoffLocations[0] : (b.dropoffLocations || b.dropoffLocation));
    const balance = Math.round(N(b.finalAmount) - N(b.advancePaid));
    const status  = b.tripStatus || b.status || "-";
    revRows.push(xlRow(S(tripLabel), S(driver), S(`${pickup} → ${dropoff}`), S(fmtDate(b.cargoDetails?.loadingDate || b.createdAt)), N2(Math.round(N(b.finalAmount))), N2(Math.round(N(b.advancePaid))), N2(balance), S(status)));
  });
  revRows.push(xlBlank(8), xlRow(SH(""), SH(""), SH(""), SH(""), SH("TOTAL REVENUE", true), N2(Math.round(stats.totalRevenue)), N2(Math.round(stats.advancePaid)), SH("")));

  // ── Sheet 3: Driver Allocation ───────────────────────────────────────────────
  const allocRows = [xlRow(H("Booking Ref"), H("Driver"), H("Date"), H("Cash Allocation (NGN)"))];
  filteredSettlements.forEach(st => {
    const bId = typeof st.bookingId === "string" ? st.bookingId : st.bookingId?._id;
    const alloc = N(st.financials?.cashAllocation);
    if (!alloc) return;
    allocRows.push(xlRow(S(bId ? bId.slice(-8).toUpperCase() : "-"), S(cleanName(driverByBooking[bId])), S(fmtDate(st.createdAt)), N2(Math.round(alloc))));
  });
  allocRows.push(xlBlank(4), xlRow(SH(""), SH(""), SH("TOTAL", true), N2(Math.round(stats.allocationCost))));

  // ── Sheet 4: Fuel ────────────────────────────────────────────────────────────
  const fuelRows = [xlRow(H("Booking Ref"), H("Driver"), H("Date"), H("From"), H("To"), H("KM"), H("Liters"), H("Rate (NGN/L)"), H("Amount (NGN)"))];
  filteredSettlements.forEach(st => {
    if (!N(st.financials?.fuelTotal)) return;
    const bId = typeof st.bookingId === "string" ? st.bookingId : st.bookingId?._id;
    const bRef = bId ? bId.slice(-8).toUpperCase() : "-";
    const driver = cleanName(driverByBooking[bId]);
    const legs: any[] = Array.isArray(st.fuelDetails?.legs) ? st.fuelDetails.legs : [];
    if (legs.length) {
      legs.forEach((leg: any) => fuelRows.push(xlRow(S(bRef), S(driver), S(fmtDate(st.createdAt)), S(leg.from ?? "-"), S(leg.to ?? "-"), N2(Number(leg.km ?? 0)), N2(Number(leg.liters ?? 0)), N2(Number(leg.mileage ?? 0)), N2(Math.round(N(leg.amount))))));
    } else {
      fuelRows.push(xlRow(S(bRef), S(driver), S(fmtDate(st.createdAt)), S("-"), S("-"), N2(0), N2(0), N2(0), N2(Math.round(N(st.financials?.fuelTotal)))));
    }
  });
  fuelRows.push(xlBlank(9), xlRow(SH(""), SH(""), SH(""), SH(""), SH(""), SH(""), SH(""), SH("TOTAL", true), N2(Math.round(stats.fuelCost))));

  // ── Sheet 5: Council Levy ────────────────────────────────────────────────────
  const levyRows = [xlRow(H("Booking Ref"), H("Driver"), H("Date"), H("Council Levy (NGN)"))];
  filteredSettlements.forEach(st => {
    const bId = typeof st.bookingId === "string" ? st.bookingId : st.bookingId?._id;
    const levy = N(st.financials?.councilLevy);
    if (!levy) return;
    levyRows.push(xlRow(S(bId ? bId.slice(-8).toUpperCase() : "-"), S(cleanName(driverByBooking[bId])), S(fmtDate(st.createdAt)), N2(Math.round(levy))));
  });
  levyRows.push(xlBlank(4), xlRow(SH(""), SH(""), SH("TOTAL", true), N2(Math.round(stats.councilLevy))));

  // ── Sheet 6: Damages ─────────────────────────────────────────────────────────
  const dmgRows = [xlRow(H("Driver"), H("Truck"), H("Date"), H("Damage Item"), H("Quantity"), H("Amount (NGN)"))];
  filteredInspections.filter(i => Array.isArray(i.damages) && i.damages.length > 0).forEach(insp => {
    (insp.damages as any[]).forEach((d: any) => dmgRows.push(xlRow(
      S(cleanName(insp.driverId?.name)), S(insp.truckId?.truckId || insp.truckId || "-"),
      S(fmtDate(insp.createdAt)), S(d.description || "-"), N2(Number(d.quantity ?? 0)), N2(Math.round(N(d.amount))),
    )));
  });
  dmgRows.push(xlBlank(6), xlRow(SH(""), SH(""), SH(""), SH(""), SH("TOTAL", true), N2(Math.round(stats.totalDamages))));

  // ── Build workbook XML ───────────────────────────────────────────────────────
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:x="urn:schemas-microsoft-com:office:excel">
 <Styles>
  <Style ss:ID="Default"><Font ss:FontName="Calibri" ss:Size="11"/></Style>
  <Style ss:ID="h"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1e293b" ss:Pattern="Solid"/></Style>
  <Style ss:ID="hb"><Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1e293b" ss:Pattern="Solid"/></Style>
  <Style ss:ID="bg"><Font ss:FontName="Calibri" ss:Size="11"/><Interior ss:Color="#f1f5f9" ss:Pattern="Solid"/></Style>
 </Styles>
 ${xlSheet("Summary",           summaryRows)}
 ${xlSheet("Revenue",           revRows)}
 ${xlSheet("Driver Allocation", allocRows)}
 ${xlSheet("Fuel",              fuelRows)}
 ${xlSheet("Council Levy",      levyRows)}
 ${xlSheet("Damages",           dmgRows)}
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `report_${from}_to_${to}.xls`;
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
type DetailType = "allocation" | "fuel" | "levy" | "damages" | "revenue" | "advance" | "pending" | null;

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
export default function ReportView({ includeSecret = false }: { includeSecret?: boolean }) {
  const [bookings,    setBookings]    = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [inspections, setInspections] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [routes,      setRoutes]      = useState<any[]>([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [detail,      setDetail]      = useState<DetailType>(null);
  // Compare actual (accountant-entered) costs against the planned route values
  const [compare,     setCompare]     = useState(false);

  const currentYear = new Date().getFullYear();
  const [from, setFrom] = useState(`${currentYear}-01-01`);
  const [to,   setTo]   = useState(new Date().toISOString().slice(0, 10));

  const loadAll = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [b, s, i, a, r] = await Promise.allSettled([
        bookingService.getAll(),
        settlementService.getAll(),
        truckInspectionService.getAll(),
        assignmentService.getAll(),
        routeService.getAll(),
      ]);
      setBookings(    b.status === "fulfilled" ? (b.value || []) : []);
      setSettlements( s.status === "fulfilled" ? (s.value || []) : []);
      setInspections( i.status === "fulfilled" ? (i.value || []) : []);
      setAssignments( a.status === "fulfilled" ? (a.value || []) : []);
      setRoutes(      r.status === "fulfilled" ? (r.value || []) : []);
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
      if (bId && a.driverName) map[bId] = cleanDriverName(a.driverName);
    });
    return map;
  }, [assignments]);

  // ── secret visibility ──────────────────────────────────────────────────────────
  // Normal report excludes secret jobs (and their settlements); the secret report
  // includes everything.
  const isSecretBooking = (b: any) => b?.isSecret === true || b?.metadata?.isSecret === true;
  const secretBookingIds = useMemo(
    () => new Set(bookings.filter(isSecretBooking).map((b: any) => b._id?.toString())),
    [bookings]
  );
  const visibleBookings = useMemo(
    () => (includeSecret ? bookings : bookings.filter((b: any) => !isSecretBooking(b))),
    [bookings, includeSecret]
  );
  const visibleSettlements = useMemo(() => {
    if (includeSecret) return settlements;
    return settlements.filter((s: any) => {
      const bId = (typeof s.bookingId === "string" ? s.bookingId : s.bookingId?._id)?.toString();
      return !secretBookingIds.has(bId);
    });
  }, [settlements, includeSecret, secretBookingIds]);

  // ── filtered ─────────────────────────────────────────────────────────────────
  const filteredBookings    = useMemo(() => visibleBookings.filter(b  => inPeriod(b.cargoDetails?.loadingDate || b.createdAt, from, to)), [visibleBookings, from, to]);
  const filteredSettlements = useMemo(() => visibleSettlements.filter(s => inPeriod(s.createdAt, from, to)), [visibleSettlements, from, to]);
  const filteredInspections = useMemo(() => inspections.filter(i => inPeriod(i.createdAt, from, to)), [inspections, from, to]);

  // ── aggregates ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalRevenue   = filteredBookings.reduce((s, b) => s + N(b.finalAmount), 0);
    const advancePaid    = filteredBookings.reduce((s, b) => s + N(b.advancePaid), 0);
    // On this financial report "completed" = payment fully received (fully paid)
    const completedTrips = filteredBookings.filter(b => {
      const final = N(b.finalAmount);
      return (b.status || "").toLowerCase() === "paid" || (final > 0 && N(b.advancePaid) >= final);
    }).length;
    // Pending = Total − Advance (aggregate), guarantees Total = Advance + Pending always
    const pendingRevenue = Math.max(0, totalRevenue - advancePaid);

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

  // ── Secret (without-tax) sub-totals — only meaningful on the secret report ──────
  const secretStats = useMemo(() => {
    if (!includeSecret) return null;
    const rows = filteredBookings.filter(b => isSecretBooking(b) && b.withTax === false);
    const revenue = rows.reduce((s, b) => s + N(b.finalAmount), 0);
    const advance = rows.reduce((s, b) => s + N(b.advancePaid), 0);
    const pending = Math.max(0, revenue - advance);
    return { revenue, advance, pending, count: rows.length };
  }, [includeSecret, filteredBookings]);

  // ── Planned totals from routes (matched to the same settlements that drive actuals) ──
  const routePlanned = useMemo(() => {
    const norm = (s: any) => String(s ?? "").trim().toLowerCase();
    const cityOf = (loc: any): string => {
      if (!loc) return "";
      if (typeof loc === "string") return loc;
      return loc?.address?.city || loc?.city || "";
    };
    // route lookup keyed by "pickup|dropoff", both directions
    const map = new Map<string, any>();
    routes.forEach((r: any) => {
      const a = norm(r.pickupCity), b = norm(r.dropoffCity);
      map.set(`${a}|${b}`, r);
      if (!map.has(`${b}|${a}`)) map.set(`${b}|${a}`, r);
    });
    const bookingById: Record<string, any> = {};
    bookings.forEach((b: any) => { if (b?._id) bookingById[b._id] = b; });

    let allocation = 0, toll = 0, levy = 0, matched = 0, unmatched = 0;
    filteredSettlements.forEach((st: any) => {
      const bId = typeof st.bookingId === "string" ? st.bookingId : st.bookingId?._id;
      const b = bookingById[bId];
      const pickup  = cityOf(Array.isArray(b?.pickupLocations)  ? b.pickupLocations[0]  : (b?.pickupLocations  || b?.pickupLocation));
      const dropArr = b?.dropoffLocations;
      const dropoff = cityOf(Array.isArray(dropArr) ? dropArr[dropArr.length - 1] : (dropArr || b?.dropoffLocation));
      const route = b ? map.get(`${norm(pickup)}|${norm(dropoff)}`) : null;
      if (!route) { unmatched++; return; }
      matched++;
      allocation += N(route.allocationMoney);
      toll       += N(route.tollAmount);
      levy       += N(route.councilLevy);
    });
    return { allocation, toll, levy, matched, unmatched, total: filteredSettlements.length };
  }, [routes, bookings, filteredSettlements]);

  // Compare-mode display helpers: "actual / plan" value + delta sub-line
  const cmpValue = (actual: number, planned: number) =>
    compare ? `${naira(actual)} / ${naira(planned)}` : naira(actual);
  const cmpSub = (defaultSub: string, actual: number, planned: number) => {
    if (!compare) return defaultSub;
    const delta = actual - planned;
    const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
    return `Actual / Route plan · Δ ${sign}${naira(Math.abs(delta))}`;
  };

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
    allocation: { title: "Driver Allocation Details", sub: "Cash allocated per trip settlement",      accent: "text-blue-600" },
    fuel:       { title: "Fuel Cost Details",         sub: "Fuel legs & consumption per trip",        accent: "text-amber-600" },
    levy:       { title: "Council Levy Details",      sub: "Council levy charged per trip",            accent: "text-violet-600" },
    damages:    { title: "Damage Details by Driver",  sub: "Per-driver damage items & amounts",        accent: "text-rose-600" },
    revenue:    { title: "Revenue Breakdown",         sub: "Final amount per booking in this period",  accent: "text-emerald-700" },
    advance:    { title: "Advance Received",          sub: "Advance paid per booking in this period",  accent: "text-blue-600" },
    pending:    { title: "Pending Revenue",           sub: "Balance still owed per booking (Final − Advance)", accent: "text-amber-600" },
  };

  return (
    <>
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
              <input type="date" value={from} max={to} onChange={e => setFrom(e.target.value)}
                className="border border-neutral-200 rounded-xl px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-primary bg-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">To</label>
              <input type="date" value={to} min={from} max={new Date().toISOString().slice(0, 10)} onChange={e => setTo(e.target.value)}
                className="border border-neutral-200 rounded-xl px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-primary bg-white" />
            </div>
            <button onClick={loadAll} disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setCompare(c => !c)}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 border
                ${compare
                  ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                  : "bg-white text-slate-600 border-neutral-200 hover:border-indigo-300 hover:text-indigo-600"}`}
              title="Compare accountant-entered costs against planned route values"
            >
              <Scale className="w-3.5 h-3.5" />
              {compare ? "Comparing" : "Compare"}
            </button>
            <button
              onClick={() => exportReport(from, to, stats, filteredBookings, filteredSettlements, filteredInspections, driverByBooking)}
              disabled={isLoading || (!filteredBookings.length && !filteredSettlements.length && !filteredInspections.length)}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
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
                  <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Trips Paid</p>
                  <p className="text-[16px] font-bold text-slate-700">{stats.completedTrips}</p>
                </div>
              </div>
            </div>

            {/* ── Without-Tax Secret sub-totals (secret report only) ── */}
            {secretStats && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <h2 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">
                    Without-Tax Secret · {secretStats.count} trip{secretStats.count !== 1 ? "s" : ""}
                  </h2>
                  <span className="text-[9px] font-medium text-amber-600/70 normal-case tracking-normal">(included in the totals above)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Revenue</p>
                    <p className="text-[18px] font-bold text-emerald-600 leading-none mt-1">{naira(secretStats.revenue)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Advance Received</p>
                    <p className="text-[18px] font-bold text-blue-600 leading-none mt-1">{naira(secretStats.advance)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Pending</p>
                    <p className="text-[18px] font-bold text-amber-600 leading-none mt-1">{naira(secretStats.pending)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Trips</p>
                    <p className="text-[18px] font-bold text-slate-700 leading-none mt-1">{secretStats.count}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Revenue ── */}
            <div>
              <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Revenue
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard label="Total Revenue"    value={naira(stats.totalRevenue)}   sub={`${stats.totalBookings} bookings`}           icon={<TrendingUp className="w-5 h-5" />} accent="emerald" onClick={() => setDetail("revenue")} />
                <SummaryCard label="Advance Received" value={naira(stats.advancePaid)}    sub="Cash collected from clients"                  icon={<Wallet className="w-5 h-5" />}     accent="blue"    onClick={() => setDetail("advance")} />
                <SummaryCard label="Pending Revenue"  value={naira(stats.pendingRevenue)} sub="Balance still owed (Total − Advance)"       icon={<ReceiptText className="w-5 h-5" />} accent="amber"   onClick={() => setDetail("pending")} />
                <SummaryCard label="Paid Trips"  value={stats.completedTrips.toString()} sub={`fully settled · of ${stats.totalBookings} bookings`} icon={<Truck className="w-5 h-5" />}   accent="indigo" />
              </div>
            </div>

            {/* ── Costs — clickable cards ── */}
            <div>
              <h2 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Costs &amp; Expenses
                {compare && (
                  <span className="ml-2 normal-case tracking-normal text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                    Actual / Route plan
                    {routePlanned.unmatched > 0 && (
                      <span className="text-amber-600"> · {routePlanned.unmatched} of {routePlanned.total} job{routePlanned.total !== 1 ? "s" : ""} have no route</span>
                    )}
                  </span>
                )}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <SummaryCard label="Driver Allocation" value={cmpValue(stats.allocationCost, routePlanned.allocation)} sub={cmpSub(`${stats.totalSettlements} settlements`, stats.allocationCost, routePlanned.allocation)} icon={<Wallet className="w-5 h-5" />}     accent="blue"   onClick={() => setDetail("allocation")} />
                <SummaryCard label="Fuel Cost"         value={naira(stats.fuelCost)}       sub="Total fuel across all trips"                                          icon={<Fuel className="w-5 h-5" />}       accent="amber"  onClick={() => setDetail("fuel")} />
                <SummaryCard label="Toll Charges"      value={cmpValue(stats.tollAmount, routePlanned.toll)} sub={cmpSub("Accumulated toll fees", stats.tollAmount, routePlanned.toll)}                              icon={<Landmark className="w-5 h-5" />}   accent="orange" />
                <SummaryCard label="Damages"           value={naira(stats.totalDamages)}   sub={`${stats.damageIncidents} incident${stats.damageIncidents !== 1 ? "s" : ""}`} icon={<ShieldAlert className="w-5 h-5" />} accent="rose"   onClick={() => setDetail("damages")} />
                <SummaryCard label="Council Levy"      value={cmpValue(stats.councilLevy, routePlanned.levy)} sub={cmpSub("Municipal / council taxes", stats.councilLevy, routePlanned.levy)}                          icon={<Landmark className="w-5 h-5" />}   accent="violet" onClick={() => setDetail("levy")} />
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
            <div className="flex-1 overflow-y-auto p-6 pb-4">

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
                                  <Td>K{leg.mileage ?? "—"}/L</Td>
                                  <td className="py-2 text-right font-bold text-amber-600 text-[11px]">{naira(N(leg.amount))}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                        {st.fuelDetails?.totalDistance && (
                          <p className="text-[10px] text-neutral-400">
                            Total: <b>{st.fuelDetails.totalDistance} km</b> · {st.fuelDetails.totalLiters?.toFixed(1)} L
                            · Rate K{st.fuelDetails.fuelRate}/L
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

              {/* ── REVENUE ── */}
              {detail === "revenue" && (() => {
                const rows = filteredBookings.filter(b => N(b.finalAmount) > 0);
                const locStr = (v: any): string => {
                  if (!v) return "—";
                  if (typeof v === "string") return v.trim() || "—";
                  if (typeof v === "number") return String(v);
                  const candidates = [
                    v?.address, v?.name, v?.location,
                    v?.city, v?.state, v?.street, v?.plotNo, v?.country,
                  ].filter((p: any) => p && typeof p === "string" && p.trim());
                  return candidates.length ? candidates[0] : "—";
                };
                const getFirst = (arr: any, fallback: any) =>
                  Array.isArray(arr) ? arr[0] : (arr ?? fallback);
                const pickup  = (b: any) => locStr(getFirst(b.pickupLocations,  b.pickupLocation));
                const dropoff = (b: any) => locStr(getFirst(b.dropoffLocations, b.dropoffLocation));
                return (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <Th>Trip ID</Th><Th>Driver</Th><Th>Route</Th><Th>Date</Th>
                        <th className="pb-2.5 text-right text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Final Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {rows.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-[11px] text-neutral-300">No revenue bookings in this period</td></tr>
                      )}
                      {rows.map((b, i) => {
                        const bId = b._id ?? "";
                        const tripLabel = b.tripId || `#${bId.slice(-7).toUpperCase()}`;
                        const driver = cleanName(driverByBooking[bId]) || "—";
                        const bFinal = N(b.finalAmount);
                        const isPaid = (b.status || "").toLowerCase() === "paid" || (bFinal > 0 && N(b.advancePaid) >= bFinal);
                        return (
                          <tr key={i}>
                            <Td><span className="font-mono text-[10px] text-slate-500">{String(tripLabel)}</span></Td>
                            <Td><span className="font-semibold text-slate-900">{String(driver)}</span></Td>
                            <Td><span className="text-[10px]">{pickup(b)} → {dropoff(b)}</span></Td>
                            <Td>{fmtDate(b.cargoDetails?.loadingDate || b.createdAt)}</Td>
                            <td className="py-2.5 text-right font-bold text-emerald-600 text-[12px]">
                              {naira(N(b.finalAmount))}
                              {isPaid && <span className="ml-1 text-[9px] font-bold text-emerald-400 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">PAID</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-neutral-100">
                        <td colSpan={4} className="pt-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Revenue</td>
                        <td className="pt-3 text-right text-[14px] font-bold text-emerald-600">{naira(stats.totalRevenue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                );
              })()}

              {/* ── ADVANCE ── */}
              {detail === "advance" && (() => {
                const rows = filteredBookings.filter(b => N(b.advancePaid) > 0);
                return (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <Th>Trip ID</Th><Th>Driver</Th><Th>Date</Th><Th>Final Amount</Th>
                        <th className="pb-2.5 text-right text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Advance Paid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {rows.length === 0 && (
                        <tr><td colSpan={5} className="py-8 text-center text-[11px] text-neutral-300">No advance payments in this period</td></tr>
                      )}
                      {rows.map((b, i) => {
                        const bId = b._id ?? "";
                        const tripLabel = b.tripId || `#${bId.slice(-7).toUpperCase()}`;
                        const driver = cleanName(driverByBooking[bId]) || "—";
                        const balance = N(b.finalAmount) - N(b.advancePaid);
                        return (
                          <tr key={i}>
                            <Td><span className="font-mono text-[10px] text-slate-500">{tripLabel}</span></Td>
                            <Td><span className="font-semibold text-slate-900">{driver}</span></Td>
                            <Td>{fmtDate(b.cargoDetails?.loadingDate || b.createdAt)}</Td>
                            <Td>{naira(N(b.finalAmount))}</Td>
                            <td className="py-2.5 text-right font-bold text-blue-600 text-[12px]">
                              {naira(N(b.advancePaid))}
                              {balance > 0 && <div className="text-[9px] font-semibold text-amber-500 mt-0.5">Bal: {naira(balance)}</div>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-neutral-100">
                        <td colSpan={4} className="pt-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Advance</td>
                        <td className="pt-3 text-right text-[14px] font-bold text-blue-600">{naira(stats.advancePaid)}</td>
                      </tr>
                    </tfoot>
                  </table>
                );
              })()}

              {/* ── PENDING ── */}
              {detail === "pending" && (() => {
                const rows = filteredBookings.filter(b => N(b.finalAmount) - N(b.advancePaid) > 0);
                return (
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <Th>Trip ID</Th><Th>Driver</Th><Th>Date</Th><Th>Final Amt</Th><Th>Advance</Th>
                        <th className="pb-2.5 text-right text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                      {rows.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-[11px] text-neutral-300">No balance due in this period</td></tr>
                      )}
                      {rows.map((b, i) => {
                        const bId = b._id ?? "";
                        const tripLabel = b.tripId || `#${bId.slice(-7).toUpperCase()}`;
                        const driver = cleanName(driverByBooking[bId]) || "—";
                        const balance = N(b.finalAmount) - N(b.advancePaid);
                        return (
                          <tr key={i}>
                            <Td><span className="font-mono text-[10px] text-slate-500">{tripLabel}</span></Td>
                            <Td><span className="font-semibold text-slate-900">{driver}</span></Td>
                            <Td>{fmtDate(b.cargoDetails?.loadingDate || b.createdAt)}</Td>
                            <Td>{naira(N(b.finalAmount))}</Td>
                            <Td><span className="text-emerald-600">{naira(N(b.advancePaid))}</span></Td>
                            <td className="py-2.5 text-right font-bold text-amber-600 text-[12px]">{naira(balance)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-neutral-100">
                        <td colSpan={5} className="pt-3 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Total Balance Due</td>
                        <td className="pt-3 text-right text-[14px] font-bold text-amber-600">{naira(stats.pendingRevenue)}</td>
                      </tr>
                    </tfoot>
                  </table>
                );
              })()}

              {/* ── DAMAGES ── */}
              {detail === "damages" && (
                <div className="space-y-4">
                  {filteredInspections.filter(i => Array.isArray(i.damages) && i.damages.length > 0).length === 0 && (
                    <p className="text-[11px] text-neutral-300 text-center py-10">No damage incidents in this period</p>
                  )}
                  {filteredInspections.filter(i => Array.isArray(i.damages) && i.damages.length > 0).map((insp, idx) => {
                    const dmgTotal = (insp.damages as any[]).reduce((s: number, d: any) => s + N(d.amount), 0);
                    const driverName = insp.driverId?.name ? cleanDriverName(insp.driverId.name) : "—";
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
    </>
  );
}
