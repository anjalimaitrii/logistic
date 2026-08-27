"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import { ClientMobileNav } from "@/components/client/ClientMobileNav";
import {
   TrendingUp,
   Package,
   DollarSign,
   ArrowUpRight,
   Plus,
   X,
   MapPin,
   Eye,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { bookingService } from "@/services/bookingService";
import ClientNotificationBell from "@/components/client/ClientNotificationBell";
import { formatDate, formatDateTime } from "@/lib/datetime";
import { clientNameOf } from "@/lib/bookingParty";

function getStatusStyle(status: string) {
   switch (status?.toLowerCase()) {
      case "transit": return "bg-indigo-50 text-indigo-600 border-indigo-100";
      case "delivered": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "pending": return "bg-amber-50 text-amber-600 border-amber-100";
      case "active": return "bg-blue-50 text-blue-600 border-blue-100";
      case "completed": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      default: return "bg-slate-50 text-slate-400 border-slate-100";
   }
}

const getLabel = (idx: number, offset = 0) => String.fromCharCode(65 + offset + idx);

function BookingDetailModal({ booking, onClose }: { booking: any; onClose: () => void }) {
   if (!booking) return null;

   const pickups: any[] = booking.pickupLocations || [];
   const dropoffs: any[] = booking.dropoffLocations || [];

   return (
      <div className="fixed inset-0 z-700 flex items-center justify-center p-4">
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
                  <h2 className="text-[14px] font-semibold text-slate-900 uppercase tracking-widest">Trip Details</h2>
               </div>
               <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all"
               >
                  <X className="w-4 h-4" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
               {/* Who is carrying it. Only appears once a fleet unit is on the
                   job — before that there is no truck or driver to name. */}
               {booking.fleet && (
                  <div className="bg-slate-900 rounded-2xl p-4 space-y-3 text-white">
                     <p className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Transporter</p>
                     <p className="text-[13px] font-bold -mt-1">{booking.fleet.transporter}</p>

                     <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/10">
                        <div className="space-y-0.5">
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
                                 <a href={`tel:${booking.fleet.driverPhone}`} className="text-[12px] font-semibold underline underline-offset-2">
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
                     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Status</p>
                     <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyle(booking.status)}`}>
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

export default function DashboardPage() {
   const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
   const [user, setUser] = useState<any>(null);
   const [bookings, setBookings] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [selectedBooking, setSelectedBooking] = useState<any>(null);
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
         console.error("Dashboard fetch error:", error);
      } finally {
         setIsLoading(false);
      }
   };

   const dynamicStats = [
      { label: "Active Jobs", value: bookings.filter(b => {
         const ts = (b.tripStatus || "").toLowerCase();
         const s = (b.status || "").toLowerCase();
         if (["completed", "delivered"].includes(ts) || ["paid", "cancelled", "rejected"].includes(s)) return false;
         return ["transit", "returning", "active", "started"].includes(ts) || ["active", "transit"].includes(s);
      }).length.toString(), sub: "Real-time", icon: Package, color: "text-primary" },
      { label: "Total Bookings", value: bookings.length.toString(), sub: "Lifetime", icon: DollarSign, color: "text-slate-900" },
      { label: "Completed", value: bookings.filter(b => { const ts = (b.tripStatus || b.status || "").toLowerCase(); return ts === "completed" || ts === "delivered"; }).length.toString(), sub: "Action required", icon: TrendingUp, color: "text-emerald-600" },
   ];

   const recentDisplayJobs = [...bookings]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(b => {
      const firstPickup = (b.pickupLocations || [])[0];
      const lastDropoff = (b.dropoffLocations || [])[(b.dropoffLocations?.length || 1) - 1];
      const bookedAt = b.createdAt
         ? formatDateTime(b.createdAt, { hour12: true })
         : "—";
      const allCities = [
         ...(b.pickupLocations || []).map((p: any) => p?.address?.city).filter(Boolean),
         ...(b.dropoffLocations || []).map((d: any) => d?.address?.city).filter(Boolean),
      ] as string[];
      return {
         raw: b,
         tripId: b.tripId || `#${b._id?.slice(-7).toUpperCase()}`,
         cities: allCities.length ? allCities : ["—"],
         cargo: b.cargoDetails?.goodsType || "Cargo",
         bookedBy: clientNameOf(b, "—"),
         status: b.status || "pending",
         bookedAt,
      };
   });

   return (
      <div className="flex bg-white min-h-screen relative overflow-x-hidden transition-colors duration-500">
         {/* ════ SIDEBAR ════ */}
         <div className="hidden md:block fixed top-0 left-0 h-screen z-50">
            <ClientSidebarNavigation
               isExpanded={isSidebarExpanded}
               onHover={setIsSidebarExpanded}
            />
         </div>

         {/* ════ MAIN CONTENT AREA ════ */}
         <motion.main
            initial={false}
            animate={{
               paddingLeft: isDesktop ? (isSidebarExpanded ? 240 + 24 : 68 + 24) : 16,
               paddingRight: isDesktop ? 24 : 16
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex-1 min-w-0 bg-neutral-50 pb-24 md:pb-12"
         >
            {/* ── TOP BAR ── */}
            <header className="h-14 bg-white/80 backdrop-blur-md border-b border-neutral-100 flex items-center justify-between sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 mb-6">
               {/* The bar keeps its space so the profile block stays right-aligned. */}
               <div className="flex-1" />
               <div className="flex items-center gap-2">
                  <ClientNotificationBell />
                  <div className="h-4 w-px bg-slate-200 mx-1" />
                  <Link href="/dashboard/profile" className="flex items-center gap-2 pl-2 hover:opacity-80 transition-opacity cursor-pointer">
                     <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-medium">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                     </div>
                     <div className="hidden lg:block leading-none">
                        <p className="text-[11px] font-semibold text-slate-900 capitalize">{user?.name || "User"}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 capitalize">{user?.designation || "Representative"}</p>
                     </div>
                  </Link>
               </div>
            </header>

            <div className="max-w-6xl mx-auto">
               {/* ── HEADER ── */}
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                     <h1 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">Overview</h1>
                     <p className="text-[11px] md:text-[12px] font-medium text-slate-400">Everything looks good today.</p>
                  </div>
                  <Link href="/bookings/new">
                     <button className="text-[12px] md:text-[14px] font-medium px-8 py-2 border border-slate-200 rounded-lg shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest w-full md:w-auto">
                        <Plus className="w-3 md:w-3.5 h-3 md:h-3.5" strokeWidth={2} />
                        <AnimatedGradientText>New Booking</AnimatedGradientText>
                     </button>
                  </Link>
               </div>

               {/* ── STATS GRID ── */}
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                  {dynamicStats.map((stat, i) => (
                     <div key={i} className="bg-white p-3 md:p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-default">
                        <div className="flex items-center justify-between mb-3">
                           <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg bg-slate-50 flex items-center justify-center ${stat.color}`}>
                              <stat.icon className="w-3.5 h-3.5 md:w-4 md:h-4" />
                           </div>
                           <ArrowUpRight className="w-3 md:w-3.5 h-3 md:h-3.5 text-slate-300 group-hover:text-primary transition-colors" />
                        </div>
                        <p className="text-[9px] md:text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
                        <div className="flex items-baseline gap-2 mt-1 md:mt-1.5">
                           <h3 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">{stat.value}</h3>
                           <span className="text-[8px] md:text-[9px] font-semibold text-emerald-500">{stat.sub}</span>
                        </div>
                     </div>
                  ))}
               </div>

               {/* ── RECENT BOOKINGS TABLE ── */}
               <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-50 flex items-center justify-between">
                     <h3 className="text-[10px] md:text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Recent Activity</h3>
                     <Link href="/dashboard/jobs" className="p-1 px-2 rounded-lg text-[9px] md:text-[10px] font-semibold text-primary hover:bg-primary/5 uppercase tracking-tighter transition-all">View All</Link>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                        <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-50">
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Sr. No.</th>
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Route</th>
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Booked By</th>
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Cargo</th>
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Booked At</th>
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {isLoading ? (
                              <tr>
                                 <td colSpan={7} className="px-4 py-8 text-center text-[10px] text-slate-400 italic">Syncing shipments...</td>
                              </tr>
                           ) : recentDisplayJobs.length === 0 ? (
                              <tr>
                                 <td colSpan={7} className="px-4 py-10 text-center">
                                    <p className="text-[11px] text-slate-400">No bookings yet.</p>
                                    <Link href="/bookings/new" className="text-[10px] text-primary font-semibold mt-1 inline-block hover:underline">
                                       Create your first booking →
                                    </Link>
                                 </td>
                              </tr>
                           ) : (
                              recentDisplayJobs.map((job, i) => (
                                 <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-4 md:px-5 py-3">
                                       <span className="text-[11px] md:text-[12px] font-semibold text-slate-500">{i + 1}</span>
                                    </td>
                                    <td className="px-4 md:px-5 py-3">
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
                                    <td className="px-4 md:px-5 py-3">
                                       <span className="text-[11px] font-semibold text-slate-700 capitalize">{job.bookedBy}</span>
                                    </td>
                                    <td className="px-4 md:px-5 py-3 text-[10px] md:text-[11px] font-medium text-slate-500">{job.cargo}</td>
                                    <td className="px-4 md:px-5 py-3">
                                       <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-semibold uppercase tracking-widest border ${getStatusStyle(job.status)}`}>
                                          {job.status}
                                       </span>
                                    </td>
                                    <td className="px-4 md:px-5 py-3">
                                       <span className="text-[10px] text-slate-400 whitespace-nowrap">{job.bookedAt}</span>
                                    </td>
                                    <td className="px-4 md:px-5 py-3 text-right">
                                       <button
                                          onClick={() => setSelectedBooking(job.raw)}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-primary hover:text-white text-slate-500 border border-slate-100 hover:border-primary rounded-lg text-[10px] font-semibold uppercase tracking-wide transition-all"
                                       >
                                          <Eye className="w-3 h-3" />
                                          View
                                       </button>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
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

         {/* ── MOBILE NAV ── */}
         <ClientMobileNav />
      </div>
   );
}
