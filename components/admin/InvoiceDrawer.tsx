"use client";

import { X, Printer } from "lucide-react";
import { formatDate } from "@/lib/datetime";

interface InvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  invoiceId?: string;
}

// Your company (seller) details shown at the top of every invoice — edit as needed.
const COMPANY = {
  name: "Speedogistic",
  address: "Lusaka, Zambia",
  contact: "+260 000 000 000",
  gst: "GST / TPIN: —",
};

const fmt = (n: number) =>
  `K ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TEAL = "#15616d";

export default function InvoiceDrawer({ isOpen, onClose, booking, invoiceId }: InvoiceDrawerProps) {
  if (!isOpen || !booking) return null;

  const invNo = invoiceId || booking.tripId || `INV-${booking._id?.slice(-6).toUpperCase()}`;
  const client = (booking.clientId as any)?.name || booking.metadata?.client || "Direct Client";
  const company = (booking.clientId as any)?.company?.companyName || "";
  const clientContact = (booking.clientId as any)?.phone || (booking.clientId as any)?.mobile || "—";

  const pickups: any[] = booking.pickupLocations?.length
    ? booking.pickupLocations
    : booking.pickup ? [booking.pickup] : [];
  const dropoffs: any[] = booking.dropoffLocations?.length
    ? booking.dropoffLocations
    : booking.dropoff ? [booking.dropoff] : [];
  const from = pickups[0]?.address?.city || "—";
  const to = dropoffs[dropoffs.length - 1]?.address?.city || "—";
  const clientAddress = [company, pickups[0]?.address?.city].filter(Boolean).join(", ") || "—";

  const billed = Number(booking.finalAmount || 0);   // deal amount agreed
  const advance = Number(booking.advancePaid || 0);
  const balance = Math.max(0, billed - advance);
  const withTax = booking.withTax === true;
  const goodsType = booking.cargoDetails?.goodsType;
  const weight = booking.cargoDetails?.weight;
  const dateStr = formatDate(new Date().toISOString());

  const description = `Freight Charges — ${from} → ${to}${goodsType ? ` (${goodsType}${weight ? `, ${weight} kg` : ""})` : ""}`;

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=820,height=1000");
    if (!w) return;
    w.document.write(`
      <html>
        <head>
          <title>Invoice ${invNo}</title>
          <style>
            * { font-family: Arial, Helvetica, sans-serif; box-sizing: border-box; }
            body { margin: 0; padding: 40px; color: #1f2937; }
            .sheet { border: 1px solid #e5e7eb; padding: 36px; }
            .top { display:flex; justify-content:space-between; align-items:flex-start; }
            .title { font-size: 40px; font-weight: 800; color: ${TEAL}; letter-spacing: 1px; line-height: 1; }
            .rule { border:0; border-top: 2px solid ${TEAL}; margin: 14px 0 22px; }
            .row { display:flex; justify-content:space-between; gap: 24px; }
            .label { color:#6b7280; font-size: 12px; }
            .val { font-size: 13px; font-weight: 600; }
            .teal { color: ${TEAL}; font-weight: 700; font-size: 12px; letter-spacing:.5px; }
            .block div { margin: 3px 0; font-size: 13px; }
            .totbox { text-align:right; }
            .totbox .amt { background:#d7e9ec; padding:8px 14px; font-weight:800; font-size:16px; display:inline-block; min-width:140px; text-align:right; margin-top:4px; }
            table { width:100%; border-collapse:collapse; margin-top:28px; }
            thead th { background:${TEAL}; color:#fff; padding:11px 12px; font-size:11px; text-transform:uppercase; letter-spacing:1px; text-align:left; }
            thead th.r, tbody td.r { text-align:right; }
            tbody td { padding:12px; font-size:13px; border-bottom:1px solid #eef0f2; }
            .spacer td { height: 120px; }
            .grand { background:${TEAL}; color:#fff; }
            .grand td { padding:12px; font-weight:800; font-size:14px; }
            .summary { margin-top:16px; margin-left:auto; width:280px; font-size:13px; }
            .summary div { display:flex; justify-content:space-between; padding:5px 0; }
            .foot { margin-top:64px; display:flex; justify-content:space-between; gap:16px; }
            .foot .cell { flex:1; text-align:center; border-top:1px solid #cbd5e1; padding-top:8px; font-size:11px; color:#6b7280; }
          </style>
        </head>
        <body>
          <div class="sheet">
            <div class="top">
              <div class="block">
                <div class="val" style="font-size:16px;font-weight:800;">${COMPANY.name}</div>
                <div class="label">${COMPANY.address}</div>
                <div class="label">Contact: ${COMPANY.contact}</div>
                <div class="label">${COMPANY.gst}</div>
              </div>
              <div class="title">Invoice</div>
            </div>
            <hr class="rule" />

            <div class="row">
              <div class="block">
                <div class="teal">INVOICE TO</div>
                <div class="val" style="text-transform:capitalize;">${client}</div>
                <div class="label">${clientAddress}</div>
                <div class="label">Contact: ${clientContact}</div>
              </div>
              <div class="block" style="text-align:right;">
                <div><span class="label">Date: </span><span class="val">${dateStr}</span></div>
                <div><span class="label">Invoice No: </span><span class="val">${invNo}</span></div>
                <div style="margin-top:10px;">
                  <div class="teal">INVOICE TOTAL</div>
                  <div class="totbox"><span class="amt">${fmt(billed)}</span></div>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr><th>Description</th><th class="r">Unit Price</th><th class="r">Amount</th></tr>
              </thead>
              <tbody>
                <tr>
                  <td>${description}</td>
                  <td class="r">${fmt(billed)}</td>
                  <td class="r">${fmt(billed)}</td>
                </tr>
                <tr class="spacer"><td></td><td></td><td></td></tr>
                <tr class="grand"><td colspan="2">Total Amount</td><td class="r">${fmt(billed)}</td></tr>
              </tbody>
            </table>

            <div class="summary">
              <div><span>Subtotal</span><span>${fmt(billed)}</span></div>
              ${withTax ? `<div><span>GST / Tax</span><span>Included</span></div>` : `<div><span>GST / Tax</span><span>N/A</span></div>`}
              <div><span>Advance Received</span><span>- ${fmt(advance)}</span></div>
              <div style="border-top:2px solid ${TEAL};margin-top:4px;padding-top:8px;font-weight:800;font-size:15px;"><span>Balance Due</span><span>${fmt(balance)}</span></div>
            </div>

            <div class="foot">
              <div class="cell">Authorized Person</div>
              <div class="cell">Title</div>
              <div class="cell">Contact</div>
              <div class="cell">Authorized Signature</div>
            </div>
          </div>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  return (
    <div className="fixed inset-0 z-[700] pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[560px] bg-white shadow-2xl pointer-events-auto flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Invoice Preview</h2>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-neutral-400 border border-transparent hover:border-neutral-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice sheet preview */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="border border-neutral-200 rounded-xl p-6">
            {/* Top */}
            <div className="flex items-start justify-between">
              <div className="text-[12px] leading-relaxed">
                <div className="text-[15px] font-extrabold text-slate-900">{COMPANY.name}</div>
                <div className="text-neutral-500">{COMPANY.address}</div>
                <div className="text-neutral-500">Contact: {COMPANY.contact}</div>
                <div className="text-neutral-500">{COMPANY.gst}</div>
              </div>
              <div className="text-[34px] font-extrabold tracking-tight" style={{ color: TEAL }}>Invoice</div>
            </div>
            <div className="border-t-2 my-4" style={{ borderColor: TEAL }} />

            {/* Bill to + meta */}
            <div className="flex items-start justify-between gap-6">
              <div className="text-[12px]">
                <div className="font-bold tracking-wide mb-1" style={{ color: TEAL }}>INVOICE TO</div>
                <div className="text-[13px] font-semibold text-slate-900 capitalize">{client}</div>
                <div className="text-neutral-500">{clientAddress}</div>
                <div className="text-neutral-500">Contact: {clientContact}</div>
              </div>
              <div className="text-right text-[12px] space-y-1">
                <div><span className="text-neutral-500">Date: </span><span className="font-semibold">{dateStr}</span></div>
                <div><span className="text-neutral-500">Invoice No: </span><span className="font-semibold">{invNo}</span></div>
                <div className="pt-2">
                  <div className="font-bold tracking-wide" style={{ color: TEAL }}>INVOICE TOTAL</div>
                  <div className="inline-block px-3 py-1.5 font-extrabold text-[15px] mt-1" style={{ background: "#d7e9ec" }}>{fmt(billed)}</div>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="mt-5 rounded-lg overflow-hidden border border-neutral-100">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-2.5 text-white text-[10px] font-bold uppercase tracking-widest" style={{ background: TEAL }}>
                <span>Description</span><span className="text-right w-24">Unit Price</span><span className="text-right w-24">Amount</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-3 py-3 text-[12px] border-b border-neutral-100">
                <span className="text-slate-700">{description}</span>
                <span className="text-right w-24 font-semibold">{fmt(billed)}</span>
                <span className="text-right w-24 font-semibold">{fmt(billed)}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto] gap-4 px-3 py-3 text-white text-[13px] font-extrabold" style={{ background: TEAL }}>
                <span>Total Amount</span><span className="text-right">{fmt(billed)}</span>
              </div>
            </div>

            {/* Summary */}
            <div className="ml-auto w-64 mt-4 text-[12px] space-y-1.5">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{fmt(billed)}</span></div>
              <div className="flex justify-between text-slate-500"><span>GST / Tax</span><span>{withTax ? "Included" : "N/A"}</span></div>
              <div className="flex justify-between text-blue-600"><span>Advance Received</span><span>- {fmt(advance)}</span></div>
              <div className="flex justify-between pt-2 border-t-2 font-extrabold text-[14px] text-slate-900" style={{ borderColor: TEAL }}>
                <span>Balance Due</span><span>{fmt(balance)}</span>
              </div>
            </div>

            {/* Signature footer */}
            <div className="flex gap-3 mt-12 text-[9px] text-neutral-400 uppercase tracking-widest">
              {["Authorized Person", "Title", "Contact", "Authorized Signature"].map((c) => (
                <div key={c} className="flex-1 text-center border-t border-neutral-200 pt-1.5">{c}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer action */}
        <div className="p-5 border-t border-neutral-100 bg-white">
          <button
            onClick={handlePrint}
            className="w-full px-8 py-3 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            style={{ background: TEAL }}
          >
            <Printer className="w-4 h-4" />
            Print / Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
