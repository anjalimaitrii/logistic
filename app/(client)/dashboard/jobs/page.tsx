"use client";

import React, { useState, useEffect } from "react";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import {
   Search,
   Bell,
   Filter,
   MoreHorizontal,
   MessageSquare,
   Eye,
   TrendingUp,
   Package,
   CheckCircle2,
   Clock,
   XCircle,
   ChevronRight,
   X,
   User,
   Phone,
   Building,
   MapPin,
   Hash,
   Calendar,
   Truck as TruckIcon,
   Link
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import ClientChatPanel from "@/components/client/ClientChatPanel";
import { bookingService } from "@/services/bookingService";


// ── MOCK DATA ──
const jobStats = [
   { label: "Total Jobs", value: "12", icon: Package, color: "text-primary", bg: "bg-primary/10" },
   { label: "In Transit", value: "3", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
   { label: "Pending", value: "2", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
   { label: "Completed", value: "7", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
];

const jobsList = [
   {
      id: "JOB-004",
      origin: "Lagos",
      destination: "Abuja",
      cargo: "5 Ton Tiles",
      status: "In Transit",
      statusType: "transit",
      date: "07 Apr",
      amount: "₹45,000"
   },
   {
      id: "JOB-005",
      origin: "Kano",
      destination: "Ibadan",
      cargo: "Textiles",
      status: "Accepted",
      statusType: "accepted",
      date: "08 Apr",
      amount: "₹38,000"
   },
   {
      id: "JOB-003",
      origin: "Nairobi",
      destination: "Mombasa",
      cargo: "Electronics",
      status: "Pending",
      statusType: "pending",
      date: "06 Apr",
      amount: "₹52,000"
   },
   {
      id: "JOB-002",
      origin: "Accra",
      destination: "Kumasi",
      cargo: "Furniture",
      status: "Delivered",
      statusType: "delivered",
      date: "05 Apr",
      amount: "₹29,500"
   },
   {
      id: "JOB-001",
      origin: "Cairo",
      destination: "Alexandria",
      cargo: "Cement",
      status: "Rejected",
      statusType: "rejected",
      date: "04 Apr",
      amount: "₹15,000"
   },
];

const getStatusStyles = (type: string) => {
   switch (type) {
      case 'transit':
         return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'accepted':
         return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'delivered':
         return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'pending':
         return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'rejected':
         return 'bg-rose-50 text-rose-600 border-rose-100';
      default:
         return 'bg-slate-50 text-slate-500 border-slate-100';
   }
};

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
         const data = await bookingService.getAll();
         setBookings(data || []);
      } catch (error) {
         console.error("Failed to fetch bookings:", error);
      } finally {
         setIsLoading(false);
      }
   };

   const handleOpenChat = (jobId: string) => {
      setChatJobId(jobId);
   };

   // ── DYNAMIC STATS ──
   const currentViewBookings = bookings.filter(b => {
      const currentUserId = user?._id || user?.id;
      if (viewMode === "personal") {
         return String(b.clientId?._id || b.clientId) === String(currentUserId);
      } else {
         // Company view: Match by company ID
         const userCompanyId = String(user?.company?._id || user?.company || user?.companyId || "");
         const bookingCompanyId = String(b.clientId?.company?._id || b.clientId?.company || "");

         // If we have both IDs, compare them
         if (userCompanyId && bookingCompanyId && userCompanyId !== "undefined") {
            return userCompanyId === bookingCompanyId;
         }

         // Fallback: If it's the user's own booking, always show it in company view too
         return String(b.clientId?._id || b.clientId) === String(currentUserId);
      }
   });

   const dynamicStats = [
      { label: "Total Jobs", value: currentViewBookings.length.toString(), icon: Package, color: "text-primary", bg: "bg-primary/10" },
      { label: "In Transit", value: currentViewBookings.filter(b => b.status === "transit").length.toString(), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
      { label: "Pending", value: currentViewBookings.filter(b => b.status === "pending").length.toString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
      { label: "Completed", value: currentViewBookings.filter(b => b.status === "completed" || b.status === "delivered").length.toString(), icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
   ];

   // ── MAP BOOKINGS TO TABLE ──
   const displayJobs = currentViewBookings.map(b => ({
      _id: b._id,
      id: b.jobId || b._id?.substring(b._id.length - 7).toUpperCase() || "NEW",
      origin: b.pickup?.address?.city || "Unknown",
      destination: b.dropoff?.address?.city || "Unknown",
      cargo: b.cargoDetails?.goodsType || "Cargo",
      weight: b.cargoDetails?.weight || 0,
      status: b.status.charAt(0).toUpperCase() + b.status.slice(1),
      statusType: b.status, // transit, accepted, delivered, pending, rejected
      date: b.cargoDetails?.loadingDate ? new Date(b.cargoDetails.loadingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "N/A",
      finalAmount: b.finalAmount ? `₹${b.finalAmount}` : "---",
      raw: b
   }));

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
                        placeholder="Search jobs, IDs, destinations..."
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
               {/* ── HEADER ── */}
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

               {/* ── STATS GRID ── */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                  {dynamicStats.map((stat, i) => (
                     <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center justify-between mb-3">
                           <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                              <stat.icon className="w-4.5 h-4.5" />
                           </div>
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
                        {viewMode === "personal" ? "My Bookings" : `Company Bookings (${user?.company?.companyName || 'All'})`}
                     </h3>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {isLoading ? "Fetching data..." : `Showing ${displayJobs.length} items`}
                     </span>
                  </div>

                  {/* Desktop Table (Visible on MD+) */}
                  <div className="hidden md:block overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                           <tr className="bg-slate-50/50 border-b border-slate-50">
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Job Details</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Route</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cargo</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Amount</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                           {isLoading ? (
                              <tr>
                                 <td colSpan={6} className="px-6 py-12 text-center text-[12px] font-medium text-slate-400 italic">
                                    Loading your shipments...
                                 </td>
                              </tr>
                           ) : displayJobs.length === 0 ? (
                              <tr>
                                 <td colSpan={6} className="px-6 py-12 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                       <Package className="w-8 h-8 text-slate-100" />
                                       <p className="text-[12px] font-medium text-slate-400">No bookings found yet.</p>
                                    </div>
                                 </td>
                              </tr>
                           ) : (
                              displayJobs.map((job) => (
                                 <tr key={job.id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col">
                                          <span className="text-[13px] font-bold text-slate-900">{job.id}</span>
                                          <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{job.date}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex items-center gap-3">
                                          <div className="flex flex-col">
                                             <span className="text-[12px] font-bold text-slate-700">{job.origin}</span>
                                          </div>
                                          <div className="flex items-center">
                                             <div className="w-2 h-2 rounded-full border-2 border-primary" />
                                             <div className="w-8 h-px bg-slate-200" />
                                             <div className="w-2 h-2 rounded-full bg-slate-300" />
                                          </div>
                                          <div className="flex flex-col">
                                             <span className="text-[12px] font-bold text-slate-700">{job.destination}</span>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       <div className="flex flex-col">
                                          <span className="text-[12px] font-bold text-slate-800">{job.cargo}</span>
                                          <span className="text-[10px] font-bold text-primary tracking-tighter uppercase">{job.weight > 0 ? `${job.weight} KG` : "Weight (N/A)"}</span>
                                       </div>
                                    </td>
                                    <td className="px-6 py-4">
                                       {(job.statusType === 'accepted' || job.statusType === 'finalized' || job.statusType === 'delivered') ? (
                                          <span className="text-[12px] font-bold text-slate-900">{job.finalAmount}</span>
                                       ) : (
                                          <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">---</span>
                                       )}
                                    </td>
                                    <td className="px-6 py-4">
                                       <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(job.statusType)}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${job.statusType === 'transit' ? 'bg-blue-500 animate-pulse' :
                                             job.statusType === 'delivered' ? 'bg-emerald-500' :
                                                job.statusType === 'accepted' ? 'bg-indigo-500' :
                                                   job.statusType === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                          {job.status}
                                       </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                       <div className="flex justify-end gap-2">
                                          <button
                                             onClick={() => setSelectedBooking(job.raw)}
                                             className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all border border-transparent hover:border-slate-100"
                                             title="View Full Details"
                                          >
                                             <Eye className="w-4 h-4" />
                                          </button>
                                          {(job.statusType === 'accepted' || job.statusType === 'transit' || job.statusType === 'delivered') && (
                                             <button
                                                onClick={() => handleOpenChat(job.id)}
                                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all border border-transparent hover:border-slate-100"
                                                title="Chat with Support"
                                             >
                                                <MessageSquare className="w-4 h-4" />
                                             </button>
                                          )}
                                       </div>
                                    </td>
                                 </tr>
                              )))}
                        </tbody>
                     </table>
                  </div>

                  {/* Mobile Card List (Visible on Mobile only) */}
                  <div className="md:hidden divide-y divide-slate-50">
                     {isLoading ? (
                        <div className="px-5 py-12 text-center text-[12px] font-medium text-slate-400 italic">
                           Syncing shipments...
                        </div>
                     ) : displayJobs.length === 0 ? (
                        <div className="px-5 py-12 text-center flex flex-col items-center gap-2">
                           <Package className="w-8 h-8 text-slate-100" />
                           <p className="text-[12px] font-medium text-slate-400">No bookings found yet.</p>
                        </div>
                     ) : (
                        displayJobs.map((job) => (
                           <div key={job.id} className="p-5 space-y-4 hover:bg-slate-50/50 transition-colors">
                              <div className="flex items-center justify-between">
                                 <div className="flex flex-col">
                                    <span className="text-[12px] font-bold text-slate-900">{job.id}</span>
                                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{job.date}</span>
                                 </div>
                                 <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border ${getStatusStyles(job.statusType)}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${job.statusType === 'transit' ? 'bg-blue-500 animate-pulse' :
                                       job.statusType === 'delivered' ? 'bg-emerald-500' :
                                          job.statusType === 'accepted' ? 'bg-indigo-500' :
                                             job.statusType === 'pending' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                    {job.status}
                                 </span>
                              </div>

                              <div className="flex items-center gap-4 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                                 <div className="flex-1">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Origin</p>
                                    <p className="text-[12px] font-bold text-slate-700 truncate">{job.origin}</p>
                                 </div>
                                 <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                                 <div className="flex-1 text-right">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Destination</p>
                                    <p className="text-[12px] font-bold text-slate-700 truncate">{job.destination}</p>
                                 </div>
                              </div>

                              <div className="flex items-center justify-between pt-1">
                                 <div className="flex flex-col">
                                    <span className="text-[11px] font-bold text-slate-800">{job.cargo}</span>
                                    <div className="flex items-center gap-2">
                                       <span className="text-[9px] font-bold text-primary uppercase tracking-tighter">{job.weight > 0 ? `${job.weight} KG` : "Weight (N/A)"}</span>
                                       <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">•</span>
                                       <span className="text-[10px] font-bold text-slate-900">{job.statusType !== 'pending' ? `₹---` : 'Pricing Pending'}</span>
                                    </div>
                                 </div>
                                 <div className="flex gap-2">
                                    <button
                                       onClick={() => setSelectedBooking(job.raw)}
                                       className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-widest transition-all"
                                    >
                                       View
                                    </button>
                                    {(job.statusType === 'accepted' || job.statusType === 'transit' || job.statusType === 'delivered') && (
                                       <button
                                          onClick={() => handleOpenChat(job.id)}
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

         {/* ── BOOKING DETAILS MODAL ── */}
         <AnimatePresence>
            {selectedBooking && (
               <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
                  <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     onClick={() => setSelectedBooking(null)}
                     className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                  />
                  <motion.div
                     initial={{ opacity: 0, scale: 0.95, y: 20 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0, scale: 0.95, y: 20 }}
                     className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                  >
                     {/* Modal Header */}
                     <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                        <div>
                           <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Job Details</span>
                              <span className="w-1 h-1 bg-slate-300 rounded-full" />
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">#{selectedBooking.jobId || selectedBooking._id.substring(selectedBooking._id.length - 7).toUpperCase()}</span>
                           </div>
                           <h2 className="text-lg font-bold text-slate-900">Shipment Specification</h2>
                        </div>
                        <button
                           onClick={() => setSelectedBooking(null)}
                           className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors"
                        >
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     {/* Modal Content */}
                     <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {/* Status Strip */}
                        <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getStatusStyles(selectedBooking.status)}`}>
                                 {selectedBooking.status === 'pending' ? <Clock className="w-5 h-5" /> :
                                    selectedBooking.status === 'transit' ? <TruckIcon className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                              </div>
                              <div>
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Current Status</p>
                                 <p className="text-[13px] font-bold text-slate-900 uppercase tracking-wide">{selectedBooking.status}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Created On</p>
                              <p className="text-[13px] font-bold text-slate-900">{new Date(selectedBooking.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                           </div>
                        </div>

                        {/* Nodes Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                           {/* Connecting Line (Desktop) */}
                           <div className="hidden md:block absolute top-[100px] left-1/2 -translate-x-1/2 w-px h-[calc(100%-120px)] bg-slate-100 dashed-border" />

                           {/* Pickup Section */}
                           <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-2">
                                 <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                                    <MapPin className="w-4 h-4" />
                                 </div>
                                 <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Pickup Information</h3>
                              </div>
                              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                                 <div className="flex items-start gap-3">
                                    <User className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                    <div>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Contact Person</p>
                                       <p className="text-[12px] font-bold text-slate-800">{selectedBooking.pickup.contactPerson || "N/A"}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-start gap-3">
                                    <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                    <div>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Phone</p>
                                       <p className="text-[12px] font-bold text-slate-800">{selectedBooking.pickup.contactNumber}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-start gap-3 border-t border-slate-200/50 pt-2">
                                    <Building className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                    <div>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Address</p>
                                       <p className="text-[12px] font-bold text-slate-800 leading-snug">
                                          {selectedBooking.pickup.address.plotNo && `Plot ${selectedBooking.pickup.address.plotNo}, `}
                                          {selectedBooking.pickup.address.street}, {selectedBooking.pickup.address.city}, {selectedBooking.pickup.address.pincode}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           </div>

                           {/* Dropoff Section */}
                           <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-2">
                                 <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <MapPin className="w-4 h-4" />
                                 </div>
                                 <h3 className="text-[11px] font-bold text-slate-900 uppercase tracking-widest">Drop-off Information</h3>
                              </div>
                              <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                                 <div className="flex items-start gap-3">
                                    <User className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                    <div>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Contact Person</p>
                                       <p className="text-[12px] font-bold text-slate-800">{selectedBooking.dropoff.contactPerson || "N/A"}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-start gap-3">
                                    <Phone className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                    <div>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Phone</p>
                                       <p className="text-[12px] font-bold text-slate-800">{selectedBooking.dropoff.contactNumber}</p>
                                    </div>
                                 </div>
                                 <div className="flex items-start gap-3 border-t border-slate-200/50 pt-2">
                                    <Building className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                                    <div>
                                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Address</p>
                                       <p className="text-[12px] font-bold text-slate-800 leading-snug">
                                          {selectedBooking.dropoff.address.plotNo && `Plot ${selectedBooking.dropoff.address.plotNo}, `}
                                          {selectedBooking.dropoff.address.street}, {selectedBooking.dropoff.address.city}, {selectedBooking.dropoff.address.pincode}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* Cargo Particulars */}
                        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl shadow-slate-900/10">
                           <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Cargo Particulars</h3>
                           <div className="grid grid-cols-2 gap-8">
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Package className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Type of Goods</span>
                                 </div>
                                 <p className="text-[15px] font-bold tracking-wide">{selectedBooking.cargoDetails.goodsType}</p>
                              </div>
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <TruckIcon className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Requirement</span>
                                 </div>
                                 <p className="text-[15px] font-bold tracking-wide">{selectedBooking.requirement.bodyType}</p>
                              </div>
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Hash className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Approx Weight</span>
                                 </div>
                                 <p className="text-[15px] font-bold tracking-wide uppercase">{selectedBooking.cargoDetails.weight} KG</p>
                              </div>
                              <div className="space-y-1">
                                 <div className="flex items-center gap-2 text-slate-400 mb-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">Loading Date</span>
                                 </div>
                                 <p className="text-[15px] font-bold tracking-wide">{new Date(selectedBooking.cargoDetails.loadingDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Footer Actions */}
                     <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Trackable with FleetLink</span>
                        </div>
                        <button
                           onClick={() => setSelectedBooking(null)}
                           className="px-6 py-2.5 bg-slate-200/50 hover:bg-slate-200 rounded-xl text-[11px] font-bold text-slate-600 uppercase tracking-widest transition-all"
                        >
                           Close Window
                        </button>
                     </div>
                  </motion.div>
               </div>
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
            {/* Same as dashboard mobile nav */}
         </nav>
      </div>
   );
}
