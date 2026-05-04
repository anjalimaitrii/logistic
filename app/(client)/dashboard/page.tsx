"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import {
   Bell,
   Search,
   TrendingUp,
   Package,
   DollarSign,
   ArrowUpRight,
   MoreHorizontal,
   Plus
} from "lucide-react";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { bookingService } from "@/services/bookingService";
import { useEffect } from "react";


export default function DashboardPage() {
   const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
   const [user, setUser] = useState<any>(null);
   const [bookings, setBookings] = useState<any[]>([]);
   const [isLoading, setIsLoading] = useState(true);
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
         const data = await bookingService.getAll();

         const filtered = clientId
            ? data.filter((b: any) => b.clientId?._id === clientId)
            : data;

         setBookings(filtered || []);
      } catch (error) {
         console.error("Dashboard fetch error:", error);
      } finally {
         setIsLoading(false);
      }
   };
   // ── DYNAMIC STATS ──
   const dynamicStats = [
      { label: "Active Jobs", value: bookings.filter(b => b.status === "transit" || b.status === "confirmed").length.toString(), sub: "Real-time", icon: Package, color: "text-primary" },
      { label: "Total Bookings", value: bookings.length.toString(), sub: "Lifetime", icon: DollarSign, color: "text-slate-900" },
      { label: "Pending", value: bookings.filter(b => b.status === "pending").length.toString(), sub: "Action required", icon: TrendingUp, color: "text-emerald-600" },
   ];

   // ── MAP RECENT 3 BOOKINGS ──
   const recentDisplayJobs = bookings.slice(-3).reverse().map(b => ({
      id: b._id?.substring(b._id.length - 7).toUpperCase() || "NEW",
      origin: b.pickup?.address?.city || "Unknown",
      destination: b.dropoff?.address?.city || "Unknown",
      cargo: b.cargoDetails?.goodsType || "Cargo",
      status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
      type: b.status // transit, delivered, confirmed, etc.
   }));

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

            {/* ── CLEAN TOP BAR ── */}
            <header className="h-14 bg-white/80 backdrop-blur-md border-b border-neutral-100 flex items-center justify-between sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 mb-6">
               <div className="flex items-center gap-4 flex-1">
                  <div className="relative max-w-sm w-full group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
                     <input
                        type="text"
                        placeholder="Search..."
                        className="w-full bg-slate-50 border border-transparent rounded-lg py-1.5 pl-9 pr-4 text-[11px] md:text-[12px] font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-200 outline-none transition-all"
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
                     <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-medium">
                        {user?.name?.charAt(0) || "U"}
                     </div>
                     <div className="hidden lg:block leading-none">
                        <p className="text-[11px] font-semibold text-slate-900">{user?.name || "User"}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{user?.designation || "Representative"}</p>
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

                     <button className="  text-[12px] md:text-[14px] font-medium px-8 py-2 border border-slate-200 rounded-lg shadow-xl  flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest w-full md:w-auto">

                        <Plus className="w-3 md:w-3.5 h-3 md:h-3.5" strokeWidth={2} />
                        <AnimatedGradientText>
                           New Booking
                        </AnimatedGradientText>
                     </button>

                  </Link>
               </div>

               {/* ── STATS GRID (API READY) ── */}
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

               {/* ── RECENT JOBS TABLE-LIKE LIST ── */}
               <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-4 md:px-5 py-3 md:py-4 border-b border-slate-50 flex items-center justify-between">
                     <h3 className="text-[10px] md:text-[11px] font-semibold text-slate-900 uppercase tracking-widest">Recent Activity</h3>
                     <button className="p-1 px-2 rounded-lg text-[9px] md:text-[10px] font-semibold text-primary hover:bg-primary-light uppercase tracking-tighter transition-all">View All</button>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
                        <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-50">
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Job ID</th>
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Route</th>
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Cargo</th>
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                              <th className="px-4 md:px-5 py-3 text-[9px] md:text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {isLoading ? (
                              <tr>
                                 <td colSpan={5} className="px-4 py-8 text-center text-[10px] text-slate-400 italic">Syncing shipments...</td>
                              </tr>
                           ) : recentDisplayJobs.length === 0 ? (
                              <tr>
                                 <td colSpan={5} className="px-4 py-8 text-center text-[10px] text-slate-400">No recent activity.</td>
                              </tr>
                           ) : (
                              recentDisplayJobs.map((job) => (
                                 <tr key={job.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-4 md:px-5 py-3 text-[11px] md:text-[12px] font-medium text-slate-900">{job.id}</td>
                                    <td className="px-4 md:px-5 py-3">
                                       <div className="flex items-center gap-2">
                                          <span className="text-[10px] md:text-[11px] font-medium text-slate-700">{job.origin}</span>
                                          <div className="w-3 h-px bg-slate-200" />
                                          <span className="text-[10px] md:text-[11px] font-medium text-slate-700">{job.destination}</span>
                                       </div>
                                    </td>
                                    <td className="px-4 md:px-5 py-3 text-[10px] md:text-[11px] font-medium text-slate-500">{job.cargo}</td>
                                    <td className="px-4 md:px-5 py-3">
                                       <span className={`px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-semibold uppercase tracking-widest border shrink-0
                                       ${job.type === 'transit' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                             job.type === 'delivered' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                job.type === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                   'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                          {job.status}
                                       </span>
                                    </td>
                                    <td className="px-4 md:px-5 py-3 text-right">
                                       <div className="flex justify-end gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                          <Link href="/dashboard/jobs" className="p-1.5 hover:bg-slate-100 rounded-md text-primary border border-transparent hover:border-slate-200 transition-all">
                                             <TrendingUp className="w-3 md:w-3.5 h-3 md:h-3.5" />
                                          </Link>
                                       </div>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         </motion.main >

         {/* ── MOBILE NAV (Fallback for small screens) ── */}
         < nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-neutral-100 flex justify-around py-3 rounded-2xl shadow-xl z-50" >
            <Link href="/dashboard" className="flex flex-col items-center gap-1 text-primary">
               <TrendingUp className="w-5 h-5" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Dash</span>
            </Link>
            <div className="flex flex-col items-center gap-1 text-slate-300">
               <Package className="w-5 h-5" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Jobs</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-300">
               <div className="relative">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white -mt-6">
                     <Plus className="w-6 h-6" />
                  </div>
               </div>
               <span className="text-[8px] font-semibold uppercase tracking-tighter">New</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-300">
               <DollarSign className="w-5 h-5" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Ledger</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-slate-300">
               <div className="w-5 h-5 rounded-md bg-slate-100" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Acc</span>
            </div>
         </nav >
      </div >
   );
}