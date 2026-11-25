"use client";

import { useRef, useState } from "react";
import { ArrowDownCircle, Paperclip, X as XIcon } from "lucide-react";

export type OffloadingDamage = { quantity: string; amount: string };

export type OffloadingReceipt = {
  // Blank rows already dropped.
  deliveryOrders: string[];
  damages: OffloadingDamage[];
  files: File[];
};

type Props = {
  subtitle: string;
  // At the moment of offloading the POD can be left blank and filled later; when
  // the trip is already completed, the POD is the whole point of opening the form.
  requireDeliveryOrder?: boolean;
  initialDeliveryOrders?: string[];
  initialDamages?: { quantity?: string; amount?: string | number }[];
  // Files already on the trip. New ones are added next to them, not over them.
  existingAttachmentCount?: number;
  onClose: () => void;
  // Handles its own errors; the modal only tracks the busy state.
  onSubmit: (receipt: OffloadingReceipt) => Promise<void>;
};

// Mounted only while open, so every opening starts from the props it is given.
export default function OffloadingReceiptModal({
  subtitle,
  requireDeliveryOrder = false,
  initialDeliveryOrders,
  initialDamages,
  existingAttachmentCount = 0,
  onClose,
  onSubmit,
}: Props) {
  const [deliveryOrders, setDeliveryOrders] = useState<string[]>(
    initialDeliveryOrders && initialDeliveryOrders.length > 0 ? initialDeliveryOrders : [""]
  );
  const [damages, setDamages] = useState<OffloadingDamage[]>(() => {
    const rows = (initialDamages || [])
      .filter((d) => String(d?.quantity || "").trim())
      .map((d) => ({ quantity: String(d.quantity || ""), amount: d.amount == null ? "" : String(d.amount) }));
    return rows.length > 0 ? rows : [{ quantity: "", amount: "" }];
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filledDeliveryOrders = deliveryOrders.map((d) => d.trim()).filter(Boolean);
  const missingDeliveryOrder = requireDeliveryOrder && filledDeliveryOrders.length === 0;

  const close = () => {
    if (!isSubmitting) onClose();
  };

  const submit = async () => {
    if (missingDeliveryOrder) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        deliveryOrders: filledDeliveryOrders,
        damages: damages.filter((d) => d.quantity.trim()),
        files,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={close} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 border-b border-neutral-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Cargo Offloading Receipt</h2>
              <p className="text-[11px] text-neutral-400 font-medium">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                POD Numbers {requireDeliveryOrder && <span className="text-rose-500">*</span>}
              </label>
              <button type="button" onClick={() => setDeliveryOrders((arr) => [...arr, ""])} className="text-[9px] font-bold text-primary uppercase tracking-widest hover:underline">+ Add</button>
            </div>
            {deliveryOrders.map((do_, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" value={do_} onChange={(e) => setDeliveryOrders((arr) => arr.map((d, idx) => (idx === i ? e.target.value : d)))} placeholder={`POD #${i + 1}`} className="flex-1 bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-primary/30 transition-all" />
                {deliveryOrders.length > 1 && <button type="button" onClick={() => setDeliveryOrders((arr) => arr.filter((_, idx) => idx !== i))} className="px-2 text-rose-400 hover:text-rose-600 text-[11px] font-bold">✕</button>}
              </div>
            ))}
            {requireDeliveryOrder && (
              <p className="text-[10px] text-slate-400 leading-relaxed">
                The trip moves to Completed Jobs once a POD number is saved.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Damages</label>
              <button type="button" onClick={() => setDamages((arr) => [...arr, { quantity: "", amount: "" }])} className="text-[9px] font-bold text-rose-500 uppercase tracking-widest hover:underline">+ Add</button>
            </div>
            {damages.map((dmg, i) => (
              <div key={i} className="flex gap-2 items-start">
                <input type="text" value={dmg.quantity} onChange={(e) => setDamages((arr) => arr.map((d, idx) => (idx === i ? { ...d, quantity: e.target.value } : d)))} placeholder="Qty with units (e.g. 2 bags)" className="flex-1 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-rose-300 transition-all" />
                <input type="number" value={dmg.amount} onChange={(e) => setDamages((arr) => arr.map((d, idx) => (idx === i ? { ...d, amount: e.target.value } : d)))} placeholder="Amount" className="w-24 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2 text-[12px] text-slate-900 outline-none focus:border-rose-300 transition-all" />
                {damages.length > 1 && <button type="button" onClick={() => setDamages((arr) => arr.filter((_, idx) => idx !== i))} className="px-2 pt-2 text-rose-400 hover:text-rose-600 text-[11px] font-bold">✕</button>}
              </div>
            ))}
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Offloading Attachments</label>
            {existingAttachmentCount > 0 && (
              <p className="text-[10px] text-slate-400">
                {existingAttachmentCount} file{existingAttachmentCount !== 1 ? "s" : ""} already on this trip. New files are added to them.
              </p>
            )}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-neutral-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all"
            >
              <Paperclip className="w-5 h-5 text-neutral-300" />
              <p className="text-[11px] font-semibold text-neutral-400">Click to attach files</p>
              <p className="text-[9px] text-neutral-300">PDF, Images, Docs — any format</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const selected = Array.from(e.target.files || []);
                setFiles((prev) => {
                  const existing = new Set(prev.map((f) => f.name));
                  return [...prev, ...selected.filter((f) => !existing.has(f.name))];
                });
                e.target.value = "";
              }}
            />
            {files.length > 0 && (
              <div className="space-y-1.5">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-neutral-50 border border-neutral-100 rounded-xl">
                    <Paperclip className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="text-[11px] font-medium text-slate-700 truncate flex-1">{file.name}</span>
                    <span className="text-[9px] text-neutral-400 shrink-0">{(file.size / 1024).toFixed(0)} KB</span>
                    <button
                      type="button"
                      onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      className="text-neutral-300 hover:text-rose-500 transition-colors shrink-0"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={close}
            className="px-5 py-2.5 rounded-xl border border-neutral-100 text-[12px] font-bold text-slate-500 hover:bg-neutral-50 transition-colors uppercase tracking-widest disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting || missingDeliveryOrder}
            onClick={submit}
            title={missingDeliveryOrder ? "Enter at least one POD number" : undefined}
            className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit Offloading"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
