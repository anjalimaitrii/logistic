"use client";

import { useState, useEffect } from "react";
import { X, Wallet, ArrowRight } from "lucide-react";

interface ReceivePaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  onSubmit: (data: { amount: number; note: string; paidAt?: string }) => Promise<void> | void;
}

const fmt = (n: number) =>
  `K ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ReceivePaymentDrawer({ isOpen, onClose, booking, onSubmit }: ReceivePaymentDrawerProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) { setAmount(""); setNote(""); setPaidAt(""); }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const billed = Number(booking.finalAmount || 0);
  const paid = Number(booking.advancePaid || 0);
  const balance = Math.max(0, billed - paid);

  const from = booking.pickupLocations?.[0]?.address?.city || booking.pickup?.address?.city || "—";
  const to = booking.dropoffLocations?.[booking.dropoffLocations?.length - 1]?.address?.city || booking.dropoff?.address?.city || "—";
  const tripId = booking.tripId || `#${booking._id?.slice(-6).toUpperCase()}`;

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { alert("Enter a valid amount"); return; }
    if (amt > balance) { alert(`Amount can't exceed the balance due (${fmt(balance)}).`); return; }
    setIsSaving(true);
    try {
      await onSubmit({ amount: amt, note, paidAt: paidAt || undefined });
      onClose();
    } catch {
      alert("Failed to record payment.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[700] pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[440px] bg-white shadow-2xl pointer-events-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-start justify-between bg-slate-50/50 shrink-0">
          <div>
            <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1">Receive Payment</p>
            <h2 className="text-[16px] font-bold text-slate-900 tracking-tight">{tripId}</h2>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 mt-0.5">
              <span>{from}</span><ArrowRight className="w-3 h-3 text-slate-300" /><span>{to}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-neutral-400 border border-transparent hover:border-neutral-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
          {/* Trip balance summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-3">
              <div className="text-[13px] font-bold text-slate-800">{fmt(billed)}</div>
              <div className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Deal Amount</div>
            </div>
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-3">
              <div className="text-[13px] font-bold text-blue-600">{fmt(paid)}</div>
              <div className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Paid</div>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3">
              <div className="text-[13px] font-bold text-rose-600">{fmt(balance)}</div>
              <div className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">Balance</div>
            </div>
          </div>

          {/* Payment form */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Amount Received *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[12px] font-bold text-neutral-400">K</span>
                <input
                  type="number" min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-7 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => setAmount(String(balance))}
                className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline ml-1"
              >
                Pay full balance ({fmt(balance)})
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Date</label>
              <input
                type="date"
                max={new Date().toISOString().split("T")[0]}
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Bank transfer, Cash"
                className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-white">
          <button
            onClick={handleSubmit}
            disabled={isSaving || !amount}
            className="w-full px-8 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            {isSaving ? "Saving…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
