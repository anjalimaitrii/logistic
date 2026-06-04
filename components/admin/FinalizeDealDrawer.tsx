"use client";

import { useState, useEffect } from "react";
import {
  X,
  MapPin,
  Package,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  User,
  Phone,
} from "lucide-react";

interface FinalizeDealDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request: any | null;
  onSubmit: (data: any) => void;
}

export default function FinalizeDealDrawer({ isOpen, onClose, request, onSubmit }: FinalizeDealDrawerProps) {
  const [amount, setAmount] = useState("");
  const [advancePaid, setAdvancePaid] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");

  useEffect(() => {
    if (request) {
      setAmount(request.price?.replace(/[^0-9]/g, "") || "");
      setAdvancePaid("");
      setSpecialRequest("");
    }
  }, [request]);

  const handleSubmit = () => {
    if (!amount || Number(amount) <= 0) {
      alert("Deal amount must be greater than 0.");
      return;
    }
    onSubmit({ amount, advancePaid, specialRequest });
    onClose();
  };

  if (!isOpen || !request) return null;

  const pickupLocations: any[] = request.pickupLocations || [];
  const dropoffLocations: any[] = request.dropoffLocations || [];

  return (
    <div className="fixed inset-0 z-600 pointer-events-none">
      <div
        className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />

      <div className="absolute right-0 top-0 bottom-0 w-full max-w-107.5 bg-white shadow-2xl pointer-events-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Finalize Deal</h2>
            <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">
              Request {request?.id || request?.tripId}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-xl text-neutral-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">

          {/* Booking Summary — read only */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em]">Booking Summary</p>

            {/* Pickup Locations */}
            <div className="p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100/50 space-y-3">
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">
                Pickup {pickupLocations.length > 1 ? `(${pickupLocations.length} stops)` : ""}
              </p>
              {pickupLocations.map((loc: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-neutral-900">{loc.address?.city || "—"}</div>
                    {(loc.address?.plotNo || loc.address?.street) && (
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {[loc.address?.plotNo, loc.address?.street].filter(Boolean).join(", ")}
                      </div>
                    )}
                    <div className="text-[10px] text-emerald-600 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" /> {loc.contactPerson}
                      {loc.contactNumber && <><Phone className="w-3 h-3 ml-1" /> {loc.contactNumber}</>}
                    </div>
                  </div>
                </div>
              ))}
              {pickupLocations.length === 0 && (
                <p className="text-[11px] text-neutral-400 italic">No pickup info</p>
              )}
            </div>

            {/* Dropoff Locations */}
            <div className="p-4 rounded-2xl bg-rose-50/30 border border-rose-100/50 space-y-3">
              <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">
                Drop-off {dropoffLocations.length > 1 ? `(${dropoffLocations.length} stops)` : ""}
              </p>
              {dropoffLocations.map((loc: any, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                    {String.fromCharCode(65 + pickupLocations.length + idx)}
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-neutral-900">{loc.address?.city || "—"}</div>
                    {(loc.address?.plotNo || loc.address?.street) && (
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {[loc.address?.plotNo, loc.address?.street].filter(Boolean).join(", ")}
                      </div>
                    )}
                    <div className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1">
                      <User className="w-3 h-3" /> {loc.contactPerson}
                      {loc.contactNumber && <><Phone className="w-3 h-3 ml-1" /> {loc.contactNumber}</>}
                    </div>
                  </div>
                </div>
              ))}
              {dropoffLocations.length === 0 && (
                <p className="text-[11px] text-neutral-400 italic">No drop-off info</p>
              )}
            </div>

            {/* Cargo & Date */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-[11px] text-neutral-700">
                <Package className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-medium">{request.cargoDetails?.goodsType || "—"}</span>
                <span className="text-neutral-400">·</span>
                <span className="font-medium">{request.cargoDetails?.weight} kg</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-neutral-700">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-medium">{request.requirement?.bodyType || "—"}</span>
              </div>
              {request.cargoDetails?.loadingDate && (
                <div className="flex items-center gap-2 text-[11px] text-neutral-700">
                  <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-medium">
                    {new Date(request.cargoDetails.loadingDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em]">Finalization</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Final Amount</label>
                <div className="relative group">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Total Price"
                    className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Advance Paid</label>
                <input
                  type="number"
                  value={advancePaid}
                  onChange={(e) => setAdvancePaid(e.target.value)}
                  placeholder="Amount Paid"
                  className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Special Request</label>
              <div className="relative group">
                <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                <textarea
                  rows={3}
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  placeholder="Special instructions for driver or logistics team..."
                  className="w-full bg-neutral-50 border border-transparent rounded-xl py-3 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-white">
          <button
            onClick={handleSubmit}
            className="w-full px-8 py-3 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Confirm & Create Job
          </button>
        </div>
      </div>
    </div>
  );
}
