"use client";

import { useEffect, useState } from "react";
import { X, Printer, Unlink } from "lucide-react";
import { formatDate, toAppDateKey } from "@/lib/datetime";
import { assignmentService } from "@/services/assignmentService";
import { bookingService } from "@/services/bookingService";
import { clientNameOf, companyNameOf } from "@/lib/bookingParty";

interface InvoiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any | null;
  invoiceId?: string;
  // A combined invoice: every trip on it, one row each. Takes the place of
  // `booking` when given.
  group?: any[];
  // bookingId → INV-xxx, so each row of a combined invoice names its own trip.
  invoiceIds?: Record<string, string>;
  // After a print (which raises the invoice) or a split, so the page can reload.
  onInvoiceChanged?: () => void;
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

// Typed values go into the print window as HTML.
const esc = (v: string) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));

// The editable invoice fields as the trips hold them. Anyone can forget the DN
// or the client's TPIN at the time, so the drawer edits a copy and writes back
// only what changed. ZRA no, date and TPIN are one per invoice; the DN is one
// per trip. The date defaults to today until the invoice is raised.
type InvoiceFields = { zraNo: string; tpin: string; date: string; dn: Record<string, string> };

const dnOf = (b: any) => (b?.deliveryOrders || []).filter(Boolean).join(", ");
// One typed on the invoice wins over the company's, so a reprint carries it even
// if the company record still lacks it.
const tpinOf = (b: any) => b?.invoiceTpin ?? (b?.clientId?.company?.tpinNumber || "");

const savedFields = (trips: any[]): InvoiceFields => ({
  zraNo: trips[0]?.zraInvoiceNo || "",
  tpin: tpinOf(trips[0]),
  date: toAppDateKey(trips[0]?.invoiceDate || new Date()),
  dn: Object.fromEntries(trips.map((t) => [String(t._id), dnOf(t)])),
});

