"use client";

import React, { useState, useEffect } from "react";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import {
   User,
   Mail,
   Phone,
   Building,
   ShieldCheck,
   ChevronRight,
   LogOut,
   Users,
   CheckCircle2,
   Mail as MailIcon,
   Phone as PhoneIcon,
   Briefcase,
   ArrowRight,
   Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { clientService } from "@/services/clientService";

export default function ClientProfilePage() {
   const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
   const [user, setUser] = useState<any>(null);
   const [team, setTeam] = useState<any[]>([]);
   const [isLoadingTeam, setIsLoadingTeam] = useState(true);
   const isDesktop = useMediaQuery("(min-width: 768px)");

   useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
         const parsedUser = JSON.parse(storedUser);
         setUser(parsedUser);
         // Handle both nested object or direct ID string
         const companyId = parsedUser.company?._id || parsedUser.companyId || parsedUser.company;
         if (companyId && typeof companyId === 'string') {
            loadTeam(companyId);
         } else if (companyId && typeof companyId === 'object') {
            loadTeam(companyId._id);
         } else {
            setIsLoadingTeam(false);
         }
      }
   }, []);

   const loadTeam = async (companyId: string) => {
      try {
         setIsLoadingTeam(true);
         const data = await clientService.getAll(companyId);
         setTeam(data || []);
      } catch (error) {
         console.error("Failed to fetch team:", error);
      } finally {
         setIsLoadingTeam(false);
      }
   };

   const handleLogout = () => {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/login";
   };

   return (
      <div className="flex bg-[#FBFBFE] min-h-screen relative overflow-x-hidden font-sans antialiased text-slate-900">
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
               paddingLeft: isDesktop ? (isSidebarExpanded ? 240 + 32 : 68 + 32) : 16,
               paddingRight: isDesktop ? 32 : 16
            }}
            className="flex-1 min-w-0 pb-12 pt-8 md:pt-10"
         >
            <div className="max-w-5xl mx-auto">

               {/* ── MINIMAL HEADER ── */}
               <div className="flex items-center justify-between mb-8">
                  <div>
                     <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        <span>Portal</span>
                        <ChevronRight className="w-2.5 h-2.5" />
                        <span className="text-primary font-black">My Profile</span>
                     </div>
                     <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account Settings</h1>
                  </div>
                  <button
                     onClick={handleLogout}
                     className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 transition-all shadow-sm"
                  >
                     <LogOut className="w-3.5 h-3.5" />
                     Log Out
                  </button>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* ── PERSONAL CARD (Compact) ── */}
                  <div className="lg:col-span-4 space-y-6">
                     <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 relative overflow-hidden">
                        <div className="flex flex-col items-center text-center">
                           <div className="relative mb-4">
                              <div className="w-20 h-20 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-2xl font-black">
                                 {user?.name?.charAt(0).toUpperCase()}
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-primary border-2 border-white flex items-center justify-center">
                                 <ShieldCheck className="w-3 h-3 text-white" />
                              </div>
                           </div>
                           <h2 className="text-[16px] font-bold text-slate-900 leading-tight">{user?.name}</h2>
                           <p className="text-[11px] font-medium text-slate-400 mt-0.5">{user?.designation || 'Client'}</p>

                           <div className="w-full mt-6 space-y-2 text-left">
                              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                                 <MailIcon className="w-3.5 h-3.5 text-slate-400" />
                                 <span className="text-[12px] font-medium text-slate-600 truncate">{user?.email}</span>
                              </div>
                              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                                 <PhoneIcon className="w-3.5 h-3.5 text-slate-400" />
                                 <span className="text-[12px] font-medium text-slate-600">{user?.contact}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Company Quick Summary */}
                     <div className="bg-primary/5 rounded-3xl p-6 border border-primary/10">
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-4">Primary Organization</p>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-primary/5 shadow-sm">
                              <Building className="w-5 h-5 text-primary" />
                           </div>
                           <div className="min-w-0">
                              <h4 className="text-[13px] font-bold text-slate-900 truncate">{user?.company?.companyName || user?.companyName}</h4>
                              <p className="text-[10px] font-medium text-slate-400">Tax ID: {user?.company?.cinNumber || 'Verified'}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* ── TEAM & ORGANIZATION DETAIL (Compact) ── */}
                  <div className="lg:col-span-8 space-y-6">

                     {/* Team Section */}
                     <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary" />
                              <h3 className="text-[13px] font-bold text-slate-900">Organization Team</h3>
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-400 text-[9px] font-black rounded-full">
                                 {team.length} Members
                              </span>
                           </div>

                        </div>

                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[320px] overflow-y-auto custom-scrollbar">
                           {isLoadingTeam ? (
                              <div className="col-span-2 py-10 flex flex-col items-center gap-3">
                                 <div className="w-5 h-5 border-2 border-slate-100 border-t-primary rounded-full animate-spin" />
                                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Team...</span>
                              </div>
                           ) : team.length <= 1 ? (
                              <div className="col-span-2 py-10 text-center">
                                 <p className="text-[12px] font-medium text-slate-400">Only your account was found in this organization.</p>
                              </div>
                           ) : (
                              team.map((member) => (
                                 <div
                                    key={member._id}
                                    className={`p-3 rounded-2xl border transition-all flex items-center gap-3
                                       ${member._id === (user?._id || user?.id) ? 'bg-primary/5 border-primary/20' : 'bg-white border-slate-50 hover:border-slate-200'}
                                    `}
                                 >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-black
                                       ${member._id === (user?._id || user?.id) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}
                                    `}>
                                       {member.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                       <p className="text-[12px] font-bold text-slate-900 truncate leading-none">
                                          {member.name}
                                          {member._id === (user?._id || user?.id) && <span className="ml-1 text-[8px] font-black text-primary uppercase">(You)</span>}
                                       </p>
                                       <p className="text-[9px] font-medium text-slate-400 mt-1 uppercase tracking-tighter truncate">{member.designation || 'Member'}</p>
                                    </div>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 opacity-40" />
                                 </div>
                              ))
                           )}
                        </div>
                     </div>

                     {/* Profile Stats Row (Compact) */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                           { label: "Account ID", value: user?._id?.substring(user._id.length - 8).toUpperCase() || 'N/A', icon: Briefcase },
                           { label: "Joined", value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) : 'Apr 2024', icon: Calendar },
                           { label: "Role Level", value: "Verified Client", icon: ShieldCheck },
                        ].map((stat, i) => (
                           <div key={i} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                 <stat.icon className="w-4 h-4" />
                              </div>
                              <div>
                                 <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                                 <p className="text-[12px] font-bold text-slate-900">{stat.value}</p>
                              </div>
                           </div>
                        ))}
                     </div>

                  </div>
               </div>
            </div>
         </motion.main>
      </div>
   );
}
