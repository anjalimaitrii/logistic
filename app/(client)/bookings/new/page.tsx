"use client";

import React, { useState } from "react";
import Link from "next/link";

const TRUCK_TYPES = [
   { name: "Light Bakkie", icon: "🛻", desc: "Up to 1 Ton" },
   { name: "Mini Truck", icon: "🚚", desc: "1 - 2 Tons" },
   { name: "Small Truck", icon: "🚛", desc: "3 - 5 Tons" },
   { name: "Medium Truck", icon: "📦", desc: "8 - 12 Tons" },
   { name: "Large Rigid", icon: "🏢", desc: "14+ Tons" },
];

export default function NewBookingPage() {
   const [selectedTruck, setSelectedTruck] = useState("Mini Truck");

   return (
      <div className="flex flex-col min-h-screen bg-[#FDFDFD] pb-12 font-sans">
         {/* Header Section */}
         <div className="bg-secondary-light p-6 pb-12 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-secondary/60 text-[11px] font-extrabold uppercase tracking-widest mb-4 hover:text-secondary transition-all relative z-10">
               <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
               Dashboard
            </Link>
            <h3 className="font-display font-extrabold text-2xl tracking-tight text-secondary relative z-10">Enhanced Booking</h3>
            <p className="text-secondary/60 text-[11px] mt-1 font-bold tracking-tight relative z-10 uppercase opacity-70">Complete your logistics requirement profile</p>
         </div>

         {/* Form Context */}
         <div className="px-5 mt-[-20px] space-y-8 relative z-20">
            
            {/* 1. Pickup Details */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-[10px] font-extrabold text-primary uppercase tracking-[0.2em] px-1">
                  <span className="w-1.5 h-4 bg-primary rounded-full" />
                  Pickup Address
               </div>
               <div className="bg-white border border-neutral-100 rounded-[24px] p-5 shadow-sm space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-extrabold text-neutral-300 uppercase tracking-widest ml-1">Street / Building Name</label>
                     <input type="text" placeholder="123 Harmony Estate" className="w-full bg-neutral-50/50 border border-neutral-100 rounded-xl px-4 py-3 text-[12px] font-bold text-secondary focus:border-primary/20 focus:bg-white outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-neutral-300 uppercase tracking-widest ml-1">Area / City</label>
                        <input type="text" placeholder="Lagos Central" className="w-full bg-neutral-50/50 border border-neutral-100 rounded-xl px-4 py-3 text-[12px] font-bold text-secondary focus:border-primary/20 focus:bg-white outline-none transition-all" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-neutral-300 uppercase tracking-widest ml-1">Pincode</label>
                        <input type="text" placeholder="10001" className="w-full bg-neutral-50/50 border border-neutral-100 rounded-xl px-4 py-3 text-[12px] font-bold text-secondary focus:border-primary/20 focus:bg-white outline-none transition-all" />
                     </div>
                  </div>
               </div>
            </div>

            {/* 2. Drop-off Details */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-[10px] font-extrabold text-secondary uppercase tracking-[0.2em] px-1">
                  <span className="w-1.5 h-4 bg-secondary rounded-full opacity-30" />
                  Drop-off Address
               </div>
               <div className="bg-white border border-neutral-100 rounded-[24px] p-5 shadow-sm space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-[10px] font-extrabold text-neutral-300 uppercase tracking-widest ml-1">Street / Building Name</label>
                     <input type="text" placeholder="Garki Sector 2" className="w-full bg-neutral-50/50 border border-neutral-100 rounded-xl px-4 py-3 text-[12px] font-bold text-secondary focus:border-primary/20 focus:bg-white outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-neutral-300 uppercase tracking-widest ml-1">Area / City</label>
                        <input type="text" placeholder="Abuja FCT" className="w-full bg-neutral-50/50 border border-neutral-100 rounded-xl px-4 py-3 text-[12px] font-bold text-secondary focus:border-primary/20 focus:bg-white outline-none transition-all" />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-neutral-300 uppercase tracking-widest ml-1">Pincode</label>
                        <input type="text" placeholder="90001" className="w-full bg-neutral-50/50 border border-neutral-100 rounded-xl px-4 py-3 text-[12px] font-bold text-secondary focus:border-primary/20 focus:bg-white outline-none transition-all" />
                     </div>
                  </div>
               </div>
            </div>

            {/* 3. Truck Selection */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 text-[10px] font-extrabold text-secondary uppercase tracking-[0.2em] px-1">
                  <span className="w-1.5 h-4 bg-secondary rounded-full opacity-30" />
                  Select Truck Type
               </div>
               <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-5 px-5">
                  {TRUCK_TYPES.map((truck, i) => (
                     <div 
                        key={i} 
                        onClick={() => setSelectedTruck(truck.name)}
                        className={`min-w-[140px] p-5 rounded-[24px] border transition-all cursor-pointer select-none group ${selectedTruck === truck.name ? 'bg-primary border-primary shadow-lg shadow-primary/20' : 'bg-white border-neutral-100 hover:border-primary/30'}`}
                     >
                        <div className={`text-2xl mb-3 transition-transform group-hover:scale-110 ${selectedTruck === truck.name ? 'grayscale-0' : 'grayscale opacity-50'}`}>{truck.icon}</div>
                        <div className={`text-[12px] font-bold mb-1 ${selectedTruck === truck.name ? 'text-white' : 'text-secondary'}`}>{truck.name}</div>
                        <div className={`text-[9px] font-extrabold uppercase tracking-widest ${selectedTruck === truck.name ? 'text-white/60' : 'text-neutral-300'}`}>{truck.desc}</div>
                     </div>
                  ))}
               </div>
            </div>

            {/* 4. Additional Info */}
            <div className="grid grid-cols-2 gap-4 pt-2">
               <div className="space-y-1.5 text-center p-4 bg-white border border-neutral-100 rounded-[20px] shadow-sm">
                  <label className="text-[9px] font-extrabold text-neutral-300 uppercase tracking-widest">Weight Class</label>
                  <div className="text-[14px] font-display font-extrabold text-secondary">~5 Tons</div>
               </div>
               <div className="space-y-1.5 text-center p-4 bg-white border border-neutral-100 rounded-[20px] shadow-sm">
                  <label className="text-[9px] font-extrabold text-neutral-300 uppercase tracking-widest">Expected Rate</label>
                  <div className="text-[14px] font-display font-extrabold text-primary">₹28,500</div>
               </div>
            </div>

            <button className="w-full bg-primary text-white font-display font-extrabold py-5 rounded-[24px] shadow-xl shadow-primary/40 flex items-center justify-center gap-3 hover:scale-[1.01] transition-transform active:scale-[0.98] text-[13px] uppercase tracking-[0.1em] mt-4">
               Submit Booking Request
               <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
            </button>

         </div>
      </div>
   );
}
