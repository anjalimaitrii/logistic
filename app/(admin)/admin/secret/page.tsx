"use client";

import React from "react";
import Link from "next/link";

const NON_TAX_CLIENTS = [
   { id: "CL-882", name: "Apex Logistics Ltd", contact: "+234 802 123 4567", category: "Internal-Branch", volume: "1,240 Tons", status: "Active" },
   { id: "CL-914", name: "Global Freight Solutions", contact: "+234 703 987 6543", category: "Non-Taxable Entity", volume: "850 Tons", status: "Active" },
   { id: "CL-756", name: "West-Hook Partners", contact: "+234 815 444 2222", category: "Charity/Exempt", volume: "420 Tons", status: "On Hold" },
   { id: "CL-443", name: "Skyway Express", contact: "+234 901 333 1111", category: "Government-Contract", volume: "2,100 Tons", status: "Active" },
   { id: "CL-229", name: "Bridge-Link Cargo", contact: "+234 809 111 0000", category: "Sister-Company", volume: "610 Tons", status: "Active" },
];

export default function AdminSecretPage() {
   return (
      <div className="min-h-screen bg-[#FDFDFD] text-secondary font-sans p-4 sm:p-6 lg:p-8">
         <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Header Area */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-5">
               <div>
                  <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-primary uppercase tracking-[0.2em] mb-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                     Special Client Ledger
                  </div>
                  <h1 className="text-xl font-display font-extrabold tracking-tight text-secondary">Non-Taxable Directory</h1>
               </div>
               
               <Link href="/admin/dashboard" className="text-[11px] font-bold text-neutral-400 hover:text-primary transition-colors flex items-center gap-2 px-3 py-1.5 bg-neutral-50 rounded-lg border border-neutral-100 uppercase tracking-widest active:scale-95">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M19 12H5m7-7l-7 7 7 7"/></svg>
                  Exit Ledger
               </Link>
            </div>

            {/* Quick Metrics (Micro Blocks) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
               {[
                  { lbl: "Total Exempt", val: "12 Client(s)" },
                  { lbl: "Exempt Volume", val: "5.2k Tons" },
                  { lbl: "Ledger Type", val: "Without Tax" },
                  { lbl: "Access Level", val: "Master Admin" },
               ].map((m, i) => (
                  <div key={i} className="bg-white border border-neutral-100 rounded-xl p-3.5 shadow-sm">
                     <div className="text-[9px] font-extrabold text-neutral-300 uppercase tracking-widest">{m.lbl}</div>
                     <div className="text-[13px] font-bold text-secondary mt-0.5">{m.val}</div>
                  </div>
               ))}
            </div>

            {/* Data Table (Super Compact) */}
            <div className="bg-white border border-neutral-100 rounded-xl shadow-sm overflow-hidden mt-4">
               <div className="bg-neutral-50/50 p-4 border-b border-neutral-100 flex items-center justify-between">
                  <h3 className="text-[11px] font-extrabold text-secondary/60 uppercase tracking-widest">Client Distribution (Excluded from GST)</h3>
                  <button className="text-[10px] font-bold text-primary hover:underline">Export CSV</button>
               </div>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-neutral-50/30 border-b border-neutral-100">
                           <th className="px-4 py-3 text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Client ID</th>
                           <th className="px-4 py-3 text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Company Name</th>
                           <th className="px-4 py-3 text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Contact</th>
                           <th className="px-4 py-3 text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Category</th>
                           <th className="px-4 py-3 text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest">Volume</th>
                           <th className="px-4 py-3 text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest text-right">Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-neutral-50">
                        {NON_TAX_CLIENTS.map((client, i) => (
                           <tr key={i} className="hover:bg-neutral-50/50 transition-colors group">
                              <td className="px-4 py-3.5 text-[11px] font-bold text-neutral-300">{client.id}</td>
                              <td className="px-4 py-3.5 text-[12px] font-bold text-secondary">{client.name}</td>
                              <td className="px-4 py-3.5 text-[11px] font-medium text-neutral-400 group-hover:text-secondary transition-colors">{client.contact}</td>
                              <td className="px-4 py-3.5">
                                 <span className="text-[9px] font-extrabold bg-primary/5 text-primary border border-primary/10 px-2.5 py-0.5 rounded-full uppercase tracking-tighter">
                                    {client.category}
                                 </span>
                              </td>
                              <td className="px-4 py-3.5 text-[11px] font-bold text-secondary">{client.volume}</td>
                              <td className="px-4 py-3.5 text-right">
                                 <span className={`text-[10px] font-extrabold tracking-tighter ${client.status === 'Active' ? 'text-success' : 'text-amber-500'}`}>
                                    {client.status}
                                 </span>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>

               <div className="p-4 bg-neutral-50/30 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-300 font-bold uppercase tracking-widest">
                  Showing 5 of 12 Special Clients
                  <div className="flex gap-2">
                     <button className="px-3 py-1 bg-white border border-neutral-100 rounded text-neutral-400 hover:text-secondary disabled:opacity-50" disabled>Previous</button>
                     <button className="px-3 py-1 bg-white border border-neutral-100 rounded text-neutral-400 hover:text-secondary">Next</button>
                  </div>
               </div>
            </div>

            {/* Subtle System Footer */}
            <div className="text-[10px] font-bold text-neutral-300 text-center uppercase tracking-[0.3em] pt-10">
               Master Log Protocol v4.2.0 • End-to-End Encrypted
            </div>

         </div>
      </div>
   );
}
