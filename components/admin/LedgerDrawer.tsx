"use client";

import { useState, useEffect } from "react";
import { X, Wallet, TrendingDown, CheckCircle2, Plus, Trash2, ArrowRight, Receipt, AlertCircle, KeyRound } from "lucide-react";
import { ledgerService } from "@/services/ledgerService";
import { completionService } from "@/services/completionService";
import { formatDate, todayAppDateKey } from "@/lib/datetime";
import { clientNameOf } from "@/lib/bookingParty";
import { CurrencyCode, currencySymbol, totalsByCurrency, CURRENCIES } from "@/lib/currency";

interface LedgerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: string;
  clientId?: string;
  name: string;
  // Secret-portal ledger: include secret trips in the view + payment allocation.
  includeSecret?: boolean;
}

const fmt = (n: number, currency?: string | null) => `${currencySymbol(currency)} ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function LedgerDrawer({ isOpen, onClose, companyId, clientId, name, includeSecret = false }: LedgerDrawerProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Kwacha unless this is an international client paying in dollars. The backend
  // only allocates a payment to invoices in this same currency.
  const [payForm, setPayForm] = useState<{ amount: string; note: string; paidAt: string; currency: CurrencyCode }>(
    { amount: "", note: "", paidAt: "", currency: "ZMW" }
  );
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Password-gated delete confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePwError, setDeletePwError] = useState(false);
  // bookingId → new id (INV-xxx / CASH-xxx) shown for completed trips
  const [newIdByBooking, setNewIdByBooking] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) loadLedger();
    else { setData(null); setPayForm({ amount: "", note: "", paidAt: "", currency: "ZMW" }); }
  }, [isOpen]);

  const loadLedger = async () => {
    setIsLoading(true);
    try {
      const [res, inv, cash] = await Promise.all([
        companyId
          ? ledgerService.getCompany(companyId, includeSecret)
          : ledgerService.getClient(clientId!, includeSecret),
        completionService.getInvoices().catch(() => []),
        completionService.getCash().catch(() => []),
      ]);
      setData(res);

      // bookingId → INV-xxx / CASH-xxx
      const idMap: Record<string, string> = {};
      (inv || []).forEach((r: any) => {
        const bId = (r.bookingId?._id || r.bookingId)?.toString();
        if (bId && r.invoiceId) idMap[bId] = String(r.invoiceId).toUpperCase();
      });
      (cash || []).forEach((r: any) => {
        const bId = (r.bookingId?._id || r.bookingId)?.toString();
        if (bId && r.cashId) idMap[bId] = String(r.cashId).toUpperCase();
      });
      setNewIdByBooking(idMap);
    } catch { setData(null); }
    finally { setIsLoading(false); }
  };

  const handleAddPayment = async () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) { alert("Enter a valid amount"); return; }
    setIsSaving(true);
    try {
      const payload = { amount: Number(payForm.amount), currency: payForm.currency, note: payForm.note, paidAt: payForm.paidAt || undefined, includeSecret };
      companyId
        ? await ledgerService.addCompanyPayment(companyId, payload)
        : await ledgerService.addClientPayment(clientId!, payload);
      setPayForm(f => ({ amount: "", note: "", paidAt: "", currency: f.currency }));
      await loadLedger();
    } catch { alert("Failed to record payment."); }
    finally { setIsSaving(false); }
  };

  // Open the password prompt for the chosen payment
  const requestDelete = (paymentId: string) => {
    setPendingDeleteId(paymentId);
    setDeletePassword("");
    setDeletePwError(false);
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    setDeletePassword("");
    setDeletePwError(false);
  };

  // Send the password to the backend, which verifies it before deleting from the DB
  const confirmDelete = async () => {
    const paymentId = pendingDeleteId;
    if (!paymentId || !deletePassword) return;
    setDeletingId(paymentId);
    try {
      await ledgerService.deletePayment(paymentId, deletePassword);
      // Verified & deleted — close the prompt and refresh
      setPendingDeleteId(null);
      setDeletePassword("");
      setDeletePwError(false);
      await loadLedger();
    } catch (err: any) {
      if (err?.status === 403) {
        setDeletePwError(true); // wrong password — keep the prompt open
      } else {
        alert("Failed to delete payment.");
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  // Backend decides secret visibility (via includeSecret) — show what it returns.
  const visibleBookings = (data?.bookings || []) as any[];

  // Trip money is totalled per currency: a client can run Kwacha jobs and
  // cross-border dollar ones, and with no rate stored anywhere those cannot be
  // added into a single figure.
  const billedTotals   = totalsByCurrency(visibleBookings, (b: any) => b.finalAmount || 0, (b: any) => b.currency);
  const receivedTotals = totalsByCurrency(visibleBookings, (b: any) => b.advancePaid || 0, (b: any) => b.currency);
  // A payment carries its own currency and is only ever allocated to trips billed
  // in that same currency, so the later-payment money splits the same way the
  // trip money does. Payments recorded before the field existed read as Kwacha.
  const paymentTotals  = totalsByCurrency((data?.payments || []) as any[], (p: any) => p.amount || 0, (p: any) => p.currency);
  const paidLaterIn    = (code: CurrencyCode) => paymentTotals.find(t => t.code === code)?.total ?? 0;
  // A client with no jobs yet still reads as a Kwacha zero, as this banner always did.
  const zeroRow = { code: "ZMW" as CurrencyCode, symbol: "K", total: 0 };
  const summary = (billedTotals.length ? billedTotals : [zeroRow]).map(t => {
    const received = receivedTotals.find(r => r.code === t.code)?.total ?? 0;
    return {
      code: t.code,
      billed: t.total,
      // A trip's advancePaid already folds in every later payment, so the original
      // advance is what is left once this currency's later payments come back off.
      advance: Math.max(0, received - paidLaterIn(t.code)),
      outstanding: Math.max(0, t.total - received),
    };
  });
  const hasOutstanding = summary.some(s => s.outstanding > 0);

  return (
    <div className="fixed inset-0 z-[700] pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[520px] bg-white shadow-2xl pointer-events-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-start justify-between bg-slate-50/50 shrink-0">
          <div>
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Client Ledger</p>
            <h2 className="text-[17px] font-bold text-slate-900 tracking-tight">{name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-neutral-400 border border-transparent hover:border-neutral-100 transition-all mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-7 h-7 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Summary Banner */}
            <div className={`mx-6 mt-5 rounded-2xl p-5 ${hasOutstanding ? "bg-rose-50 border border-rose-200" : "bg-emerald-50 border border-emerald-200"}`}>
              <div className="flex items-center gap-2 mb-3">
                {hasOutstanding
                  ? <AlertCircle className="w-4 h-4 text-rose-500" />
                  : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                <span className={`text-[10px] font-bold uppercase tracking-widest ${hasOutstanding ? "text-rose-600" : "text-emerald-600"}`}>
                  {hasOutstanding ? "Outstanding Balance" : "Fully Settled"}
                </span>
              </div>
              <div className={`text-[28px] font-black tracking-tight mb-4 ${hasOutstanding ? "text-rose-700" : "text-emerald-700"}`}>
                {summary.map(s => <div key={s.code}>{fmt(s.outstanding, s.code)}</div>)}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Total Billed", lines: summary.map(s => fmt(s.billed, s.code)), color: "text-slate-700" },
                  { label: "Advance Paid", lines: summary.map(s => fmt(s.advance, s.code)), color: "text-blue-600" },
                  { label: "Later Payments", lines: (paymentTotals.length ? paymentTotals : [zeroRow]).map(t => fmt(t.total, t.code)), color: "text-emerald-600" },
                ].map((s, i) => (
                  <div key={i} className="bg-white/70 rounded-xl p-2.5 text-center">
                    <div className={`text-[13px] font-bold ${s.color}`}>
                      {s.lines.map(line => <div key={line}>{line}</div>)}
                    </div>
                    <div className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Payment: allocated FIFO across the client's trips, so it is tied to no
                single booking — but only to trips billed in the SAME currency, since
                nothing here converts between them. */}
            <div className="mx-6 mt-5 bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest flex items-center gap-1.5">
                  <Plus className="w-3 h-3" /> Record Payment Received
                </p>
                <div className="flex items-center gap-1 p-0.5 rounded-lg bg-neutral-200/60">
                  {CURRENCIES.map(c => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setPayForm(f => ({ ...f, currency: c.code }))}
                      title={`Paid in ${c.label}`}
                      aria-pressed={payForm.currency === c.code}
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                        payForm.currency === c.code
                          ? "bg-white text-neutral-900 shadow-sm"
                          : "text-neutral-400 hover:text-neutral-600"
                      }`}
                    >
                      {c.symbol}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Amount ({payForm.currency}) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-neutral-400">{currencySymbol(payForm.currency)}</span>
                    <input
                      type="number" min="0" placeholder="0.00"
                      value={payForm.amount}
                      onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                      className="w-full bg-white border border-neutral-200 rounded-xl pl-7 pr-3 py-2 text-[12px] font-semibold text-slate-900 outline-none focus:border-primary/40"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Date</label>
                  <input
                    type="date"
                    max={todayAppDateKey()}
                    value={payForm.paidAt}
                    onChange={e => setPayForm(f => ({ ...f, paidAt: e.target.value }))}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-[12px] font-semibold text-slate-900 outline-none focus:border-primary/40"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Note</label>
                <input
                  type="text" placeholder="e.g. Bank transfer, Cash"
                  value={payForm.note}
                  onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-[12px] font-medium text-slate-900 outline-none focus:border-primary/40"
                />
              </div>
              <button
                onClick={handleAddPayment}
                disabled={isSaving || !payForm.amount}
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Wallet className="w-3.5 h-3.5" />
                {isSaving ? "Saving…" : "Add Payment"}
              </button>
            </div>

            {/* Payment History */}
            {(data?.payments?.length > 0) && (
              <div className="mx-6 mt-5 space-y-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Receipt className="w-3 h-3" /> Payment History ({data.payments.length})
                </p>
                {data.payments.map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between p-3 bg-white border border-neutral-100 rounded-xl">
                    <div>
                      <div className="text-[13px] font-bold text-emerald-700">{fmt(p.amount, p.currency)}</div>
                      <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
                        {formatDate(p.paidAt)}
                        {p.note && ` · ${p.note}`}
                      </div>
                    </div>
                    <button
                      onClick={() => requestDelete(p._id)}
                      disabled={deletingId === p._id}
                      className="p-1.5 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Jobs List — sorted oldest first (FIFO order) */}
            <div className="mx-6 mt-5 mb-6 space-y-2">
              <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                Jobs ({visibleBookings.length})
              </p>
              {(!visibleBookings.length) && (
                <p className="text-[11px] text-neutral-300 font-medium text-center py-6">No jobs found</p>
              )}
              {[...visibleBookings]
                .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map((b: any) => {
                  const from = b.pickupLocations?.[0]?.address?.city || "—";
                  const to   = b.dropoffLocations?.[b.dropoffLocations.length - 1]?.address?.city || "—";
                  const billed      = b.finalAmount || 0;
                  const paid        = b.advancePaid || 0;
                  const isTBD       = billed === 0;
                  const jobPending  = Math.max(0, billed - paid);
                  const isPaid      = !isTBD && (b.status === "paid" || jobPending === 0);
                  // Which client this trip was booked for (company ledger spans many clients)
                  const bookedFor   = clientNameOf(b) || null;
                  return (
                    <div key={b._id} className={`p-3 border rounded-xl ${isPaid ? "bg-emerald-50/40 border-emerald-200" : "bg-white border-neutral-100"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] font-bold text-primary shrink-0">#{newIdByBooking[b._id] || b.tripId || b._id?.slice(-6).toUpperCase()}</span>
                          {bookedFor && (
                            <span className="text-[9px] font-medium text-slate-400 truncate">· by <span className="capitalize">{bookedFor}</span></span>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                          isPaid ? "bg-emerald-100 text-emerald-700" :
                          isTBD ? "bg-neutral-100 text-neutral-400" :
                          b.status === "active" ? "bg-blue-50 text-blue-600" :
                          b.status === "finalized" ? "bg-violet-50 text-violet-600" :
                          "bg-amber-50 text-amber-600"
                        }`}>
                          {isPaid ? "✓ Paid" : isTBD ? "TBD" : b.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 mb-2">
                        <span>{from}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
                        <span>{to}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className={`text-[11px] font-bold ${isTBD ? "text-neutral-400 italic" : "text-slate-800"}`}>
                            {isTBD ? "TBD" : fmt(billed, b.currency)}
                          </div>
                          <div className="text-[8px] text-neutral-400 font-bold uppercase">Billed</div>
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-blue-600">{paid > 0 ? fmt(paid, b.currency) : "—"}</div>
                          <div className="text-[8px] text-neutral-400 font-bold uppercase">Paid</div>
                        </div>
                        <div>
                          <div className={`text-[11px] font-bold ${isPaid ? "text-emerald-600" : isTBD ? "text-neutral-400 italic" : "text-rose-500"}`}>
                            {isPaid ? "Settled" : isTBD ? "TBD" : fmt(jobPending, b.currency)}
                          </div>
                          <div className="text-[8px] text-neutral-400 font-bold uppercase">Pending</div>
                        </div>
                      </div>
                    </div>
                  );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Password-gated delete confirmation */}
      {pendingDeleteId && (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-6 pointer-events-auto">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={cancelDelete} />
          <div className="relative w-full max-w-[360px] bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-[14px] font-bold text-slate-900">Confirm Deletion</h3>
                <p className="text-[11px] text-neutral-400 font-medium">Enter the admin password to delete this payment.</p>
              </div>
            </div>

            <input
              type="password"
              autoFocus
              value={deletePassword}
              onChange={e => { setDeletePassword(e.target.value); if (deletePwError) setDeletePwError(false); }}
              onKeyDown={e => e.key === "Enter" && confirmDelete()}
              placeholder="Admin password"
              className={`w-full bg-neutral-50 border rounded-xl px-3 py-2.5 text-[13px] font-semibold text-slate-900 outline-none transition-all ${
                deletePwError ? "border-rose-400 ring-2 ring-rose-50" : "border-neutral-200 focus:border-primary/40"
              }`}
            />
            {deletePwError && (
              <p className="text-[11px] font-bold text-rose-500 mt-2">Incorrect password.</p>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={cancelDelete}
                className="flex-1 py-2.5 border border-neutral-200 rounded-xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={!deletePassword || deletingId === pendingDeleteId}
                className="flex-1 py-2.5 bg-rose-500 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" /> {deletingId === pendingDeleteId ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
