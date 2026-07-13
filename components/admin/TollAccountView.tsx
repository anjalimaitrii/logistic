"use client";

import { useState, useEffect, useRef } from "react";
import { TOLL_LOW_BALANCE } from "@/components/admin/AlertsSidebar";
import { tollService } from "@/services/tollService";
import { formatDateTime } from "@/lib/datetime";
import { Wallet, Plus, TrendingDown, TrendingUp, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Truck } from "lucide-react";

// Toll Account screen, layout-free so it can be mounted under both AdminLayout
// (/admin/toll) and the secret section (/admin/secret/toll).
// walletOnly: normal dashboard shows just the balance + recharge; the full
// view (eToll sheet, entries, transactions) lives only in secret mode.
export default function TollAccountView({ walletOnly = false }: { walletOnly?: boolean }) {
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRechargeForm, setShowRechargeForm] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeNote, setRechargeNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const LOW_BALANCE = TOLL_LOW_BALANCE;

  // eToll sheet state
  const [tollData, setTollData] = useState<any>(null);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [tab, setTab] = useState<"trips" | "unmatched" | "all">("trips");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAccount();
    if (!walletOnly) loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAccount = async () => {
    try {
      setIsLoading(true);
      const data = await tollService.getAccount();
      setAccount(data);
    } catch {
      // account will remain null
    } finally {
      setIsLoading(false);
    }
  };

  const loadEntries = async () => {
    try {
      setIsLoadingEntries(true);
      const data = await tollService.getEntries();
      setTollData(data);
    } catch {
      // tollData will remain null
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleSheetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploading(true);
      setUploadResult(null);
      const result = await tollService.uploadSheet(file);
      setUploadResult(result);
      await Promise.all([loadEntries(), loadAccount()]);
    } catch (err: any) {
      setUploadResult({ error: err?.message || "Upload failed" });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRecharge = async () => {
    const amt = Number(rechargeAmount);
    if (!amt || amt <= 0) return;
    try {
      setIsSubmitting(true);
      await tollService.addRecharge(amt, rechargeNote || `Recharge of K${amt.toLocaleString()}`);
      setRechargeAmount("");
      setRechargeNote("");
      setShowRechargeForm(false);
      await loadAccount();
    } catch {
      // silently fail — user can retry
    } finally {
      setIsSubmitting(false);
    }
  };

  const transactions: any[] = account?.transactions
    ? [...account.transactions].reverse()
    : [];

  const totalRecharged = transactions
    .filter((t) => t.type === "recharge")
    .reduce((s, t) => s + t.amount, 0);

  const totalDeducted = transactions
    .filter((t) => t.type === "deduction")
    .reduce((s, t) => s + t.amount, 0);

  // ── Date filter over toll entries ──────────────────────────────
  // Filters entries + summary chips, and rebuilds trip-wise groups from only
  // the entries inside the range (so trip totals reflect the filter too).
  const filterActive = !!(dateFrom || dateTo);
  const fromT = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : -Infinity;
  const toT = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : Infinity;
  const inRange = (d: any) => {
    const t = new Date(d).getTime();
    return t >= fromT && t <= toT;
  };

  // Completed trips are filed as INV-xxx / CASH-xxx — show that id when it
  // exists; running trips keep their TRIP-xxx id.
  const completionIds: Record<string, string> = tollData?.completionIds || {};
  const displayTripId = (bookingId: any, tripId: any) =>
    completionIds[String(bookingId)] || tripId || `#${String(bookingId).slice(-6).toUpperCase()}`;

  const allEntries: any[] = tollData?.entries || [];
  const fEntries = filterActive ? allEntries.filter((e) => inRange(e.date)) : allEntries;

  const fMatched = fEntries.filter((e) => e.matchStatus === "matched");
  const fSummary = filterActive
    ? {
        total: fEntries.length,
        totalCharge: fEntries.reduce((s, e) => s + (e.charge || 0), 0),
        matched: fMatched.length,
        matchedCharge: fMatched.reduce((s, e) => s + (e.charge || 0), 0),
      }
    : (tollData?.summary || { total: 0, totalCharge: 0, matched: 0, matchedCharge: 0 });

  const fTrips: any[] = filterActive
    ? (() => {
        const sorted = [...fMatched].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const byTrip = new Map<string, any>();
        for (const e of sorted) {
          const key = String(e.bookingId || e.tripId);
          let g = byTrip.get(key);
          if (!g) {
            g = { _id: key, tripId: e.tripId, regNo: e.regNo, total: 0, count: 0, firstToll: e.date, lastToll: e.date, plazas: [] };
            byTrip.set(key, g);
          }
          g.total += e.charge || 0;
          g.count += 1;
          g.lastToll = e.date;
          g.plazas.push(e.plaza);
        }
        return [...byTrip.values()].sort((a, b) => new Date(b.lastToll).getTime() - new Date(a.lastToll).getTime());
      })()
    : (tollData?.trips || []);

  return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Toll Account</h1>
            <p className="text-[12px] text-slate-400 mt-0.5">Single toll wallet — recharge &amp; track per-job deductions</p>
          </div>
          <button
            onClick={() => setShowRechargeForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Recharge
          </button>
        </div>

        {/* KPI Cards — wallet-only mode shows balance + total recharged */}
        <div className={`grid gap-4 ${walletOnly ? "grid-cols-2" : "grid-cols-3"}`}>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-primary" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Balance</span>
            </div>
            {isLoading ? (
              <div className="h-7 w-32 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <span className="text-[28px] font-bold text-slate-900 tracking-tight">
                K{(account?.balance || 0).toLocaleString()}
              </span>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Recharged</span>
            </div>
            {isLoading ? (
              <div className="h-7 w-24 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <span className="text-[28px] font-bold text-emerald-600 tracking-tight">
                K{totalRecharged.toLocaleString()}
              </span>
            )}
          </div>

          {!walletOnly && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Spent</span>
            </div>
            {isLoading ? (
              <div className="h-7 w-24 bg-slate-100 animate-pulse rounded-lg" />
            ) : (
              <span className="text-[28px] font-bold text-rose-500 tracking-tight">
                K{totalDeducted.toLocaleString()}
              </span>
            )}
          </div>
          )}
        </div>

        {/* Low balance warning */}
        {!isLoading && account && account.balance < LOW_BALANCE && (
          <div className="px-4 py-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="text-[11px] font-bold">
              Low toll balance — K{Number(account.balance).toLocaleString()} left (below K{LOW_BALANCE.toLocaleString()}). Add a recharge to avoid interruptions.
            </span>
            <button
              onClick={() => setShowRechargeForm(true)}
              className="ml-auto px-3 py-1.5 bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-all shrink-0"
            >
              Recharge
            </button>
          </div>
        )}

        {/* Recharge Form */}
        {showRechargeForm && (
          <div className="bg-white rounded-2xl border border-primary/20 shadow-sm p-6">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-primary" /> New Recharge
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                  Amount (K) *
                </label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] font-bold text-slate-900 outline-none focus:border-primary/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">
                  Note (optional)
                </label>
                <input
                  type="text"
                  value={rechargeNote}
                  onChange={(e) => setRechargeNote(e.target.value)}
                  placeholder="e.g. Monthly top-up"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-[13px] text-slate-700 outline-none focus:border-primary/40 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRecharge}
                disabled={isSubmitting || !rechargeAmount}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-primary/20"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                {isSubmitting ? "Adding..." : "Add Recharge"}
              </button>
              <button
                onClick={() => { setShowRechargeForm(false); setRechargeAmount(""); setRechargeNote(""); }}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* eToll Sheet — per-trip toll from uploaded eToll Zambia export (secret-only) */}
        {!walletOnly && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">eToll Sheet — Trip Toll</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Upload the eToll Zambia export — tolls are matched to trips by truck &amp; time</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleSheetUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 disabled:opacity-50 transition-all"
              >
                {isUploading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {isUploading ? "Processing..." : "Upload Sheet"}
              </button>
            </div>
          </div>

          {/* Upload result banner */}
          {uploadResult && (
            <div className={`mx-6 mt-4 px-4 py-3 rounded-xl border flex items-center gap-2 ${
              uploadResult.error
                ? "bg-rose-50 border-rose-100 text-rose-600"
                : "bg-emerald-50 border-emerald-100 text-emerald-700"
            }`}>
              {uploadResult.error
                ? <AlertTriangle className="w-4 h-4 shrink-0" />
                : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span className="text-[11px] font-bold">
                {uploadResult.error
                  ? uploadResult.error
                  : `${uploadResult.inserted} new entries added (${uploadResult.duplicates} already uploaded${uploadResult.skipped ? `, ${uploadResult.skipped} invalid rows skipped` : ""}) — ${uploadResult.matched} matched to trips, ${uploadResult.stillUnmatched} unmatched${uploadResult.deducted > 0 ? ` · K${Number(uploadResult.deducted).toLocaleString()} deducted from wallet` : ""}`}
              </span>
            </div>
          )}

          {/* Summary chips */}
          <div className="px-6 pt-4 flex items-center gap-3 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Entries </span>
              <span className="text-[11px] font-bold text-slate-900">{fSummary.total || 0}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Matched </span>
              <span className="text-[11px] font-bold text-emerald-700">
                {fSummary.matched || 0} · K{Number(fSummary.matchedCharge || 0).toLocaleString()}
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
              <span className="text-[9px] font-bold text-amber-500 uppercase tracking-widest">Unmatched </span>
              <span className="text-[11px] font-bold text-amber-700">
                {(fSummary.total || 0) - (fSummary.matched || 0)} · K{(Number(fSummary.totalCharge || 0) - Number(fSummary.matchedCharge || 0)).toLocaleString()}
              </span>
            </div>

            {/* Date filter + tabs */}
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-xl px-2 py-1 border border-slate-100">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  max={dateTo || undefined}
                  className="bg-transparent text-[10px] font-semibold text-slate-600 outline-none"
                />
                <span className="text-[10px] text-slate-300">→</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  min={dateFrom || undefined}
                  className="bg-transparent text-[10px] font-semibold text-slate-600 outline-none"
                />
                {filterActive && (
                  <button
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:text-rose-500 hover:bg-rose-50 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
                {([["trips", "Trip-wise"], ["unmatched", "Unmatched"], ["all", "All Entries"]] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                      tab === key ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoadingEntries ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : !tollData?.summary?.total ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-[12px] font-bold text-slate-400">No toll entries yet</p>
              <p className="text-[10px] text-slate-300 mt-1">Upload an eToll Zambia sheet to get started</p>
            </div>
          ) : tab === "trips" ? (
            <div className="p-6 pt-4">
              {fTrips.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic py-4 text-center">
                  {filterActive ? "No trip tolls in the selected date range" : "No tolls matched to trips yet"}
                </p>
              ) : (
                <div className="divide-y divide-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                  {fTrips.map((t: any) => (
                    <div key={t._id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-bold text-slate-900">
                          {displayTripId(t._id, t.tripId)}
                          <span className="ml-2 text-[10px] font-semibold text-slate-400">{t.regNo}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                          {t.count} toll{t.count > 1 ? "s" : ""}
                          {(t.plazas || []).filter(Boolean).length > 0 &&
                            ` · ${[...new Set((t.plazas as string[]).filter(Boolean))].join(" → ")}`}
                          {" · "}{formatDateTime(t.firstToll, { hour12: true })}
                          {formatDateTime(t.lastToll, { hour12: true }) !== formatDateTime(t.firstToll, { hour12: true }) &&
                            ` → ${formatDateTime(t.lastToll, { hour12: true })}`}
                        </p>
                      </div>
                      <span className="text-[13px] font-bold text-slate-900 shrink-0">K{Number(t.total).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 pt-4">
              {(() => {
                const list = fEntries.filter((e: any) =>
                  tab === "unmatched" ? e.matchStatus === "unmatched" : true
                );
                if (list.length === 0) {
                  return <p className="text-[11px] text-slate-400 italic py-4 text-center">
                    {filterActive
                      ? "No entries in the selected date range"
                      : tab === "unmatched" ? "No unmatched entries — everything is linked to a trip" : "No entries"}
                  </p>;
                }
                return (
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <div className="grid grid-cols-[1.3fr_0.9fr_1.4fr_0.7fr_0.9fr] gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                      {["Date", "Truck", "Plaza", "Charge", "Trip"].map(h => (
                        <span key={h} className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{h}</span>
                      ))}
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
                      {list.map((e: any) => (
                        <div key={e._id} className="grid grid-cols-[1.3fr_0.9fr_1.4fr_0.7fr_0.9fr] gap-2 px-4 py-2.5 items-center hover:bg-slate-50/60 transition-colors">
                          <span className="text-[11px] font-semibold text-slate-700">{formatDateTime(e.date, { hour12: true })}</span>
                          <span className="text-[11px] font-bold text-slate-900">{e.rawRegNo || e.regNo}</span>
                          <span className="text-[11px] text-slate-500 truncate">{e.plaza || "—"}</span>
                          <span className="text-[11px] font-bold text-slate-900">K{Number(e.charge).toLocaleString()}</span>
                          {e.matchStatus === "matched" ? (
                            <span className="text-[10px] font-bold text-emerald-600">{displayTripId(e.bookingId, e.tripId)}</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 text-[9px] font-bold uppercase tracking-widest w-fit">Unmatched</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
        )}

        {/* Transaction History (secret-only) */}
        {!walletOnly && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Transaction History</h3>
            <span className="text-[10px] font-bold text-slate-400">{transactions.length} entries</span>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-[12px] font-bold text-slate-400">No transactions yet</p>
              <p className="text-[10px] text-slate-300 mt-1">Add a recharge to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {transactions.map((tx, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/60 transition-colors">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    tx.type === "recharge" ? "bg-emerald-50" : "bg-rose-50"
                  }`}>
                    {tx.type === "recharge"
                      ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      : <ArrowDownRight className="w-4 h-4 text-rose-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-900 truncate">{tx.description}</p>
                    {tx.tripId && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Trip: {tx.tripId}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-[13px] font-bold ${
                      tx.type === "recharge" ? "text-emerald-600" : "text-rose-500"
                    }`}>
                      {tx.type === "recharge" ? "+" : "-"}K{Number(tx.amount).toLocaleString()}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      {tx.date ? formatDateTime(tx.date, { hour12: true }) : "—"}
                    </p>
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest shrink-0 ${
                    tx.type === "recharge"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-500"
                  }`}>
                    {tx.type === "recharge" ? "Recharge" : "Deduction"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
  );
}
