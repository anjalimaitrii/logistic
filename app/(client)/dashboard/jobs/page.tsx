"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import {
   Search,
   Bell,
   Filter,
   MessageSquare,
   Eye,
   TrendingUp,
   Package,
   CheckCircle2,
   ChevronRight,
   X,
   MapPin,
   Plus,
   DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import ClientChatPanel from "@/components/client/ClientChatPanel";
import { bookingService } from "@/services/bookingService";

const getStatusStyles = (type: string) => {
   switch (type?.toLowerCase()) {
      case "transit": return "bg-blue-50 text-blue-600 border-blue-100";
      case "active": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "accepted": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "delivered": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
      case "rejected": return "bg-rose-50 text-rose-600 border-rose-100";
      default: return "bg-slate-50 text-slate-500 border-slate-100";
   }
};

const getDotColor = (type: string) => {
   switch (type?.toLowerCase()) {
      case "transit": return "bg-blue-500 animate-pulse";
      case "active":
      case "accepted": return "bg-indigo-500";
      case "delivered":
      case "completed": return "bg-emerald-500";
      case "pending": return "bg-amber-500";
      default: return "bg-rose-500";
   }
};

const getLabel = (idx: number, offset = 0) => String.fromCharCode(65 + offset + idx);

// ── Booking detail modal — defined outside to prevent focus loss ──
interface ModalProps { booking: any; onClose: () => void; }

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
            <div className="px-6 py-5 border-b border-slate-100 flex items-start justify-between">
               <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1">Trip Details</p>
                  <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight">
                     {booking.tripId || `#${booking._id?.slice(-7).toUpperCase()}`}
                  </h2>
               </div>
               <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
               >
                  <X className="w-4 h-4" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">

               {/* Status + Vehicle */}
               <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                     <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(booking.status)}`}>
                        {booking.status || "—"}
                     </span>
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
                           {booking.cargoDetails?.loadingDate ? new Date(booking.cargoDetails.loadingDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
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
                                    {[loc.address.plotNo, loc.address.street, loc.address.city, loc.address.pincode].filter(Boolean).join(", ")}
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
                                    {[loc.address.plotNo, loc.address.street, loc.address.city, loc.address.pincode].filter(Boolean).join(", ")}
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
   const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
   const [chatJobId, setChatJobId] = useState<string | null>(null);
   const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
   const [bookings, setBookings] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [viewMode, setViewMode] = useState<"personal" | "company">("personal");
   const [user, setUser] = useState<any>(null);
   const isDesktop = useMediaQuery("(min-width: 768px)");

   useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
         const parsedUser = JSON.parse(storedUser);
         setUser(parsedUser);
         loadBookings(parsedUser._id || parsedUser.id);
      } else {
         loadBookings();
      }
   }, []);

   const loadBookings = async (clientId?: string) => {
      try {
         setIsLoading(true);
         const data = await bookingService.getAll(clientId);
         setBookings(Array.isArray(data) ? data : (data?.bookings || []));
      } catch (error) {
         console.error("Failed to fetch bookings:", error);
      } finally {
         setIsLoading(false);
      }
   };

   // ── Filter by personal / company ──
   const currentViewBookings = bookings.filter(b => {
      const currentUserId = user?._id || user?.id;
      if (viewMode === "personal") {
         return String(b.clientId?._id || b.clientId) === String(currentUserId);
      }
      const userCompanyId = String(user?.company?._id || user?.company || user?.companyId || "");
      const bookingCompanyId = String(b.clientId?.company?._id || b.clientId?.company || "");
      if (userCompanyId && bookingCompanyId && userCompanyId !== "undefined") {
         return userCompanyId === bookingCompanyId;
      }
      return String(b.clientId?._id || b.clientId) === String(currentUserId);
   });

   const dynamicStats = [
      { label: "Total Jobs", value: currentViewBookings.filter(b => b.status !== "pending").length, icon: Package, color: "text-primary", bg: "bg-primary/10" },
      { label: "In Transit", value: currentViewBookings.filter(b => b.status === "transit").length, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Completed", value: currentViewBookings.filter(b => b.status === "completed" || b.status === "delivered").length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
   ];

   // ── Map bookings to display rows (new multi-location structure) ──
   const displayJobs = currentViewBookings.filter(b => b.status !== "pending").map(b => {
      const firstPickup = (b.pickupLocations || [])[0];
      const lastDropoff = (b.dropoffLocations || [])[(b.dropoffLocations?.length || 1) - 1];
      const pickupCount = b.pickupLocations?.length || 0;
      const dropoffCount = b.dropoffLocations?.length || 0;
      return {
         raw: b,
         tripId: b.tripId || `#${b._id?.slice(-7).toUpperCase()}`,
         origin: firstPickup?.address?.city || "—",
         destination: lastDropoff?.address?.city || "—",
         extraStops: pickupCount + dropoffCount - 2,
         cargo: b.cargoDetails?.goodsType || "Cargo",
         weight: b.cargoDetails?.weight || 0,
         status: b.status || "pending",
         date: b.cargoDetails?.loadingDate
            ? new Date(b.cargoDetails.loadingDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
            : "N/A",
         finalAmount: b.financials?.finalAmount || b.finalAmount,
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
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 relative">
                     <Bell className="w-4 h-4" />
                     <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-white" />
                  </button>
                  <div className="h-4 w-px bg-slate-200 mx-1" />
                  <Link href="/dashboard/profile" className="flex items-center gap-2 pl-2 hover:opacity-80 transition-opacity cursor-pointer">
                     <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">
                        {user?.name?.charAt(0) || "U"}
                     </div>
                  </Link>
               </div>
            </header>

            <div className="max-w-6xl mx-auto">
               {/* ── PAGE HEADER ── */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                     <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        <span>FleetLink</span>
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
                     <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest">
                        <Filter className="w-3.5 h-3.5" />
                        Filter
                     </button>
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
                  <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                     <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-primary rounded-full" />
                        {viewMode === "personal" ? "My Bookings" : `Company Bookings (${user?.company?.companyName || "All"})`}
                     </h3>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {isLoading ? "Fetching…" : `${displayJobs.length} items`}
                     </span>
                  </div>

                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-200">
                        <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-50">
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trip ID</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargo</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {isLoading ? (
                              <tr><td colSpan={6} className="px-6 py-12 text-center text-[12px] text-slate-400 italic">Loading your shipments...</td></tr>
                           ) : displayJobs.length === 0 ? (
                              <tr>
                                 <td colSpan={6} className="px-6 py-12 text-center">
                                    <Package className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                                    <p className="text-[12px] font-medium text-slate-400">No bookings found yet.</p>
                                 </td>
                              </tr>
                           ) : (
                              displayJobs.map((job, i) => (
                                 <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                       <span className="text-[13px] font-bold text-slate-900 font-mono">{job.tripId}</span>
                                       <p className="text-[10px] text-slate-400 mt-0.5">{job.date}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-2">
                                          <span className="text-[12px] font-bold text-emerald-700">{job.origin}</span>
                                          {job.extraStops > 0 && (
                                             <span className="text-[8px] text-slate-400 font-medium">+{job.extraStops} stops</span>
                                          )}
                                          <div className="flex items-center gap-0.5">
                                             <div className="w-1.5 h-1.5 rounded-full border-2 border-primary" />
                                             <div className="w-6 h-px bg-slate-200" />
                                             <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                          </div>
                                          <span className="text-[12px] font-bold text-rose-700">{job.destination}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className="text-[12px] font-bold text-slate-800">{job.cargo}</span>
                                       <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                                          {job.weight > 0 ? `${job.weight} KG` : "—"}
                                       </p>
                                    </td>
                                    <td className="px-6 py-4">
                                       {job.finalAmount ? (
                                          <span className="text-[12px] font-bold text-slate-900">₹{job.finalAmount}</span>
                                       ) : (
                                          <span className="text-[10px] font-bold text-slate-300 uppercase">---</span>
                                       )}
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(job.status)}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDotColor(job.status)}`} />
                                          {job.status}
                                       </span>
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
                                          {(job.status === "accepted" || job.status === "transit" || job.status === "active") && (
                                             <button
                                                onClick={() => setChatJobId(job.tripId)}
                                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all border border-transparent hover:border-slate-100"
                                                title="Chat with Support"
                                             >
                                                <MessageSquare className="w-4 h-4" />
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
                                    <span className="text-[12px] font-bold text-slate-900 font-mono">{job.tripId}</span>
                                    <p className="text-[10px] text-slate-400">{job.date}</p>
                                 </div>
                                 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(job.status)}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getDotColor(job.status)}`} />
                                    {job.status}
                                 </span>
                              </div>
                              <div className="flex items-center gap-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                 <div className="flex-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">From</p>
                                    <p className="text-[12px] font-bold text-emerald-700 truncate">{job.origin}</p>
                                 </div>
                                 <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                 <div className="flex-1 text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">To</p>
                                    <p className="text-[12px] font-bold text-rose-700 truncate">{job.destination}</p>
                                 </div>
                              </div>
                              <div className="flex items-center justify-between pt-1">
                                 <div>
                                    <span className="text-[11px] font-bold text-slate-800">{job.cargo}</span>
                                    <p className="text-[9px] font-bold text-primary uppercase tracking-tighter">
                                       {job.weight > 0 ? `${job.weight} KG` : "—"}
                                    </p>
                                 </div>
                                 <div className="flex gap-2">
                                    <button
                                       onClick={() => setSelectedBooking(job.raw)}
                                       className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-widest transition-all flex items-center gap-1.5"
                                    >
                                       <Eye className="w-3.5 h-3.5" /> View
                                    </button>
                                    {(job.status === "accepted" || job.status === "transit" || job.status === "active") && (
                                       <button
                                          onClick={() => setChatJobId(job.tripId)}
                                          className="p-2.5 bg-primary/10 hover:bg-primary/20 rounded-lg text-primary transition-all"
                                       >
                                          <MessageSquare className="w-4 h-4" />
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

         {/* ── CHAT PANEL ── */}
         <ClientChatPanel
            isOpen={!!chatJobId}
            onClose={() => setChatJobId(null)}
            jobId={chatJobId || ""}
         />

         {/* ── MOBILE NAV ── */}
         <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-neutral-100 flex justify-around py-3 rounded-2xl shadow-xl z-50">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 text-slate-300">
               <TrendingUp className="w-5 h-5" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Dash</span>
            </Link>
            <div className="flex flex-col items-center gap-1 text-primary">
               <Package className="w-5 h-5" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Jobs</span>
            </div>
            <Link href="/bookings/new" className="flex flex-col items-center gap-1 text-slate-300">
               <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white -mt-6">
                  <Plus className="w-6 h-6" />
               </div>
               <span className="text-[8px] font-semibold uppercase tracking-tighter">New</span>
            </Link>
            <div className="flex flex-col items-center gap-1 text-slate-300">
               <DollarSign className="w-5 h-5" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Ledger</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-300">
               <div className="w-5 h-5 rounded-md bg-slate-100" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Acc</span>
            </div>
         </nav>
      </div>
   );
}
