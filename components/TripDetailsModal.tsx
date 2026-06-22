"use client";

import { motion } from "framer-motion";
import { X, MapPin, Package } from "lucide-react";
import { formatDate } from "@/lib/datetime";

const getStatusStyles = (type: string) => {
  switch (type?.toLowerCase()) {
    case "transit":
    case "active":     return "bg-indigo-50 text-indigo-600 border-indigo-100";
    case "accepted":   return "bg-blue-50 text-blue-600 border-blue-100";
    case "finalized":  return "bg-violet-50 text-violet-600 border-violet-100";
    case "delivered":
    case "completed":  return "bg-emerald-50 text-emerald-600 border-emerald-100";
    case "pending":    return "bg-amber-50 text-amber-600 border-amber-100";
    case "rejected":   return "bg-rose-50 text-rose-600 border-rose-100";
    default:           return "bg-slate-50 text-slate-500 border-slate-100";
  }
};

const getLabel = (idx: number, offset = 0) => String.fromCharCode(65 + offset + idx);

interface TripDetailsModalProps {
  booking: any;
  onClose: () => void;
}

// Read-only trip summary modal — shared by the client jobs view and the
// admin secret portal "view" action.
export default function TripDetailsModal({ booking, onClose }: TripDetailsModalProps) {
  const pickups: any[] = booking?.pickupLocations || [];
  const dropoffs: any[] = booking?.dropoffLocations || [];

  return (
    <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-[14px] font-semibold text-slate-900 uppercase tracking-widest">Trip Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {/* Status + Vehicle */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
              <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(booking?.status)}`}>
                {booking?.status || "—"}
              </span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vehicle</p>
              <p className="text-[12px] font-semibold text-slate-800">{booking?.requirement?.bodyType || "—"}</p>
            </div>
          </div>

          {/* Cargo Details */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-3">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <Package className="w-3 h-3" /> Cargo Details
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[9px] text-slate-400 mb-0.5">Type</p>
                <p className="text-[11px] font-semibold text-slate-800">{booking?.cargoDetails?.goodsType || "—"}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 mb-0.5">Weight</p>
                <p className="text-[11px] font-semibold text-slate-800">{booking?.cargoDetails?.weight ? `${booking.cargoDetails.weight} kg` : "—"}</p>
              </div>
              <div>
                <p className="text-[9px] text-slate-400 mb-0.5">Date</p>
                <p className="text-[11px] font-semibold text-slate-800">
                  {booking?.cargoDetails?.loadingDate ? formatDate(booking.cargoDetails.loadingDate, { year: undefined }) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Pickup Locations */}
          {pickups.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Pickup Stops
              </p>
              {pickups.map((loc: any, idx: number) => (
                <div key={idx} className="bg-emerald-50/40 border border-emerald-100/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">
                      {getLabel(idx)}
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700">Pickup {getLabel(idx)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    {loc.contactPerson && (
                      <p className="text-slate-600"><span className="text-slate-400">Person:</span> {loc.contactPerson}</p>
                    )}
                    {loc.contactNumber && (
                      <p className="text-slate-600"><span className="text-slate-400">Phone:</span> {loc.contactNumber}</p>
                    )}
                    {loc.address?.city && (
                      <p className="text-slate-600 col-span-2">
                        <span className="text-slate-400">Address:</span>{" "}
                        {[loc.address.plotNo, loc.address.street, loc.address.city, loc.address.state, loc.address.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Arrow */}
          {pickups.length > 0 && dropoffs.length > 0 && (
            <div className="flex justify-center">
              <div className="text-xl text-slate-200">↓</div>
            </div>
          )}

          {/* Dropoff Locations */}
          {dropoffs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[9px] font-bold text-rose-600 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> Dropoff Stops
              </p>
              {dropoffs.map((loc: any, idx: number) => (
                <div key={idx} className="bg-rose-50/40 border border-rose-100/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold">
                      {getLabel(idx, pickups.length)}
                    </div>
                    <span className="text-[10px] font-semibold text-rose-700">Dropoff {getLabel(idx, pickups.length)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                    {loc.contactPerson && (
                      <p className="text-slate-600"><span className="text-slate-400">Person:</span> {loc.contactPerson}</p>
                    )}
                    {loc.contactNumber && (
                      <p className="text-slate-600"><span className="text-slate-400">Phone:</span> {loc.contactNumber}</p>
                    )}
                    {loc.address?.city && (
                      <p className="text-slate-600 col-span-2">
                        <span className="text-slate-400">Address:</span>{" "}
                        {[loc.address.plotNo, loc.address.street, loc.address.city, loc.address.state, loc.address.country].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-900 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
