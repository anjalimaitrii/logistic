"use client";

import { useEffect, useState } from "react";
import { ArrowDownCircle, FileText, X as XIcon } from "lucide-react";
import { bookingService } from "@/services/bookingService";

// The booking as the list holds it: POD numbers (deliveryOrders), damages and
// attachments are read straight off it.
type ReceiptBooking = {
  _id: string;
  deliveryOrders?: unknown[];
  damages?: { quantity?: string; amount?: number | string }[];
  attachments?: { url?: string }[];
};

type Props = {
  booking: ReceiptBooking;
  subtitle?: string;
  onClose: () => void;
};

type SignedFile = { name: string; type: string; size: number; url: string };

const money = (n: number) => `K${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// What was recorded when the cargo came off: POD numbers, damages and files.
// Read-only — the POD number is edited on the invoice.
export default function PodReceiptViewer({ booking, subtitle, onClose }: Props) {
  const podNumbers = (booking.deliveryOrders || [])
    .map((d) => String(d ?? "").trim())
    .filter(Boolean);
  const damages = (booking.damages || [])
    .filter((d) => String(d?.quantity || "").trim())
    .map((d) => ({ quantity: String(d.quantity), amount: Number(d.amount) || 0 }));
  const damageTotal = damages.reduce((s, d) => s + d.amount, 0);
  const hasFiles = (booking.attachments || []).some((a) => a?.url);

  // The bucket is private, so stored links do not open; signed ones are fetched
  // each time the viewer opens.
  const [files, setFiles] = useState<SignedFile[] | null>(hasFiles ? null : []);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (!hasFiles) return;
    let cancelled = false;
    bookingService.getAttachments(String(booking._id))
      .then((r) => { if (!cancelled) setFiles(r.files || []); })
      .catch(() => { if (!cancelled) { setFiles([]); setLoadError(true); } });
    return () => { cancelled = true; };
  }, [booking._id, hasFiles]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="px-6 pt-6 pb-4 border-b border-neutral-100 shrink-0 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
              <ArrowDownCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-slate-900">Cargo Offloading Receipt</h2>
              {subtitle && <p className="text-[11px] text-neutral-400 font-medium">{subtitle}</p>}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">POD Numbers</p>
            {podNumbers.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {podNumbers.map((p, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-neutral-50 border border-neutral-100 text-[12px] font-semibold text-slate-800">
                    {p}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-amber-600 font-semibold">No POD number recorded.</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Damages</p>
            {damages.length > 0 ? (
              <div className="rounded-xl border border-rose-100 overflow-hidden">
                {damages.map((d, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-rose-50/50 border-b border-rose-100 last:border-b-0">
                    <span className="text-[12px] text-slate-800">{d.quantity}</span>
                    <span className="text-[12px] font-semibold text-slate-800">{money(d.amount)}</span>
                  </div>
                ))}
                {damages.length > 1 && (
                  <div className="flex items-center justify-between px-3 py-2 bg-rose-50">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Total</span>
                    <span className="text-[12px] font-bold text-rose-700">{money(damageTotal)}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">No damages reported.</p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Offloading Attachments</p>
            {files === null ? (
              <p className="text-[11px] text-slate-400 py-2">Loading files…</p>
            ) : loadError ? (
              <p className="text-[11px] text-rose-500 py-2">Could not load the files. Please try again.</p>
            ) : files.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {files.map((f, i) => (
                  <a
                    key={i}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in a new tab"
                    className="block rounded-xl border border-neutral-100 overflow-hidden hover:border-primary/30 transition-all"
                  >
                    {String(f.type || "").startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.url} alt={f.name || `Offloading photo ${i + 1}`} className="w-full h-28 object-cover bg-neutral-50" />
                    ) : (
                      <div className="w-full h-28 flex items-center justify-center bg-neutral-50">
                        <FileText className="w-8 h-8 text-neutral-300" />
                      </div>
                    )}
                    <p className="px-3 py-2 text-[10px] font-semibold text-slate-600 truncate">{f.name || `File ${i + 1}`}</p>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400">No files were attached at offloading.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
