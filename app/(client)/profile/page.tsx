"use client";

import React, { useState, useEffect } from "react";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import { 
   User, 
   Mail, 
   Phone, 
   Building, 
   CreditCard, 
   MapPin, 
   ShieldCheck, 
   Calendar,
   Package,
   ChevronRight,
   LogOut,
   Camera,
   Edit3
} from "lucide-react";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { formatDate } from "@/lib/datetime";

export default function ClientProfilePage() {
   const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
   const [user, setUser] = useState<any>(null);
   const isDesktop = useMediaQuery("(min-width: 768px)");

   useEffect(() => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
         setUser(JSON.parse(storedUser));
      }
   }, []);

   const handleLogout = () => {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      window.location.href = "/login";
   };

   return (
      <div className="flex bg-[#F8FAFC] min-h-screen relative overflow-x-hidden">
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
            className="flex-1 min-w-0 pb-24 md:pb-12"
         >
            <div className="max-w-4xl mx-auto pt-8 md:pt-12">
               
               {/* ── HEADER ── */}
               <div className="mb-8">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                     <span>Client Portal</span>
                     <ChevronRight className="w-2.5 h-2.5" />
                     <span className="text-primary">Profile Settings</span>
                  </div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Account Profile</h1>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">Manage your personal and business identification details.</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* ── LEFT COLUMN: AVATAR & QUICK STATS ── */}
                  <div className="lg:col-span-1 space-y-6">
                     <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 text-center relative overflow-hidden">
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-primary/10 to-indigo-500/5 -z-0" />
                        
                        <div className="relative z-10 pt-4">
                           <div className="relative inline-block mb-4">
                              <div className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center text-primary border-4 border-white overflow-hidden">
                                 {user?.name ? (
                                    <span className="text-3xl font-black">{user.name.charAt(0)}</span>
                                 ) : (
                                    <User className="w-10 h-10" />
                                 )}
                              </div>
                              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center border-4 border-white hover:scale-110 transition-transform shadow-lg">
                                 <Camera className="w-3.5 h-3.5" />
                              </button>
                           </div>
                           
                           <h2 className="text-lg font-bold text-slate-900">{user?.name || "Client Name"}</h2>
                           <p className="text-[11px] font-bold text-primary uppercase tracking-widest mt-1">
                              {user?.company?.companyName || "Independent Client"}
                           </p>

                           <div className="grid grid-cols-2 gap-3 mt-8">
                              <div className="bg-slate-50 rounded-2xl p-3 text-left">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Status</p>
                                 <div className="flex items-center gap-1.5 mt-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <span className="text-[11px] font-bold text-slate-700">Verified</span>
                                 </div>
                              </div>
                              <div className="bg-slate-50 rounded-2xl p-3 text-left">
                                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Role</p>
                                 <p className="text-[11px] font-bold text-slate-700 mt-1 uppercase">Client</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <button 
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[12px] font-bold uppercase tracking-widest hover:bg-rose-100 transition-all group"
                     >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Log Out Account
                     </button>
                  </div>

                  {/* ── RIGHT COLUMN: DETAILED INFO ── */}
                  <div className="lg:col-span-2 space-y-6">
                     
                     {/* Personal Information */}
                     <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                           <h3 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                              <div className="w-1.5 h-4 bg-primary rounded-full" />
                              Personal Information
                           </h3>
                           <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-50 text-slate-400 hover:text-primary transition-all">
                              <Edit3 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold uppercase tracking-tighter">Edit</span>
                           </button>
                        </div>
                        
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-400 mb-1">
                                 <User className="w-3.5 h-3.5" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Full Name</span>
                              </div>
                              <p className="text-[14px] font-semibold text-slate-800 ml-5.5">{user?.name || "Not set"}</p>
                           </div>
                           
                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-400 mb-1">
                                 <Mail className="w-3.5 h-3.5" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Email Address</span>
                              </div>
                              <p className="text-[14px] font-semibold text-slate-800 ml-5.5">{user?.email || "Not set"}</p>
                           </div>

                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-400 mb-1">
                                 <Phone className="w-3.5 h-3.5" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Phone Number</span>
                              </div>
                              <p className="text-[14px] font-semibold text-slate-800 ml-5.5">{user?.contact || "Not set"}</p>
                           </div>

                           <div className="space-y-1">
                              <div className="flex items-center gap-2 text-slate-400 mb-1">
                                 <Calendar className="w-3.5 h-3.5" />
                                 <span className="text-[10px] font-bold uppercase tracking-widest">Member Since</span>
                              </div>
                              <p className="text-[14px] font-semibold text-slate-800 ml-5.5">
                                 {user?.createdAt ? formatDate(user.createdAt, { day: undefined, month: 'long' }) : "April 2024"}
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Company Details */}
                     <div className="bg-slate-900 rounded-[2rem] shadow-2xl shadow-slate-900/10 p-8 text-white relative overflow-hidden group">
                        {/* Abstract Background Shapes */}
                        <div className="absolute -top-12 -right-12 w-64 h-64 bg-primary/20 rounded-full blur-[80px] group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]" />
                        
                        <div className="relative z-10">
                           <div className="flex items-center justify-between mb-8">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10">
                                    <Building className="w-5 h-5 text-primary-light" />
                                 </div>
                                 <div>
                                    <h3 className="text-[14px] font-bold tracking-tight">Organization Profile</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Business Information</p>
                                 </div>
                              </div>
                              <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
                                 <ShieldCheck className="w-6 h-6 text-emerald-400" />
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                              <div className="space-y-1.5">
                                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Registered Name</p>
                                 <p className="text-[16px] font-bold tracking-wide">{user?.company?.companyName || "No Company Linked"}</p>
                              </div>
                              <div className="space-y-1.5">
                                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Corporate Identification (CIN)</p>
                                 <p className="text-[16px] font-bold tracking-wide">{user?.company?.cinNumber || "N/A"}</p>
                              </div>
                              <div className="space-y-1.5 md:col-span-2">
                                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em]">Business Type</p>
                                 <div className="flex flex-wrap gap-2 mt-2">
                                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">Enterprise Client</span>
                                    <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest">Verified Vendor</span>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>

                  </div>
               </div>
            </div>
         </motion.main>
      </div>
   );
}
