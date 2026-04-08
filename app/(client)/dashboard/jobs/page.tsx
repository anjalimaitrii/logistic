"use client";

import React, { useState } from "react";
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
   ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import ClientChatPanel from "@/components/client/ClientChatPanel";

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
   const isDesktop = useMediaQuery("(min-width: 768px)");

   const handleOpenChat = (jobId: string) => {
      setChatJobId(jobId);
   };

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
                  <div className="flex items-center gap-2 pl-2">
                     <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">S</div>
                  </div>
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
                     <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-widest">
                        <Filter className="w-3.5 h-3.5" />
                        Filter
                     </button>
                  </div>
               </div>

               {/* ── STATS GRID ── */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
                  {jobStats.map((stat, i) => (
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
                        Job History
                     </h3>
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {jobsList.length} items</span>
                  </div>

                  <div className="overflow-x-auto">
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
                           {jobsList.map((job) => (
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
                                    <span className="text-[12px] font-medium text-slate-600">{job.cargo}</span>
                                 </td>
                                 <td className="px-6 py-4">
                                    {(job.statusType === 'accepted' || job.statusType === 'transit' || job.statusType === 'delivered') ? (
                                        <span className="text-[12px] font-bold text-slate-900">{job.amount}</span>
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
                                       {(job.statusType === 'accepted' || job.statusType === 'transit' || job.statusType === 'delivered') ? (
                                          <button 
                                             onClick={() => handleOpenChat(job.id)}
                                             className="px-3 py-1.5 flex items-center gap-2 rounded-lg bg-primary text-white hover:scale-[1.02] active:scale-[0.98] transition-all shadow-md shadow-primary/20 text-[10px] font-bold uppercase tracking-widest"
                                             title="Chat with Support"
                                          >
                                             <MessageSquare className="w-3 h-3" strokeWidth={2.5} />
                                             Chat
                                          </button>
                                       ) : (
                                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest pr-4">Waiting...</span>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         </motion.main>

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
