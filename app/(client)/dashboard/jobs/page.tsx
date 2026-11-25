"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import { ClientMobileNav } from "@/components/client/ClientMobileNav";
import { canChatForTrip } from "@/lib/chatAvailability";
import {
   Search,
   MessageSquare,
   Eye,
   TrendingUp,
   Package,
   CheckCircle2,
   ChevronRight,
   X,
   MapPin,
   Plus,
   FileText
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { bookingService } from "@/services/bookingService";
import ClientNotificationBell from "@/components/client/ClientNotificationBell";
import { useClientNotifications } from "@/context/ClientNotificationContext";
import { formatDate, inDateRange } from "@/lib/datetime";
import DateRangeFilter from "@/components/admin/DateRangeFilter";
import { clientNameOf } from "@/lib/bookingParty";
import { statusLabel } from "@/lib/tripStage";

// A multi-stop trip reports "offloading_2"; its colour is the step's, whatever the stop.
const stepOf = (type: string) => (type || "").toLowerCase().replace(/_\d+$/, "");

const getStatusStyles = (type: string) => {
   switch (stepOf(type)) {
      case "offloading": return "bg-orange-50 text-orange-600 border-orange-100";
      case "transit":
      case "active":     return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "accepted":   return "bg-blue-50 text-blue-600 border-blue-100";
      case "finalized":  return "bg-violet-50 text-violet-600 border-violet-100";
      case "delivered":  return "bg-sky-50 text-sky-600 border-sky-100";
      case "paid":
      case "completed":  return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "payment due":
      case "pending":    return "bg-amber-50 text-amber-600 border-amber-100";
      case "rejected":   return "bg-rose-50 text-rose-600 border-rose-100";
      default:           return "bg-slate-50 text-slate-500 border-slate-100";
   }
};

const getDotColor = (type: string) => {
   switch (stepOf(type)) {
      case "offloading": return "bg-orange-500";
      case "transit":
      case "active":    return "bg-indigo-500 animate-pulse";
      case "accepted":  return "bg-blue-500";
      case "finalized": return "bg-violet-500";
      case "delivered": return "bg-sky-500";
      case "completed": return "bg-emerald-500";
      case "pending":   return "bg-amber-500";
      default:          return "bg-rose-500";
   }
};

// What each status means, in a sentence — so a client is not left decoding
// "offloaded" or "repositioning". Keyed by the step, without any stop number.
const STATUS_HINTS: Record<string, string> = {
   pending:       "Booking received — waiting to be confirmed.",
   accepted:      "Booking accepted — the price is being finalised.",
   active:        "Booking confirmed — a truck is being arranged.",
   finalized:     "Price agreed — a truck will be assigned to this trip.",
   paid:          "Paid in full.",
   started:       "Trip started — the truck is heading to the pickup point.",
   arrived:       "The truck has reached the pickup point.",
   loading:       "Your cargo is being loaded onto the truck.",
   departed:      "Loaded — the truck is on its way to the delivery point.",
   transit:       "On the way to the delivery point.",
   reached:       "The truck has reached the delivery point.",
   offloading:    "Your cargo has been offloaded at the delivery point.",
   returning:     "Delivery done — the truck has left and is heading back to the yard.",
   repositioning: "Delivery done — the truck has left for its next job.",
   delivered:     "Delivered — the invoice is still to be raised.",
   completed:     "Completed — delivered and invoiced.",
   rejected:      "This booking was declined.",
   cancelled:     "This booking was cancelled.",
};

// A multi-stop trip says which stop: pickups for the loading side, drops for the delivery side.
const statusHint = (status: string): string => {
   const [, step = "", n] = (status || "").toLowerCase().match(/^(.*?)(?:_(\d+))?$/) || [];
   const hint = STATUS_HINTS[step] || "";
   if (!hint || !n) return hint;
   const where = ["arrived", "loading", "departed"].includes(step) ? `pickup ${n}`
      : ["reached", "offloading"].includes(step) ? `drop ${n}` : "";
   return where ? `${hint} (${where})` : hint;
};

// The trip status chip, explained on hover.
function StatusBadge({ status }: { status: string }) {
   const hint = statusHint(status);
   return (
      <span className="relative group inline-flex">
         <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(status)} ${hint ? "cursor-help" : ""}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDotColor(status)}`} />
            {statusLabel(status)}
         </span>
         {hint && (
            <span
               role="tooltip"
               className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-50 w-max max-w-[220px] bg-slate-900 text-white text-[10px] font-medium leading-snug px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none"
            >
               {hint}
            </span>
         )}
      </span>
   );
}

// For the client a trip is complete once it is invoiced, not the moment the
// truck is empty: until the invoice is printed it reads "delivered" — the cargo
// is in, the bill is not.
const clientTripStatus = (b: any): string => {
   const ts = (b?.tripStatus || "").toLowerCase();
   if (ts === "completed" || ts === "delivered") {
      return b?.invoicedAt || b?.invoiceGroupId ? "completed" : "delivered";
   }
   return b?.tripStatus || b?.status || "pending";
};

// The trip-stage filter, in the client's terms: "delivered" is still waiting on
// its invoice, "completed" has it.
const CLIENT_STAGES = {
   "not-started": { label: "Not Started", test: (b: any) => !b?.tripStatus },
   ongoing:       { label: "Ongoing",     test: (b: any) => !!b?.tripStatus && !["completed", "delivered"].includes(clientTripStatus(b)) },
   delivered:     { label: "Delivered",   test: (b: any) => clientTripStatus(b) === "delivered" },
   completed:     { label: "Completed",   test: (b: any) => clientTripStatus(b) === "completed" },
};

const getLabel = (idx: number, offset = 0) => String.fromCharCode(65 + offset + idx);

// ── Booking detail modal — defined outside to prevent focus loss ──
interface ModalProps { booking: any; onClose: () => void; }

// What a trip's proof of delivery is made of: the photos and receipts uploaded
// when the cargo came off, and the POD numbers recorded with them.
const podFiles = (b: any): any[] => (b?.attachments || []).filter((f: any) => f?.url);
const podNotes = (b: any): string[] => (b?.deliveryOrders || []).filter(Boolean);

// ── Proof of delivery viewer ──
function PodModal({ booking, onClose }: ModalProps) {
   const notes = podNotes(booking);
   // The stored links do not open — the bucket is private — so the files are
   // fetched with signed links each time the viewer opens.
   const [files, setFiles] = useState<any[] | null>(null);
   const [loadError, setLoadError] = useState(false);
   useEffect(() => {
      let cancelled = false;
      bookingService.getAttachments(String(booking._id))
         .then((r) => { if (!cancelled) setFiles(r.files || []); })
         .catch(() => { if (!cancelled) { setFiles([]); setLoadError(true); } });
      return () => { cancelled = true; };
   }, [booking._id]);

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
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
               <div>
                  <h2 className="text-[14px] font-semibold text-slate-900 uppercase tracking-widest">Proof of Delivery</h2>
                  <p className="text-[10px] text-slate-400 mt-0.5">{booking.tripId || ""}</p>
               </div>
               <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
               >
                  <X className="w-4 h-4" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
               {notes.length > 0 && (
                  <div className="bg-slate-50 rounded-2xl p-4">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">POD No</p>
                     <p className="text-[13px] font-bold text-slate-900 mt-1">{notes.join(", ")}</p>
                  </div>
               )}

               {files === null ? (
                  <p className="text-[11px] text-slate-400 text-center py-6">Loading files…</p>
               ) : loadError ? (
                  <p className="text-[11px] text-rose-500 text-center py-6">Could not load the delivery files. Please try again.</p>
               ) : files.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                     {files.map((f, i) => (
                        <a
                           key={i}
                           href={f.url}
                           target="_blank"
                           rel="noopener noreferrer"
                           title="Open in a new tab"
                           className="block rounded-xl border border-slate-100 overflow-hidden hover:border-primary/30 transition-all"
                        >
                           {String(f.type || "").startsWith("image/") ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={f.url} alt={f.name || `Delivery photo ${i + 1}`} className="w-full h-32 object-cover bg-slate-50" />
                           ) : (
                              <div className="w-full h-32 flex items-center justify-center bg-slate-50">
                                 <FileText className="w-8 h-8 text-slate-300" />
                              </div>
                           )}
                           <p className="px-3 py-2 text-[10px] font-semibold text-slate-600 truncate">{f.name || `File ${i + 1}`}</p>
                        </a>
                     ))}
                  </div>
               ) : (
                  <p className="text-[11px] text-slate-400 italic text-center py-6">No photos or documents were uploaded at delivery.</p>
               )}
            </div>
         </motion.div>
      </div>
   );
}

function BookingDetailModal({ booking, onClose }: ModalProps) {
   const pickups: any[] = booking.pickupLocations || [];
   const dropoffs: any[] = booking.dropoffLocations || [];

   return (
      <div className="fixed inset-0 z-600 flex items-center justify-center p-4">
         {/* backdrop */}
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

               {/* Who is carrying it. Only appears once a fleet unit is on the
                   job — before that there is no truck or driver to name. */}
               {booking.fleet && (
                  <div className="bg-slate-900 rounded-2xl p-4 space-y-3 text-white">
                     <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Transporter</p>
                     <p className="text-[13px] font-bold -mt-1">{booking.fleet.transporter}</p>

                     <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                        <div className="space-y-0.5">
                           {/* A rig is two registered vehicles; the trailer only
                               appears when the truck actually has one. */}
                           <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">
                              {booking.fleet.trailerNumber ? "Horse / Trailer" : "Truck"}
                           </p>
                           <p className="text-[12px] font-semibold">
                              {booking.fleet.truckNumber || "—"}
                              {booking.fleet.trailerNumber && (
                                 <span className="text-white/50"> · {booking.fleet.trailerNumber}</span>
                              )}
                           </p>
                        </div>
                        <div className="space-y-0.5">
                           <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Driver</p>
                           <p className="text-[12px] font-semibold">{booking.fleet.driverName || "—"}</p>
                        </div>
                     </div>

                     {(booking.fleet.driverPhone || booking.fleet.driverNrc) && (
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                           {booking.fleet.driverPhone && (
                              <div className="space-y-0.5">
                                 <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Driver Phone</p>
                                 <a
                                    href={`tel:${booking.fleet.driverPhone}`}
                                    className="text-[12px] font-semibold underline underline-offset-2"
                                 >
                                    {booking.fleet.driverPhone}
                                 </a>
                              </div>
                           )}
                           {booking.fleet.driverNrc && (
                              <div className="space-y-0.5">
                                 <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Driver NRC</p>
                                 <p className="text-[12px] font-semibold">{booking.fleet.driverNrc}</p>
                              </div>
                           )}
                        </div>
                     )}
                  </div>
               )}

               {/* Status + Vehicle */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trip Status</p>
                     {/* The trip's own status, as the table shows it — not the booking's office status. */}
                     <div><StatusBadge status={clientTripStatus(booking)} /></div>
                     {statusHint(clientTripStatus(booking)) && (
                        <p className="text-[10px] text-slate-500 leading-snug pt-1">{statusHint(clientTripStatus(booking))}</p>
                     )}
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Vehicle</p>
                     <p className="text-[12px] font-semibold text-slate-800">{booking.requirement?.bodyType || "—"}</p>
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
                        <p className="text-[11px] font-semibold text-slate-800">{booking.cargoDetails?.goodsType || "—"}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-400 mb-0.5">Weight</p>
                        <p className="text-[11px] font-semibold text-slate-800">{booking.cargoDetails?.weight ? `${booking.cargoDetails.weight} kg` : "—"}</p>
                     </div>
                     <div>
                        <p className="text-[9px] text-slate-400 mb-0.5">Date</p>
                        <p className="text-[11px] font-semibold text-slate-800">
                           {booking.cargoDetails?.loadingDate ? formatDate(booking.cargoDetails.loadingDate, { year: undefined }) : "—"}
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

export default function JobsPage() {
   const { unreadTrips, openChat } = useClientNotifications();
   const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
   const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
   const [podBooking, setPodBooking] = useState<any | null>(null);
   const [bookings, setBookings] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [viewMode, setViewMode] = useState<"personal" | "company">("personal");
   const [user, setUser] = useState<any>(null);
   const [cancellingId, setCancellingId] = useState<string | null>(null);
   // Table filters: created-date range (YYYY-MM-DD, each end optional), trip stage, search.
   const [startDate, setStartDate] = useState("");
   const [endDate, setEndDate] = useState("");
   const [stageFilter, setStageFilter] = useState<"all" | keyof typeof CLIENT_STAGES>("all");
   const [searchQuery, setSearchQuery] = useState("");
   const isDesktop = useMediaQuery("(min-width: 768px)");

   useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
      loadBookings();
   }, []);

   const loadBookings = async () => {
      try {
         setIsLoading(true);
         // Fetch all bookings — personal/company filtering done client-side
         const data = await bookingService.getAll();
         setBookings(Array.isArray(data) ? data : (data?.bookings || []));
      } catch (error) {
         console.error("Failed to fetch bookings:", error);
      } finally {
         setIsLoading(false);
      }
   };

   const handleCancel = async (bookingId: string) => {
      if (!confirm("Are you sure you want to cancel this booking?")) return;
      setCancellingId(bookingId);
      try {
         await bookingService.cancel(bookingId);
         await loadBookings();
      } catch {
         alert("Failed to cancel booking. Please try again.");
      } finally {
         setCancellingId(null);
      }
   };

   // ── Filter by personal / company ──
   const currentViewBookings = bookings.filter(b => {
      const currentUserId = String(user?._id || user?.id || "");
      const bookingClientId = String(b.clientId?._id || b.clientId || "");

      if (viewMode === "personal") {
         return bookingClientId === currentUserId;
      }

      // Company view: match by company ID if available
      const userCompanyId = String(user?.company?._id || user?.company || user?.companyId || "");
      const bookingCompanyId = String(
         b.clientId?.company?._id || b.clientId?.company ||
         b.clientId?.companyId   || b.companyId || ""
      );
      if (userCompanyId && userCompanyId !== "undefined" && bookingCompanyId && bookingCompanyId !== "undefined") {
         return userCompanyId === bookingCompanyId;
      }
      // Fallback: show all bookings when company info isn't in the response
      return true;
   });

   const dynamicStats = [
      { label: "Total Jobs",  value: currentViewBookings.length, icon: Package, color: "text-primary", bg: "bg-primary/10" },
      { label: "Finalized",   value: currentViewBookings.filter(b => b.status?.toLowerCase() === "finalized").length, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
      { label: "Completed",   value: currentViewBookings.filter(b => clientTripStatus(b) === "completed").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
   ];

   // ── Date range and search ── (days compared in CAT, like every other date here)
   const query = searchQuery.trim().toLowerCase();
   const searchedBookings = currentViewBookings.filter(b => {
      if (b.status === "cancelled") return false;
      if (!inDateRange(b.cargoDetails?.loadingDate || b.createdAt, startDate, endDate)) return false;
      if (!query) return true;
      // Trip ID, route, cargo, who booked it and the POD numbers.
      const haystack = [
         b.tripId,
         ...(b.pickupLocations || []).map((p: any) => p?.address?.city),
         ...(b.dropoffLocations || []).map((d: any) => d?.address?.city),
         ...[].concat(b.cargoDetails?.goodsType || []),
         clientNameOf(b),
         ...(b.deliveryOrders || []),
      ].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
   });

   // ── Trip stage ── (counted after the date and search, so each option says what it would show)
   const stageFilteredBookings = stageFilter === "all"
      ? searchedBookings
      : searchedBookings.filter(CLIENT_STAGES[stageFilter].test);

   // ── Map bookings to display rows (new multi-location structure) ──
   const displayJobs = stageFilteredBookings.map(b => {
      const allCities = [
         ...(b.pickupLocations || []).map((p: any) => p?.address?.city).filter(Boolean),
         ...(b.dropoffLocations || []).map((d: any) => d?.address?.city).filter(Boolean),
      ] as string[];
      // Did the logged-in client create this booking? (company-mates only get to view)
      const isOwn = String(b.clientId?._id || b.clientId || "") === String(user?._id || user?.id || "");
      // Where the money stands, in the client's terms. The booking's own status
      // ("finalized", "paid"…) is an office word and read as a second trip status.
      const billed = Number(b.financials?.finalAmount || b.finalAmount || 0);
      const paidSoFar = Number(b.advancePaid || 0);
      const fullyPaid = (b.status || "").toLowerCase() === "paid" || (billed > 0 && paidSoFar >= billed);
      return {
         raw: b,
         tripId: b.tripId || `#${b._id?.slice(-7).toUpperCase()}`,
         cities: allCities.length ? allCities : ["—"],
         cargo: b.cargoDetails?.goodsType || "Cargo",
         weight: b.cargoDetails?.weight || 0,
         status: clientTripStatus(b),
         // Nothing until an amount is billed.
         payment: billed > 0 ? (fullyPaid ? "Paid" : "Payment Due") : "",
         // What is left to pay, shown only once part of the bill is in.
         balance: !fullyPaid && paidSoFar > 0 ? Math.max(0, billed - paidSoFar) : 0,
         podCount: podFiles(b).length,
         hasPod: podFiles(b).length > 0 || podNotes(b).length > 0,
         // The trip's date — its loading day, or the day it was booked. The date filter reads the same.
         date: formatDate(b.cargoDetails?.loadingDate || b.createdAt) || "—",
         finalAmount: b.financials?.finalAmount || b.finalAmount,
         bookedBy: clientNameOf(b, "—"),
         isOwn,
         // Only the client who created the booking can cancel it (not company-mates)
         canCancel:
            isOwn &&
            (!b.tripStatus || ["", "accepted", "pending"].includes((b.tripStatus || "").toLowerCase())),
      };
   });

   return (
      <div className="flex bg-white min-h-screen relative overflow-x-hidden">
         {/* ════ SIDEBAR ════ */}
         <div className="hidden md:block fixed top-0 left-0 h-screen z-50">
            <ClientSidebarNavigation
               isExpanded={isSidebarExpanded}
               onHover={setIsSidebarExpanded}
            />
         </div>

         {/* ════ MAIN CONTENT ════ */}
         <motion.main
            initial={false}
            animate={{
               paddingLeft: isDesktop ? (isSidebarExpanded ? 240 + 24 : 68 + 24) : 16,
               paddingRight: isDesktop ? 24 : 16
            }}
            className="flex-1 min-w-0 bg-neutral-50 pb-24 md:pb-12"
         >
            {/* ── TOP BAR ── */}
            <header className="h-14 bg-white/80 backdrop-blur-md border-b border-neutral-100 flex items-center justify-between sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 mb-6">
               <div className="flex items-center gap-4 flex-1">
                  <div className="relative max-w-sm w-full group text-slate-900">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                     <input
                        type="text"
                        placeholder="Search jobs, trip IDs..."
                        className="w-full bg-slate-50 border border-transparent rounded-lg py-1.5 pl-9 pr-4 text-[12px] font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-200 outline-none transition-all"
                     />
                  </div>
               </div>
               <div className="flex items-center gap-2">
                  <ClientNotificationBell />
                  <div className="h-4 w-px bg-slate-200 mx-1" />
                  <Link href="/dashboard/profile" className="flex items-center gap-2 pl-2 hover:opacity-80 transition-opacity cursor-pointer">
                     <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                     </div>
                  </Link>
               </div>
            </header>

            <div className="w-full">
               {/* ── PAGE HEADER ── */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        <span>Speedogistic</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                        <span className="text-primary">My Jobs</span>
                     </div>
                     <h1 className="text-xl font-bold text-slate-900 tracking-tight">Job Management</h1>
                     <p className="text-[12px] font-medium text-slate-500">Track and manage your active and past shipments.</p>
                  </div>
                  <div className="flex gap-2">
                     <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        <button
                           onClick={() => setViewMode("personal")}
                           className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === "personal" ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                        >
                           My Jobs
                        </button>
                        <button
                           onClick={() => setViewMode("company")}
                           className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${viewMode === "company" ? "bg-slate-900 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                        >
                           Company Jobs
                        </button>
                     </div>
                  </div>
               </div>

               {/* ── STATS ── */}
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-8">
                  {dynamicStats.map((stat, i) => (
                     <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${stat.bg} ${stat.color}`}>
                           <stat.icon className="w-4 h-4" />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                        <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-1.5">{stat.value}</h3>
                     </div>
                  ))}
               </div>

               {/* ── JOBS TABLE ── */}
               <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-3 bg-slate-50/30">
                     <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-primary rounded-full" />
                        {viewMode === "personal" ? "My Bookings" : `Company Bookings (${user?.company?.companyName || "All"})`}
                     </h3>
                     <div className="flex flex-wrap items-center gap-2">
                        <div className="relative group">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                           <input
                              type="text"
                              placeholder="Search trip, city, POD no…"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="bg-white border border-slate-100 rounded-lg pl-9 pr-3 py-2 text-[11px] font-medium outline-none focus:border-primary/20 transition-all w-48"
                           />
                        </div>
                        <select
                           value={stageFilter}
                           onChange={(e) => setStageFilter(e.target.value as typeof stageFilter)}
                           className="px-3 py-2 bg-white border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                        >
                           <option value="all">All Trips ({searchedBookings.length})</option>
                           {(Object.keys(CLIENT_STAGES) as (keyof typeof CLIENT_STAGES)[]).map(k => (
                              <option key={k} value={k}>{CLIENT_STAGES[k].label} ({searchedBookings.filter(CLIENT_STAGES[k].test).length})</option>
                           ))}
                        </select>
                        <DateRangeFilter from={startDate} to={endDate} onChange={(f, t) => { setStartDate(f); setEndDate(t); }} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           {isLoading ? "Fetching…" : `${displayJobs.length} items`}
                        </span>
                     </div>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-200">
                        <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-50">
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sr. No.</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route</th>
                              {viewMode === "company" && (
                                 <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Booked By</th>
                              )}
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargo</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bill Amount</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Payment</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trip Status</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">POD</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {isLoading ? (
                              <tr><td colSpan={viewMode === "company" ? 10 : 9} className="px-6 py-12 text-center text-[12px] text-slate-400 italic">Loading your shipments...</td></tr>
                           ) : displayJobs.length === 0 ? (
                              <tr>
                                 <td colSpan={viewMode === "company" ? 10 : 9} className="px-6 py-12 text-center">
                                    <Package className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                                    <p className="text-[12px] font-medium text-slate-400">No bookings found yet.</p>
                                 </td>
                              </tr>
                           ) : (
                              displayJobs.map((job, i) => (
                                 <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                       <span className="text-[13px] font-bold text-slate-900">{i + 1}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className="text-[12px] font-medium text-slate-600 whitespace-nowrap">{job.date}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="relative group inline-flex items-center gap-1">
                                          <span className="text-[11px] font-medium text-slate-600 italic">{job.cities[0]}</span>
                                          {job.cities.length > 1 && <span className="text-slate-300 text-[10px] font-bold">→</span>}
                                          {job.cities.length > 2 && <span className="text-[11px] text-slate-400 italic">...</span>}
                                          {job.cities.length > 2 && <span className="text-slate-300 text-[10px] font-bold">→</span>}
                                          {job.cities.length > 1 && <span className="text-[11px] font-medium text-slate-600 italic">{job.cities[job.cities.length - 1]}</span>}
                                          {job.cities.length > 2 && (
                                             <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-50 bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none">
                                                {job.cities.join(" → ")}
                                                <div className="absolute top-full left-3 border-4 border-transparent border-t-slate-900" />
                                             </div>
                                          )}
                                       </div>
                                    </td>
                                    {viewMode === "company" && (
                                       <td className="px-6 py-4">
                                          <span className="text-[11px] font-semibold text-slate-700 capitalize">{job.bookedBy}</span>
                                       </td>
                                    )}
                                    <td className="px-6 py-4">
                                       <span className="text-[12px] font-bold text-slate-800">{job.cargo}</span>
                                       <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                                          {job.weight > 0 ? `${job.weight} KG` : "—"}
                                       </p>
                                    </td>
                                    <td className="px-6 py-4">
                                       {job.finalAmount ? (
                                          <span className="text-[12px] font-bold text-slate-900">K{job.finalAmount}</span>
                                       ) : (
                                          <span className="text-[10px] font-bold text-slate-300 uppercase">---</span>
                                       )}
                                    </td>
                                    <td className="px-6 py-4">
                                       {job.payment ? (
                                          <div className="flex flex-col gap-1 items-start">
                                             <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(job.payment)}`}>
                                                {job.payment}
                                             </span>
                                             {job.balance > 0 && (
                                                <span className="text-[10px] font-semibold text-slate-500">K{job.balance} left</span>
                                             )}
                                          </div>
                                       ) : (
                                          <span className="text-[10px] font-bold text-slate-300 uppercase">---</span>
                                       )}
                                    </td>
                                    <td className="px-6 py-4">
                                       <StatusBadge status={job.status} />
                                    </td>
                                    <td className="px-6 py-4">
                                       {job.hasPod ? (
                                          <button
                                             onClick={() => setPodBooking(job.raw)}
                                             className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-100 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase tracking-widest hover:bg-emerald-100 transition-all"
                                          >
                                             <FileText className="w-3 h-3" />
                                             View{job.podCount > 0 ? ` (${job.podCount})` : ""}
                                          </button>
                                       ) : (
                                          <span className="text-[10px] font-bold text-slate-300 uppercase">---</span>
                                       )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex justify-end gap-2">
                                          <button
                                             onClick={() => setSelectedBooking(job.raw)}
                                             className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all border border-transparent hover:border-slate-100"
                                             title="View Details"
                                          >
                                             <Eye className="w-4 h-4" />
                                          </button>
                                          {job.isOwn && canChatForTrip(job.raw) && (
                                             <button
                                                onClick={() => openChat(job.tripId)}
                                                className="relative p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all border border-transparent hover:border-slate-100"
                                                title="Chat with Support"
                                             >
                                                <MessageSquare className="w-4 h-4" />
                                                {unreadTrips.has(job.tripId) && (
                                                   <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                                                )}
                                             </button>
                                          )}
                                          {job.canCancel && (
                                             <button
                                                onClick={() => handleCancel(job.raw._id)}
                                                disabled={cancellingId === job.raw._id}
                                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest text-rose-500 border border-rose-100 bg-rose-50 hover:bg-rose-100 transition-all disabled:opacity-50"
                                                title="Cancel Booking"
                                             >
                                                <X className="w-3 h-3" />
                                                {cancellingId === job.raw._id ? "..." : "Cancel"}
                                             </button>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>

                  {/* Mobile Card List */}
                  <div className="md:hidden divide-y divide-slate-50">
                     {isLoading ? (
                        <div className="px-5 py-12 text-center text-[12px] text-slate-400 italic">Syncing shipments...</div>
                     ) : displayJobs.length === 0 ? (
                        <div className="px-5 py-12 text-center flex flex-col items-center gap-2">
                           <Package className="w-8 h-8 text-slate-100" />
                           <p className="text-[12px] font-medium text-slate-400">No bookings found yet.</p>
                        </div>
                     ) : (
                        displayJobs.map((job, i) => (
                           <div key={i} className="p-5 space-y-4 hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-center justify-between">
                                 <div>
                                    <span className="text-[12px] font-bold text-slate-900">{i + 1}</span>
                                    <p className="text-[10px] text-slate-400">{job.date}</p>
                                 </div>
                                 <StatusBadge status={job.status} />
                              </div>
                              {/* Phones have no hover — the status is spelt out under it instead. */}
                              {statusHint(job.status) && (
                                 <p className="-mt-2 text-[10px] text-slate-500 text-right">{statusHint(job.status)}</p>
                              )}
                              {/* The bill and where its payment stands, apart from the trip status. */}
                              {job.finalAmount && (
                                 <div className="flex items-center justify-between">
                                    <div>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Bill Amount</p>
                                       <span className="text-[12px] font-bold text-slate-900">K{job.finalAmount}</span>
                                       {job.balance > 0 && (
                                          <span className="ml-2 text-[10px] font-semibold text-slate-500">K{job.balance} left</span>
                                       )}
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(job.payment)}`}>
                                       {job.payment}
                                    </span>
                                 </div>
                              )}
                              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                 <div className="inline-flex items-center gap-1 flex-wrap">
                                    <span className="text-[12px] font-medium text-slate-600 italic">{job.cities[0]}</span>
                                    {job.cities.length > 1 && <span className="text-slate-300 text-[11px] font-bold">→</span>}
                                    {job.cities.length > 2 && <span className="text-[12px] text-slate-400 italic">...</span>}
                                    {job.cities.length > 2 && <span className="text-slate-300 text-[11px] font-bold">→</span>}
                                    {job.cities.length > 1 && <span className="text-[12px] font-medium text-slate-600 italic">{job.cities[job.cities.length - 1]}</span>}
                                 </div>
                                 {job.cities.length > 2 && (
                                    <p className="text-[9px] text-slate-400 mt-1">{job.cities.join(" → ")}</p>
                                 )}
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                 <div>
                                    <span className="text-[11px] font-bold text-slate-800">{job.cargo}</span>
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-tighter">
                                       {job.weight > 0 ? `${job.weight} KG` : "—"}
                                    </p>
                                    {viewMode === "company" && (
                                       <p className="text-[9px] font-medium text-slate-400 mt-0.5 capitalize">By {job.bookedBy}</p>
                                    )}
                                 </div>
                                 <div className="flex gap-2">
                                    <button
                                       onClick={() => setSelectedBooking(job.raw)}
                                       className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-widest transition-all flex items-center gap-1.5"
                                    >
                                       <Eye className="w-3.5 h-3.5" /> View
                                    </button>
                                    {job.hasPod && (
                                       <button
                                          onClick={() => setPodBooking(job.raw)}
                                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-[10px] font-bold text-emerald-700 uppercase tracking-widest transition-all flex items-center gap-1.5"
                                       >
                                          <FileText className="w-3.5 h-3.5" /> POD
                                       </button>
                                    )}
                                    {job.isOwn && canChatForTrip(job.raw) && (
                                       <button
                                          onClick={() => openChat(job.tripId)}
                                          className="relative p-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary transition-all"
                                       >
                                          <MessageSquare className="w-4 h-4" />
                                          {unreadTrips.has(job.tripId) && (
                                             <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white" />
                                          )}
                                       </button>
                                    )}
                                    {job.canCancel && (
                                       <button
                                          onClick={() => handleCancel(job.raw._id)}
                                          disabled={cancellingId === job.raw._id}
                                          className="px-3 py-2 bg-rose-50 hover:bg-rose-100 rounded-lg text-[10px] font-bold text-rose-500 uppercase tracking-widest transition-all flex items-center gap-1 disabled:opacity-50 border border-rose-100"
                                       >
                                          <X className="w-3.5 h-3.5" />
                                          {cancellingId === job.raw._id ? "..." : "Cancel"}
                                       </button>
                                    )}
                                 </div>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            </div>
         </motion.main>

         {/* ── BOOKING DETAIL MODAL ── */}
         <AnimatePresence>
            {selectedBooking && (
               <BookingDetailModal booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
            )}
         </AnimatePresence>
         <AnimatePresence>
            {podBooking && (
               <PodModal booking={podBooking} onClose={() => setPodBooking(null)} />
            )}
         </AnimatePresence>

         {/* Chat panel is rendered globally by ClientNotificationProvider */}

         {/* ── MOBILE NAV ── */}
         <ClientMobileNav />
      </div>
   );
}
