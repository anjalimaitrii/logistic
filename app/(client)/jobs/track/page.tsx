"use client";

import React, { useState } from "react";
import Link from "next/link";
import ClientChatPanel from "@/components/client/ClientChatPanel";

export default function TrackPage() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-16">
      {/* Ultra-Slim Header (Full Width) */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200 px-3 py-1.5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Link href="/dashboard" className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 text-slate-400 hover:text-primary transition-all">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
            </svg>
          </Link>
          <div className="leading-none">
            <h1 className="text-[10px] font-black text-slate-900 uppercase tracking-tight">Tracking</h1>
            <div className="flex items-center gap-1 mt-0.5">
               <span className="w-0.5 h-0.5 rounded-full bg-emerald-500" />
               <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">JOB-004 • Transit</span>
            </div>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-white text-[8px] font-black text-primary">EO</div>
      </div>

      <div className="p-3 space-y-3 flex-grow">
        {/* Ultra-Compact Status Card (Full Width) */}
        <div className="bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
           <div className="space-y-0 text-left">
              <span className="text-[6px] font-black text-slate-400 uppercase tracking-widest leading-none">Current Update</span>
              <div className="text-[11px] font-black text-slate-800 tracking-tight leading-tight">En Route to Abuja</div>
           </div>
           <div className="text-right">
              <div className="text-primary font-black text-[11px] leading-tight">4h ETA</div>
              <div className="text-[7px] font-extrabold text-emerald-500 uppercase tracking-tighter leading-none">On Schedule</div>
           </div>
        </div>

        {/* Mapp Section (Small Width - "Choti Width") */}
        <div className="space-y-1 mx-auto w-full max-w-[400px]">
           <div className="flex items-center justify-between px-1">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.1em]">Route Overview</span>
              <span className="text-[7px] font-bold text-primary uppercase">● GPS Live</span>
           </div>
           <div className="relative aspect-16/10 bg-slate-200 rounded-[24px] overflow-hidden border-2 border-white shadow-lg group">
              <iframe 
                 src="https://www.openstreetmap.org/export/embed.html?bbox=2.5,6.0,8.5,10.0&layer=mapnik&marker=9.0579,7.4951" 
                 className="w-full h-full grayscale-[0.05] opacity-95"
                 style={{ border: 0 }}
                 title="Shipment Route"
              />
              <div className="absolute top-2 left-2 bg-white/95 px-1.5 py-1 rounded-md border border-slate-100 shadow-sm flex items-center gap-1">
                 <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
                 <span className="text-[6px] font-black text-slate-900 uppercase">ID-7742</span>
              </div>
           </div>
        </div>

        {/* Tiny Info Row (Full Width) */}
        <div className="grid grid-cols-2 gap-2">
           <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-sky-50 flex items-center justify-center text-sky-500 shrink-0">
                 <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
              </div>
              <div className="min-w-0">
                 <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest leading-none">Driver</p>
                 <p className="text-[9px] font-bold text-slate-900 truncate">Emeka Okafor</p>
              </div>
           </div>
           <div className="bg-white p-2 rounded-lg border border-slate-100 shadow-sm flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                 <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M20 8h-3V4c0-1.1-.9-2-2-2H9c-1.1 0-2 .9-2 2v4H4c-1.1 0-2 .9-2 2v10h1.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5h7c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5H22V10c0-1.1-.9-2-2-2zM9 4h6v4H9V4z"/></svg>
              </div>
              <div className="min-w-0">
                 <p className="text-[6px] font-black text-slate-400 uppercase tracking-widest leading-none">Vehicle</p>
                 <p className="text-[9px] font-bold text-slate-900 truncate">Volvo FMX</p>
              </div>
           </div>
        </div>

        {/* Minimalist Ledger (Full Width) */}
        <div className="bg-slate-900 rounded-[20px] p-3.5 text-white shadow-lg relative overflow-hidden">
           <div className="flex items-center justify-between mb-2.5 pb-2.5 border-b border-white/5">
              <h3 className="text-[7px] font-black uppercase tracking-[0.1em] text-slate-400">Ledger</h3>
              <span className="text-[6px] font-black uppercase text-emerald-400 tracking-widest leading-none">Paid ✓</span>
           </div>
           <div className="space-y-1.5 text-[8px] font-medium text-slate-400">
              <div className="flex justify-between items-center group cursor-default">
                 <span className="group-hover:text-white transition-colors">Freight Charge</span>
                 <span className="font-bold text-slate-100 font-mono">₹25,000</span>
              </div>
              <div className="flex justify-between items-center group cursor-default">
                 <span className="group-hover:text-white transition-colors">Tax/Fees</span>
                 <span className="font-bold text-slate-100 font-mono">₹2,500</span>
              </div>
              <div className="pt-2.5 mt-2.5 border-t border-white/10 flex justify-between items-end">
                 <div className="leading-none text-left">
                    <p className="text-[6px] font-black text-primary uppercase tracking-widest mb-0.5">Total Payable</p>
                    <p className="text-[14px] font-black tracking-tight text-white leading-none">₹27,500</p>
                 </div>
                 <button className="text-[7px] font-black bg-white/10 hover:bg-white text-white hover:text-slate-900 h-6 px-3 rounded-md border border-white/10 transition-all uppercase tracking-widest">
                    Receipt
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* FAB (Full Width aware) */}
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-5 right-5 w-10 h-10 bg-primary text-white rounded-full shadow-xl shadow-primary/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-[100] group"
      >
        <div className="relative">
           <svg className="w-4 h-4 fill-white group-hover:rotate-12 transition-transform duration-300" viewBox="0 0 24 24">
             <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
           </svg>
           <span className="absolute -top-0 -right-0 w-2 h-2 bg-white rounded-full border-2 border-primary" />
        </div>
      </button>

      <ClientChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        jobId="JOB-004" 
      />
    </div>
  );
}
