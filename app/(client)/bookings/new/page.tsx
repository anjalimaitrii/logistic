"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import {
   ArrowLeft,
   Phone,
   Package,
   Calendar,
   Clock,
   ChevronRight,
   TrendingUp,
   DollarSign,
   Plus,
   Navigation,
   X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useRouter } from "next/navigation";

const TRUCK_TYPES = [
   { name: "Small Bakkie", icon: "🛻", desc: "1T", cap: "1,000kg" },
   { name: "Mini Truck", icon: "🚚", desc: "2T", cap: "2,000kg" },
   { name: "Small Truck", icon: "🚛", desc: "5T", cap: "5,000kg" },
   { name: "Medium Truck", icon: "📦", desc: "12T", cap: "12,000kg" },
];

export default function NewBookingPage() {
   const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
   const isDesktop = useMediaQuery("(min-width: 768px)");
   const router = useRouter();

   // ── FORM STATE ──
   const [formData, setFormData] = useState({
      goodsType: "",
      weight: "",
      scheduleDate: new Date().toISOString().split('T')[0],
      scheduleTime: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      pickup: {
         contact: "",
         street: "",
         city: "",
         pincode: "",
         gps: false
      },
      dropoff: {
         contact: "",
         street: "",
         city: "",
         pincode: "",
         gps: false
      },
      truckType: "Mini Truck"
   });

   const handleInputChange = (section: string, field: string, value: string | boolean) => {
      if (section === "root") {
         setFormData(prev => ({ ...prev, [field]: value }));
      } else {
         setFormData(prev => ({
            ...prev,
            [section]: { ...prev[section as keyof typeof prev] as any, [field]: value }
         }));
      }
   };

   const FormContent = (
      <div className="max-w-3xl mx-auto space-y-6">
         {/* ── 1. CARGO DETAILS ── */}
         <section className="bg-white space-y-5 p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2  mb-2">
               <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Cargo & Schedule</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 px-2 gap-4">
               <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Type of Goods</label>
                  <div className="relative group">
                     <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-primary transition-colors" />
                     <input
                        type="text"
                        placeholder="e.g. Electronics"
                        value={formData.goodsType}
                        onChange={(e) => handleInputChange("root", "goodsType", e.target.value)}
                        className="w-full  bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-primary/20 outline-none transition-all"
                     />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest ml-1">Approx Weight (kg)</label>
                  <input
                     type="number"
                     placeholder="0"
                     value={formData.weight}
                     onChange={(e) => handleInputChange("root", "weight", e.target.value)}
                     className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 px-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-primary/20 outline-none transition-all"
                  />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 px-2 pb-2 border-t border-slate-50">
               <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Loading Date</label>
                  <div className="relative">
                     <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                     <input
                        type="date"
                        value={formData.scheduleDate}
                        onChange={(e) => handleInputChange("root", "scheduleDate", e.target.value)}
                        className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-primary/20 outline-none transition-all"
                     />
                  </div>
               </div>
               <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Loading Time</label>
                  <div className="relative">
                     <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                     <input
                        type="time"
                        value={formData.scheduleTime}
                        onChange={(e) => handleInputChange("root", "scheduleTime", e.target.value)}
                        className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-primary/20 outline-none transition-all"
                     />
                  </div>
               </div>
            </div>
         </section>

         {/* ── 2. PICKUP NODE ── */}
         <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-900">Pickup Address</h2>
               </div>
               <button
                  onClick={() => handleInputChange("pickup", "gps", !formData.pickup.gps)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-semibold uppercase tracking-tighter shadow-sm
                     ${formData.pickup.gps ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-emerald-500 hover:border-emerald-100 group'}`}
               >
                  <Navigation className={`w-3 h-3 ${formData.pickup.gps ? '' : 'opacity-40 group-hover:opacity-100'}`} />
                  {formData.pickup.gps ? "GPS Tracked" : "Add GPS"}
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
                  <div className="relative">
                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                     <input
                        type="tel"
                        placeholder="+91 00000 00000"
                        value={formData.pickup.contact}
                        onChange={(e) => handleInputChange("pickup", "contact", e.target.value)}
                        className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-emerald-100 outline-none transition-all"
                     />
                  </div>
               </div>
               <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Street / Building Name</label>
                  <input
                     type="text"
                     placeholder="House no, Street name..."
                     value={formData.pickup.street}
                     onChange={(e) => handleInputChange("pickup", "street", e.target.value)}
                     className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 px-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-emerald-100 outline-none transition-all"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Area / City</label>
                  <input
                     type="text"
                     placeholder="City name"
                     value={formData.pickup.city}
                     onChange={(e) => handleInputChange("pickup", "city", e.target.value)}
                     className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 px-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-emerald-100 outline-none transition-all"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Pincode</label>
                  <input
                     type="text"
                     placeholder="123456"
                     value={formData.pickup.pincode}
                     onChange={(e) => handleInputChange("pickup", "pincode", e.target.value)}
                     className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 px-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-emerald-100 outline-none transition-all"
                  />
               </div>
            </div>
         </section>

         {/* ── 3. DROPOFF NODE ── */}
         <section className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-rose-500 rounded-full" />
                  <h2 className="text-[11px] font-semibold uppercase tracking-widest text-slate-900">Dropoff Address</h2>
               </div>
               <button
                  onClick={() => handleInputChange("dropoff", "gps", !formData.dropoff.gps)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-semibold uppercase tracking-tighter shadow-sm
                     ${formData.dropoff.gps ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 group'}`}
               >
                  <Navigation className={`w-3 h-3 ${formData.dropoff.gps ? '' : 'opacity-40 group-hover:opacity-100'}`} />
                  {formData.dropoff.gps ? "GPS Tracked" : "Add GPS"}
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Contact Number</label>
                  <div className="relative">
                     <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                     <input
                        type="tel"
                        placeholder="+91 00000 00000"
                        value={formData.dropoff.contact}
                        onChange={(e) => handleInputChange("dropoff", "contact", e.target.value)}
                        className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 pl-10 pr-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-rose-100 outline-none transition-all"
                     />
                  </div>
               </div>
               <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Street / Building Name</label>
                  <input
                     type="text"
                     placeholder="Dest. Street, building..."
                     value={formData.dropoff.street}
                     onChange={(e) => handleInputChange("dropoff", "street", e.target.value)}
                     className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 px-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-rose-100 outline-none transition-all"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Area / City</label>
                  <input
                     type="text"
                     placeholder="City name"
                     value={formData.dropoff.city}
                     onChange={(e) => handleInputChange("dropoff", "city", e.target.value)}
                     className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 px-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-rose-100 outline-none transition-all"
                  />
               </div>
               <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Pincode</label>
                  <input
                     type="text"
                     placeholder="123456"
                     value={formData.dropoff.pincode}
                     onChange={(e) => handleInputChange("dropoff", "pincode", e.target.value)}
                     className="w-full bg-slate-50 border border-transparent rounded-lg py-2.5 px-4 text-[12px] font-medium text-slate-900 focus:bg-white focus:border-rose-100 outline-none transition-all"
                  />
               </div>
            </div>
         </section>

         {/* ── 4. VEHICLE CATEGORY ── */}
         <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
               <h2 className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Select Vehicle Type</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
               {TRUCK_TYPES.map((truck) => (
                  <button
                     key={truck.name}
                     onClick={() => handleInputChange("root", "truckType", truck.name)}
                     className={`p-3 rounded-xl border flex flex-col items-center transition-all group ${formData.truckType === truck.name ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white' : 'bg-white border-slate-100 hover:border-primary/20 text-slate-900'}`}
                  >
                     <span className={`text-xl mb-2 transition-transform group-hover:scale-110 ${formData.truckType === truck.name ? '' : 'filter grayscale opacity-50'}`}>{truck.icon}</span>
                     <span className="text-[11px] font-semibold truncate overflow-hidden w-full text-center">{truck.name}</span>
                     <span className={`text-[8px] font-medium uppercase tracking-widest ${formData.truckType === truck.name ? 'text-white/60' : 'text-slate-300'}`}>{truck.cap}</span>
                  </button>
               ))}
            </div>
         </section>

         {/* ── 5. SUBMIT ── */}
         <div className="pt-4 pb-8 md:pb-0">
            <button className="w-full bg-primary py-4 rounded-2xl text-white text-[12px] font-semibold uppercase tracking-[0.2em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform hover:brightness-110">
               Post Booking Request
               <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </button>
            <p className="text-center text-[10px] text-slate-400 mt-4 font-medium tracking-tight">By posting, you agree to our Fleet Link Terms & Conditions</p>
         </div>
      </div>
   );

   return (
      <div className="flex bg-neutral-50 min-h-screen relative overflow-x-hidden">
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
            className="flex-1 min-w-0 pb-24 md:pb-12"
         >
            {/* ── MOBILE HEADER (Full screen) ── */}
            <AnimatePresence>
               {!isDesktop && (
                  <header className="h-14 flex items-center justify-between px-4 bg-white border-b border-neutral-100 -mx-4 mb-6 sticky top-0 z-40">
                     <Link href="/dashboard" className="p-2 border border-neutral-100 rounded-lg">
                        <ArrowLeft className="w-4 h-4 text-slate-600" />
                     </Link>
                     <h1 className="text-[12px] font-semibold uppercase tracking-widest text-slate-950">New Booking</h1>
                     <div className="w-8" />
                  </header>
               )}
            </AnimatePresence>

            {/* ── DESKTOP SIDE DRAWER OVERLAY ── */}
            {isDesktop ? (
               <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20 backdrop-blur-[2px]">
                  {/* Backdrop Click-to-Close */}
                  <div className="absolute inset-0" onClick={() => router.push('/dashboard')} />

                  <motion.div
                     initial={{ x: "100%" }}
                     animate={{ x: 0 }}
                     exit={{ x: "100%" }}
                     transition={{ type: "spring", damping: 30, stiffness: 300 }}
                     className="bg-white w-full max-w-[500px] h-screen shadow-2xl relative flex flex-col"
                  >
                     <button
                        onClick={() => router.push('/dashboard')}
                        className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all z-10"
                     >
                        <X className="w-5 h-5" />
                     </button>

                     <div className="p-10 pb-6 border-b border-slate-50">
                        <h2 className="text-xl font-semibold text-slate-900 tracking-tight">Add New Booking</h2>
                        <p className="text-[12px] font-normal text-slate-400 mt-1.5">Add a new booking task to the system.</p>
                     </div>

                     <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        {FormContent}
                     </div>
                  </motion.div>
               </div>
            ) : (
               /* ── MOBILE VIEW (Standard padding) ── */
               <div className="px-1">
                  {FormContent}
               </div>
            )}
         </motion.main>

         {/* ── MOBILE NAV ── */}
         <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-neutral-100 flex justify-around py-3 rounded-2xl shadow-xl z-50">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 text-slate-300">
               <TrendingUp className="w-5 h-5" />
               <span className="text-[8px] font-semibold uppercase tracking-tighter">Dash</span>
            </Link>
            <div className="flex flex-col items-center gap-1 text-primary">
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
         </nav>
      </div>
   );
}
