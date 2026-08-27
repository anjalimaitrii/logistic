"use client";

import { useEffect, useState } from "react";
import { X, Printer } from "lucide-react";
import { formatDate } from "@/lib/datetime";
import { assignmentService } from "@/services/assignmentService";
import { bookingService } from "@/services/bookingService";
import { clientNameOf, companyNameOf } from "@/lib/bookingParty";

interface InvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  invoiceId?: string;
}

// Seller (us). Printed at the top of every invoice exactly as ZRA expects it.
const COMPANY = {
  name: "Speedosgistic Trucking Limited",
  tpin: "2114127373",
};

// Zambia standard rate. Only applied to with-tax invoices.
const VAT_RATE = 0.16;

const money = (n: number) =>
  Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

export default function InvoiceDrawer({ isOpen, onClose, booking, invoiceId }: InvoiceDrawerProps) {
  const [truckNo, setTruckNo] = useState("");
  const [zraNo, setZraNo] = useState("");
  const [isSavingZra, setIsSavingZra] = useState(false);

  const bookingId = booking?._id;

  // The truck that ran the trip lives on the assignment, not the booking.
  useEffect(() => {
    if (!isOpen || !bookingId) return;
    setZraNo(booking?.zraInvoiceNo || "");
    let cancelled = false;
    (async () => {
      try {
        const a: any = await assignmentService.getByBookingId(String(bookingId));
        if (!cancelled) setTruckNo(a?.truckNumber || "");
      } catch {
        if (!cancelled) setTruckNo("");
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, bookingId]);

  if (!isOpen || !booking) return null;

  // Company first, then the person, then the names stamped on the booking — an
  // invoice is addressed to whoever it was raised for, and closing the account
  // afterwards must not blank the document.
  const clientCompany =
    companyNameOf(booking) || clientNameOf(booking) || "Direct Client";
  const clientTpin = (booking.clientId as any)?.company?.tpinNumber || "";

  const dropoffs: any[] = booking.dropoffLocations?.length
    ? booking.dropoffLocations
    : booking.dropoff ? [booking.dropoff] : [];

  const deliveryCity = dropoffs[dropoffs.length - 1]?.address?.city || "—";
  // The reference invoice names the country of origin, not the loading city.
  const origin = "ZAMBIA";

  const goods = Array.isArray(booking.cargoDetails?.goodsType)
    ? booking.cargoDetails.goodsType.filter(Boolean)
    : booking.cargoDetails?.goodsType ? [booking.cargoDetails.goodsType] : [];
  // The reference invoice writes "Various" when a load is not a single commodity.
  const commodity = goods.length === 0 ? "Various" : goods.length > 2 ? "Various" : goods.join(", ");

  const dnNo = (booking.deliveryOrders || []).filter(Boolean).join(", ") || "—";
  const dateStr = formatDate(booking.tripEndedAt || booking.cargoDetails?.loadingDate || booking.createdAt);

  const withTax = booking.withTax !== false;
  const subtotal = Number(booking.finalAmount || 0);
  const vat = withTax ? subtotal * VAT_RATE : 0;
  const grandTotal = subtotal + vat;

  const invNo = invoiceId || booking.tripId || `INV-${booking._id?.slice(-6).toUpperCase()}`;

  // Typed once, kept on the booking so a reprint carries the same number.
  const saveZra = async () => {
    const trimmed = zraNo.trim();
    if (trimmed === (booking.zraInvoiceNo || "")) return;
    setIsSavingZra(true);
    try {
      await bookingService.update(String(bookingId), { zraInvoiceNo: trimmed });
      booking.zraInvoiceNo = trimmed;
    } catch (err) {
      console.error("Could not save the ZRA invoice number:", err);
    } finally {
      setIsSavingZra(false);
    }
  };

  const handlePrint = async () => {
    await saveZra();
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;
    const cell = (v: string) => (v && v !== "—" ? v : "");
    w.document.write(`
      <html>
        <head>
          <title>Invoice ${invNo}</title>
          <style>
            * { font-family: Arial, Helvetica, sans-serif; box-sizing: border-box; }
            body { margin: 0; padding: 24px; color: #000; }
            table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            td { border: 1px solid #000; padding: 6px 8px; font-size: 13px; height: 30px; vertical-align: middle; }
            .title { font-size: 30px; font-weight: 800; text-align: center; }
            .sub { font-size: 17px; font-weight: 700; text-align: center; }
            .b { font-weight: 700; }
            .c { text-align: center; }
            .r { text-align: right; }
            .noborder { border: none; }
          </style>
        </head>
        <body>
          <table>
            <colgroup>
              <col style="width:16%"><col style="width:16%"><col style="width:16%">
              <col style="width:17%"><col style="width:18%"><col style="width:17%">
            </colgroup>

            <tr><td class="title" colspan="6">${COMPANY.name}</td></tr>
            <tr>${'<td></td>'.repeat(6)}</tr>
            <tr><td class="sub" colspan="6">Tpin ${COMPANY.tpin}</td></tr>
            <tr><td class="sub" colspan="6">Invoice details of ZRA invoice no ${cell(zraNo.trim())}</td></tr>

            <tr><td colspan="3"></td><td rowspan="2" class="c b">Delivery :-</td><td rowspan="2" class="c b">Mode of payment:-</td><td class="c b">Origin:</td></tr>
            <tr><td class="b" colspan="3">${clientCompany}</td><td></td></tr>
            <tr><td colspan="3"></td><td rowspan="3" class="c b">${cell(deliveryCity)}</td><td rowspan="3" class="c b">Bank Transfer</td><td rowspan="3" class="c b">${origin}</td></tr>
            <tr><td class="b" colspan="3">${clientTpin ? `Tpin ${clientTpin}` : ""}</td></tr>
            <tr><td colspan="3"></td></tr>

            <tr><td class="c b" colspan="3">Description</td><td></td><td></td><td class="c b">Amount</td></tr>
            <tr>
              <td class="c b">Commodity</td><td class="c b">Truck No</td><td class="c b">Delivery Location</td>
              <td class="c b">DN No</td><td class="c b">Date</td><td class="c b">Zambia Kwacha</td>
            </tr>

            <tr>
              <td>${commodity}</td><td>${cell(truckNo)}</td><td>${cell(deliveryCity)}</td>
              <td>${cell(dnNo)}</td><td>${dateStr}</td><td class="r">${money(subtotal)}</td>
            </tr>
            <tr><td class="b">Total</td><td></td><td></td><td></td><td></td><td class="r b">${money(subtotal)}</td></tr>
            ${withTax ? `<tr><td class="b">Vat</td><td></td><td></td><td></td><td></td><td class="r b">${money(vat)}</td></tr>` : ""}
            <tr><td class="b">AMOUNT</td><td></td><td></td><td></td><td></td><td class="r b">${money(grandTotal)}</td></tr>
          </table>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  // Preview mirrors the printed sheet cell-for-cell.
  const Cell = ({ children, className = "", ...rest }: any) => (
    <td className={`border border-black px-2 py-1.5 text-[11px] h-7 align-middle ${className}`} {...rest}>
      {children}
    </td>
  );

  return (
    <div className="fixed inset-0 z-[700] pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[680px] bg-white shadow-2xl pointer-events-auto flex flex-col">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Invoice Preview</h2>
            <p className="text-[10px] text-neutral-400 font-medium mt-0.5">{invNo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-neutral-400 border border-transparent hover:border-neutral-100 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ZRA number — issued outside this system, so it is typed in here. */}
        <div className="px-5 py-3 border-b border-neutral-100 bg-amber-50/40 shrink-0">
          <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">ZRA Invoice No</label>
          <div className="flex items-center gap-2 mt-1.5">
            <input
              type="text"
              value={zraNo}
              onChange={(e) => setZraNo(e.target.value)}
              onBlur={saveZra}
              placeholder="e.g. 000123456"
              className="flex-1 bg-white border border-neutral-200 rounded-lg px-3 py-2 text-[12px] outline-none focus:border-primary/40 transition-all"
            />
            {isSavingZra && <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Saving…</span>}
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-5">
          <table className="w-full table-fixed border-collapse border border-black">
            <colgroup>
              <col style={{ width: "16%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} />
              <col style={{ width: "17%" }} /><col style={{ width: "18%" }} /><col style={{ width: "17%" }} />
            </colgroup>
            <tbody>
              <tr><Cell colSpan={6} className="!text-[18px] font-extrabold text-center">{COMPANY.name}</Cell></tr>
              <tr>{Array.from({ length: 6 }).map((_, i) => <Cell key={i} />)}</tr>
              <tr><Cell colSpan={6} className="!text-[13px] font-bold text-center">Tpin {COMPANY.tpin}</Cell></tr>
              <tr><Cell colSpan={6} className="!text-[13px] font-bold text-center">Invoice details of ZRA invoice no {zraNo.trim()}</Cell></tr>

              <tr>
                <Cell colSpan={3} />
                <Cell rowSpan={2} className="text-center font-bold">Delivery :-</Cell>
                <Cell rowSpan={2} className="text-center font-bold">Mode of payment:-</Cell>
                <Cell className="text-center font-bold">Origin:</Cell>
              </tr>
              <tr>
                <Cell colSpan={3} className="font-bold">{clientCompany}</Cell>
                <Cell />
              </tr>
              <tr>
                <Cell colSpan={3} />
                <Cell rowSpan={3} className="text-center font-bold">{deliveryCity}</Cell>
                <Cell rowSpan={3} className="text-center font-bold">Bank Transfer</Cell>
                <Cell rowSpan={3} className="text-center font-bold">{origin}</Cell>
              </tr>
              <tr><Cell colSpan={3} className="font-bold">{clientTpin ? `Tpin ${clientTpin}` : ""}</Cell></tr>
              <tr><Cell colSpan={3} /></tr>

              <tr>
                <Cell colSpan={3} className="text-center font-bold">Description</Cell>
                <Cell /><Cell />
                <Cell className="text-center font-bold">Amount</Cell>
              </tr>
              <tr>
                <Cell className="text-center font-bold">Commodity</Cell>
                <Cell className="text-center font-bold">Truck No</Cell>
                <Cell className="text-center font-bold">Delivery Location</Cell>
                <Cell className="text-center font-bold">DN No</Cell>
                <Cell className="text-center font-bold">Date</Cell>
                <Cell className="text-center font-bold">Zambia Kwacha</Cell>
              </tr>

              <tr>
                <Cell>{commodity}</Cell>
                <Cell>{truckNo}</Cell>
                <Cell>{deliveryCity}</Cell>
                <Cell>{dnNo}</Cell>
                <Cell>{dateStr}</Cell>
                <Cell className="text-right">{money(subtotal)}</Cell>
              </tr>
              <tr>
                <Cell className="font-bold">Total</Cell><Cell /><Cell /><Cell /><Cell />
                <Cell className="text-right font-bold">{money(subtotal)}</Cell>
              </tr>
              {withTax && (
                <tr>
                  <Cell className="font-bold">Vat</Cell><Cell /><Cell /><Cell /><Cell />
                  <Cell className="text-right font-bold">{money(vat)}</Cell>
                </tr>
              )}
              <tr>
                <Cell className="font-bold">AMOUNT</Cell><Cell /><Cell /><Cell /><Cell />
                <Cell className="text-right font-bold">{money(grandTotal)}</Cell>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-neutral-100 bg-white">
          <button
            onClick={handlePrint}
            className="w-full px-8 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print / Download Invoice
          </button>
        </div>
      </div>
    </div>
  );
}