export default function InvoiceDrawer({
  isOpen, onClose, booking, invoiceId, group, invoiceIds, onInvoiceChanged,
}: InvoiceDrawerProps) {
  const trips: any[] = group?.length ? group : booking ? [booking] : [];
  const tripKey = trips.map((t) => String(t._id)).join(",");
  const isCombined = trips.length > 1;

  const [truckNos, setTruckNos] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<InvoiceFields>(() => savedFields(trips));
  const [isSaving, setIsSaving] = useState(false);
  // Set by a print refused for missing fields, so only then do they turn red.
  const [showErrors, setShowErrors] = useState(false);

  const setField = (key: "zraNo" | "tpin" | "date", value: string) => {
    // An invoice always carries a date — clearing the picker keeps the last one.
    if (key === "date" && !value) return;
    setFields((f) => ({ ...f, [key]: value }));
  };
  const setDn = (id: string, value: string) =>
    setFields((f) => ({ ...f, dn: { ...f.dn, [id]: value } }));

  // The truck that ran each trip lives on its assignment, not the booking.
  useEffect(() => {
    if (!isOpen || !trips.length) return;
    setFields(savedFields(trips));
    setShowErrors(false);
    let cancelled = false;
    (async () => {
      const pairs = await Promise.all(
        trips.map(async (t) => {
          try {
            const a: any = await assignmentService.getByBookingId(String(t._id));
            return [String(t._id), a?.truckNumber || ""] as const;
          } catch {
            return [String(t._id), ""] as const;
          }
        })
      );
      if (!cancelled) setTruckNos(Object.fromEntries(pairs));
    })();
    return () => { cancelled = true; };
  }, [isOpen, tripKey]);

  if (!isOpen || !trips.length) return null;
  const primary = trips[0];

  // Company first, then the person, then the names stamped on the booking — an
  // invoice is addressed to whoever it was raised for, and closing the account
  // afterwards must not blank the document.
  const clientCompany =
    companyNameOf(primary) || clientNameOf(primary) || "Direct Client";
  const clientTpin = fields.tpin.trim();
  // The reference invoice names the country of origin, not the loading city.
  const origin = "ZAMBIA";
  // The invoice is dated the day it is raised, not the day the trip ran.
  const dateStr = formatDate(fields.date);

  const invNoOf = (t: any) =>
    invoiceIds?.[String(t._id)] ||
    (!isCombined && invoiceId) ||
    t.tripId ||
    `INV-${String(t._id).slice(-6).toUpperCase()}`;

  const rows = trips.map((t) => {
    const id = String(t._id);
    const dropoffs: any[] = t.dropoffLocations?.length ? t.dropoffLocations : t.dropoff ? [t.dropoff] : [];
    const goods = Array.isArray(t.cargoDetails?.goodsType)
      ? t.cargoDetails.goodsType.filter(Boolean)
      : t.cargoDetails?.goodsType ? [t.cargoDetails.goodsType] : [];
    return {
      id,
      invNo: invNoOf(t),
      // The reference invoice writes "Various" when a load is not a single commodity.
      commodity: goods.length === 0 || goods.length > 2 ? "Various" : goods.join(", "),
      truck: truckNos[id] || "",
      city: dropoffs[dropoffs.length - 1]?.address?.city || "—",
      dn: (fields.dn[id] ?? "").trim() || "—",
      amount: Number(t.finalAmount || 0),
    };
  });
  // The header names every place delivered to, once each.
  const deliveryCity = [...new Set(rows.map((r) => r.city).filter((c) => c !== "—"))].join(", ") || "—";

  const withTax = trips.every((t) => t.withTax !== false);
  const subtotal = rows.reduce((sum, r) => sum + r.amount, 0);
  const vat = withTax ? subtotal * VAT_RATE : 0;
  const grandTotal = subtotal + vat;

  // A printed invoice is a tax document: it needs its ZRA number, the client's
  // TPIN and every trip's DN. The date always has one — today, by default.
  const missing = {
    zraNo: !fields.zraNo.trim(),
    tpin: !fields.tpin.trim(),
    dn: new Set(rows.filter((r) => r.dn === "—").map((r) => r.id)),
  };
  const missingLabels = [
    missing.zraNo && "ZRA Invoice No",
    missing.tpin && "Client TPIN",
    missing.dn.size > 0 && (isCombined ? `DN No (${missing.dn.size} trip${missing.dn.size > 1 ? "s" : ""})` : "DN No"),
  ].filter(Boolean) as string[];

  // Once printed, the invoice has gone to the client: it reads back as it was
  // and can only be printed again. One printed before these fields were required
  // (no ZRA number, say) stays open until it is complete.
  const saved = savedFields(trips);
  const savedComplete =
    !!saved.zraNo.trim() && !!saved.tpin.trim() && rows.every((r) => !!(saved.dn[r.id] || "").trim());
  const isLocked = trips.every((t) => t.invoicedAt) && savedComplete;

  const invNos = rows.map((r) => r.invNo);
  const title = isCombined ? `Invoice ${invNos[0]}–${invNos[invNos.length - 1]}` : `Invoice ${invNos[0]}`;

  // Typed once, kept on every trip so a reprint carries the same values. The
  // date is only written when changed by hand, or by the first print — opening
  // the drawer on Monday and printing on Wednesday must date it Wednesday.
  const saveFields = async (stampDate = false) => {
    const writes = trips
      .map((t) => {
        const id = String(t._id);
        const saved = savedFields([t]);
        const patch: Record<string, unknown> = {};
        if (fields.zraNo.trim() !== saved.zraNo) patch.zraInvoiceNo = fields.zraNo.trim();
        const dn = (fields.dn[id] ?? "").trim();
        if (dn !== saved.dn[id]) patch.deliveryOrders = dn.split(",").map((s) => s.trim()).filter(Boolean);
        if (fields.tpin.trim() !== saved.tpin) patch.invoiceTpin = fields.tpin.trim();
        if (fields.date && (fields.date !== saved.date || (stampDate && !t.invoiceDate))) {
          patch.invoiceDate = fields.date;
        }
        // Only a print raises the invoice; editing the fields does not.
        if (stampDate && !t.invoicedAt) patch.invoicedAt = new Date().toISOString();
        return { t, patch };
      })
      .filter((w) => Object.keys(w.patch).length);
    if (!writes.length) return;
    setIsSaving(true);
    try {
      await Promise.all(
        writes.map(({ t, patch }) =>
          bookingService.update(String(t._id), patch).then(() => Object.assign(t, patch))
        )
      );
    } catch (err) {
      console.error("Could not save the invoice details:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = async () => {
    if (!isLocked && missingLabels.length) {
      setShowErrors(true);
      return;
    }
    // Opened before anything is awaited, so the browser still counts it as the
    // click's own window and does not block it.
    const w = window.open("", "_blank", "width=900,height=1100");
    if (!w) return;

    // A raised invoice is only reprinted — nothing about it is written again.
    if (!isLocked) {
      // Printing is what raises a combined invoice: the trips are tied together
      // here, so opening any one of them later brings back this same invoice.
      if (isCombined) {
        try {
          const { invoiceGroupId } = await bookingService.groupInvoice(trips.map((t) => String(t._id)));
          trips.forEach((t) => { t.invoiceGroupId = invoiceGroupId; });
        } catch (err: any) {
          w.close();
          alert(err?.message || "Could not combine these trips into one invoice.");
          return;
        }
      }
      await saveFields(true);
      onInvoiceChanged?.();
    }

    const cell = (v: string) => (v && v !== "—" ? esc(v) : "");
    w.document.write(`
      <html>
        <head>
          <title>${esc(title)}</title>
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
          </style>
        </head>
        <body>
          <table>
            <colgroup>
              <col style="width:12%"><col style="width:14%"><col style="width:13%"><col style="width:15%">
              <col style="width:15%"><col style="width:14%"><col style="width:17%">
            </colgroup>

            <tr><td class="title" colspan="7">${COMPANY.name}</td></tr>
            <tr>${'<td></td>'.repeat(7)}</tr>
            <tr><td class="sub" colspan="7">Tpin ${COMPANY.tpin}</td></tr>
            <tr><td class="sub" colspan="7">Invoice details of ZRA invoice no ${cell(fields.zraNo.trim())}</td></tr>

            <tr><td colspan="4"></td><td rowspan="2" class="c b">Delivery :-</td><td rowspan="2" class="c b">Mode of payment:-</td><td class="c b">Origin:</td></tr>
            <tr><td class="b" colspan="4">${esc(clientCompany)}</td><td></td></tr>
            <tr><td colspan="4"></td><td rowspan="3" class="c b">${cell(deliveryCity)}</td><td rowspan="3" class="c b">Bank Transfer</td><td rowspan="3" class="c b">${origin}</td></tr>
            <tr><td class="b" colspan="4">${clientTpin ? `Tpin ${esc(clientTpin)}` : ""}</td></tr>
            <tr><td colspan="4"></td></tr>

            <tr><td class="c b" colspan="4">Description</td><td></td><td></td><td class="c b">Amount</td></tr>
            <tr>
              <td class="c b">INV No</td><td class="c b">Commodity</td><td class="c b">Truck No</td><td class="c b">Delivery Location</td>
              <td class="c b">DN No</td><td class="c b">Date</td><td class="c b">Zambia Kwacha</td>
            </tr>

            ${rows.map((r) => `
            <tr>
              <td>${esc(r.invNo)}</td><td>${esc(r.commodity)}</td><td>${cell(r.truck)}</td><td>${cell(r.city)}</td>
              <td>${cell(r.dn)}</td><td>${dateStr}</td><td class="r">${money(r.amount)}</td>
            </tr>`).join("")}
            <tr><td class="b">Total</td>${'<td></td>'.repeat(5)}<td class="r b">${money(subtotal)}</td></tr>
            ${withTax ? `<tr><td class="b">Vat</td>${'<td></td>'.repeat(5)}<td class="r b">${money(vat)}</td></tr>` : ""}
            <tr><td class="b">AMOUNT</td>${'<td></td>'.repeat(5)}<td class="r b">${money(grandTotal)}</td></tr>
          </table>
          <script>window.onload = function(){ window.print(); }</script>
        </body>
      </html>
    `);
    w.document.close();
  };

  // Splitting gives every trip its own invoice again.
  const handleSeparate = async () => {
    const groupId = primary.invoiceGroupId;
    if (!groupId) return;
    if (!confirm(`Split this combined invoice? It is voided, and each of the ${trips.length} trips can be invoiced again on its own or in a new combined invoice.`)) return;
    try {
      await bookingService.ungroupInvoice(groupId);
      trips.forEach((t) => { delete t.invoiceGroupId; delete t.invoicedAt; });
      onInvoiceChanged?.();
      onClose();
    } catch (err: any) {
      alert(err?.message || "Could not split the combined invoice.");
    }
  };

  // Preview mirrors the printed sheet cell-for-cell.
  const Cell = ({ children, className = "", ...rest }: any) => (
    <td className={`border border-black px-2 py-1.5 text-[11px] h-7 align-middle ${className}`} {...rest}>
      {children}
    </td>
  );
  const blanks = (n: number) => Array.from({ length: n }).map((_, i) => <Cell key={i} />);
  const inputClass = (bad = false) =>
    `w-full border rounded-lg px-3 py-2 text-[12px] outline-none transition-all disabled:bg-neutral-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
      showErrors && bad ? "bg-rose-50/40 border-rose-300 focus:border-rose-400" : "bg-white border-neutral-200 focus:border-primary/40"
    }`;
  const labelClass = "text-[9px] font-bold text-neutral-500 uppercase tracking-widest";
  const savedGroup = isCombined && trips.every((t) => t.invoiceGroupId && t.invoiceGroupId === primary.invoiceGroupId);

  return (
    <div className="fixed inset-0 z-[700] pointer-events-none">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm pointer-events-auto" onClick={onClose} />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[680px] bg-white shadow-2xl pointer-events-auto flex flex-col">
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">
              {isCombined ? `Combined Invoice · ${trips.length} trips` : "Invoice Preview"}
            </h2>
            <p className="text-[10px] text-neutral-400 font-medium mt-0.5 truncate">{invNos.join(", ")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Gone once the invoice is raised: it has been sent as it stands. */}
            {savedGroup && !isLocked && (
              <button
                onClick={handleSeparate}
                title="Give every trip its own invoice again"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-rose-600 hover:border-rose-200 transition-all"
              >
                <Unlink className="w-3 h-3" />
                Separate
              </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-neutral-400 border border-transparent hover:border-neutral-100 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ZRA number is issued outside this system; the rest can be corrected
            here when they were missed at the time. Saved on blur — until the
            invoice is printed, after which it is read only. */}
        <div className="px-5 py-3 border-b border-neutral-100 bg-amber-50/40 shrink-0">
          {isLocked && (
            <p className="mb-2.5 text-[10px] font-semibold text-slate-500">
              Invoice raised on {formatDate(primary.invoicedAt)} · read only, can be printed again.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-2.5">
            <div>
              <label className={labelClass}>ZRA Invoice No</label>
              <input type="text" value={fields.zraNo} onChange={(e) => setField("zraNo", e.target.value)} onBlur={() => saveFields()} disabled={isLocked} placeholder="e.g. 000123456" className={`mt-1.5 ${inputClass(missing.zraNo)}`} />
            </div>
            <div>
              <label className={labelClass}>Invoice Date</label>
              <input type="date" value={fields.date} onChange={(e) => setField("date", e.target.value)} onBlur={() => saveFields()} disabled={isLocked} className={`mt-1.5 ${inputClass()}`} />
            </div>
            {!isCombined && (
              <div>
                <label className={labelClass}>DN No</label>
                <input type="text" value={fields.dn[rows[0].id] ?? ""} onChange={(e) => setDn(rows[0].id, e.target.value)} onBlur={() => saveFields()} disabled={isLocked} placeholder="e.g. DO123, DO124" className={`mt-1.5 ${inputClass(missing.dn.size > 0)}`} />
              </div>
            )}
            <div>
              <label className={labelClass}>Client TPIN</label>
              <input type="text" value={fields.tpin} onChange={(e) => setField("tpin", e.target.value)} onBlur={() => saveFields()} disabled={isLocked} placeholder="e.g. 1000123456" className={`mt-1.5 ${inputClass(missing.tpin)}`} />
            </div>
          </div>

          {/* One DN per trip — each load has its own delivery note. */}
          {isCombined && (
            <div className="mt-2.5">
              <label className={labelClass}>DN No</label>
              <div className="mt-1.5 space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                {rows.map((r) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-[10px] font-bold text-slate-500">{r.invNo}</span>
                    <input type="text" value={fields.dn[r.id] ?? ""} onChange={(e) => setDn(r.id, e.target.value)} onBlur={() => saveFields()} disabled={isLocked} placeholder="e.g. DO123" className={inputClass(missing.dn.has(r.id))} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {isSaving && <p className="mt-2 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Saving…</p>}
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar p-5">
          <table className="w-full table-fixed border-collapse border border-black">
            <colgroup>
              <col style={{ width: "12%" }} /><col style={{ width: "14%" }} /><col style={{ width: "13%" }} /><col style={{ width: "15%" }} />
              <col style={{ width: "15%" }} /><col style={{ width: "14%" }} /><col style={{ width: "17%" }} />
            </colgroup>
            <tbody>
              <tr><Cell colSpan={7} className="!text-[18px] font-extrabold text-center">{COMPANY.name}</Cell></tr>
              <tr>{blanks(7)}</tr>
              <tr><Cell colSpan={7} className="!text-[13px] font-bold text-center">Tpin {COMPANY.tpin}</Cell></tr>
              <tr><Cell colSpan={7} className="!text-[13px] font-bold text-center">Invoice details of ZRA invoice no {fields.zraNo.trim()}</Cell></tr>

              <tr>
                <Cell colSpan={4} />
                <Cell rowSpan={2} className="text-center font-bold">Delivery :-</Cell>
                <Cell rowSpan={2} className="text-center font-bold">Mode of payment:-</Cell>
                <Cell className="text-center font-bold">Origin:</Cell>
              </tr>
              <tr>
                <Cell colSpan={4} className="font-bold">{clientCompany}</Cell>
                <Cell />
              </tr>
              <tr>
                <Cell colSpan={4} />
                <Cell rowSpan={3} className="text-center font-bold">{deliveryCity}</Cell>
                <Cell rowSpan={3} className="text-center font-bold">Bank Transfer</Cell>
                <Cell rowSpan={3} className="text-center font-bold">{origin}</Cell>
              </tr>
              <tr><Cell colSpan={4} className="font-bold">{clientTpin ? `Tpin ${clientTpin}` : ""}</Cell></tr>
              <tr><Cell colSpan={4} /></tr>

              <tr>
                <Cell colSpan={4} className="text-center font-bold">Description</Cell>
                <Cell /><Cell />
                <Cell className="text-center font-bold">Amount</Cell>
              </tr>
              <tr>
                <Cell className="text-center font-bold">INV No</Cell>
                <Cell className="text-center font-bold">Commodity</Cell>
                <Cell className="text-center font-bold">Truck No</Cell>
                <Cell className="text-center font-bold">Delivery Location</Cell>
                <Cell className="text-center font-bold">DN No</Cell>
                <Cell className="text-center font-bold">Date</Cell>
                <Cell className="text-center font-bold">Zambia Kwacha</Cell>
              </tr>

              {rows.map((r) => (
                <tr key={r.id}>
                  <Cell>{r.invNo}</Cell>
                  <Cell>{r.commodity}</Cell>
                  <Cell>{r.truck}</Cell>
                  <Cell>{r.city}</Cell>
                  <Cell>{r.dn}</Cell>
                  <Cell>{dateStr}</Cell>
                  <Cell className="text-right">{money(r.amount)}</Cell>
                </tr>
              ))}
              <tr>
                <Cell className="font-bold">Total</Cell>{blanks(5)}
                <Cell className="text-right font-bold">{money(subtotal)}</Cell>
              </tr>
              {withTax && (
                <tr>
                  <Cell className="font-bold">Vat</Cell>{blanks(5)}
                  <Cell className="text-right font-bold">{money(vat)}</Cell>
                </tr>
              )}
              <tr>
                <Cell className="font-bold">AMOUNT</Cell>{blanks(5)}
                <Cell className="text-right font-bold">{money(grandTotal)}</Cell>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-5 border-t border-neutral-100 bg-white">
          {showErrors && missingLabels.length > 0 && (
            <p className="mb-2.5 text-[11px] font-semibold text-rose-600">
              Fill {missingLabels.join(", ")} before printing.
            </p>
          )}
          <button
            onClick={handlePrint}
            className="w-full px-8 py-3 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {isCombined ? "Print / Download Combined Invoice" : "Print / Download Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
