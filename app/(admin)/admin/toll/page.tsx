"use client";

import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { tollService } from "@/services/tollService";
import { formatDateTime } from "@/lib/datetime";
import { Wallet, Plus, TrendingDown, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function TollAccountPage() {
  const [account, setAccount] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRechargeForm, setShowRechargeForm] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [rechargeNote, setRechargeNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAccount();
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

  return (
    <AdminLayout>
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

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4">
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
        </div>

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

        {/* Transaction History */}
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
      </div>
    </AdminLayout>
  );
}
