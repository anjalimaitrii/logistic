"use client";

import React from "react";
import Link from "next/link";

export default function DashboardPage() {
   return (
      <div className="flex flex-col min-h-screen">
         {/* Top Header Section */}
         <div className="bg-secondary-light p-6 pb-12 relative overflow-hidden">
            {/* Decorative Circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 left-10 w-24 h-24 bg-secondary/5 rounded-full blur-xl" />

            <div className="flex items-center justify-between mb-8 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                     <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                        <path d="M20 8H17L15 4H9L7 8H4C2.9 8 2 8.9 2 10V19C2 19.55 2.45 20 3 20H5C5 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20H15C15 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20H21C21.55 20 22 19.55 22 19V10C22 8.9 21.1 8 20 8ZM7 20C6.45 20 6 19.55 6 19C6 18.45 6.45 18 7 18C7.55 18 8 18.45 8 19C8 19.55 7.55 20 7 20ZM17 20C16.45 20 16 19.55 16 19C16 18.45 16.45 18 17 18C17.55 18 18 18.45 18 19C18 19.55 17.55 20 17 20ZM4 16V10H7.5L9.5 6H14.5L16.5 10H20V16H4Z" />
                     </svg>
                  </div>
                  <span className="font-display font-extrabold text-lg text-secondary tracking-tight">FleetTrack</span>
               </div>
               <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center relative">
                  <svg className="w-5 h-5 fill-secondary" viewBox="0 0 24 24">
                     <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-secondary-light" />
               </div>
            </div>

            <div className="mb-8 relative z-10">
               <p className="text-secondary/60 text-sm mb-1 font-medium">Good morning 👋</p>
               <h3 className="font-display font-bold text-2xl text-secondary">Welcome, Mr. Sharma</h3>
            </div>

            <Link href="/bookings/new">
               <button className="w-full bg-linear-to-r from-primary to-primary-mid text-white font-display font-bold py-4 rounded-2xl shadow-xl shadow-primary/40 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform active:scale-[0.98]">
                  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
                     <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                  Create New Booking
               </button>
            </Link>
         </div>

         {/* Content Section */}
         <div className="flex-1 bg-[#FDFDFD] px-4 -mt-8 rounded-t-[36px] relative z-20 pb-32 shadow-[0_-12px_40px_rgba(30,41,59,0.04)]">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 pt-8 mb-8">
               {[
                  { val: "3", lbl: "Active Jobs", color: "text-primary", bg: "bg-primary/5" },
                  { val: "₹1.85L", lbl: "Total Spent", color: "text-secondary", bg: "bg-secondary/5" },
                  { val: "2", lbl: "Pending Inv.", color: "text-success", bg: "bg-success/5" },
               ].map((stat, i) => (
                  <div key={i} className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all text-center group cursor-pointer active:scale-95">
                     <span className={`block font-display font-extrabold text-xl ${stat.color} group-hover:scale-110 transition-transform`}>{stat.val}</span>
                     <span className="block text-[9px] font-extrabold text-neutral-300 uppercase tracking-[0.2em] mt-1.5">{stat.lbl}</span>
                  </div>
               ))}
            </div>

            {/* Recent Bookings List */}
            <div className="flex items-center justify-between mb-5 px-1">
               <h4 className="font-display font-extrabold text-secondary tracking-tight">Recent Bookings</h4>
               <span className="text-[11px] font-extrabold text-primary uppercase tracking-widest cursor-pointer hover:underline">See all →</span>
            </div>

            <div className="space-y-4">
               {[
                  { id: "JOB-004", route: "Lagos → Abuja • 5 Ton Tiles", status: "In Transit", type: "transit" },
                  { id: "JOB-003", route: "Nairobi → Mombasa • Electronics", status: "Confirmed", type: "confirmed" },
                  { id: "JOB-002", route: "Accra → Kumasi • Furniture", status: "Delivered", type: "delivered" },
               ].map((job, i) => (
                  <Link href="/jobs/track" key={i}>
                     <div className="bg-white p-5 rounded-[28px] border border-neutral-100 flex items-center gap-4 active:scale-[0.98] hover:border-primary/20 transition-all cursor-pointer shadow-sm">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner 
                        ${job.type === 'transit' ? 'bg-primary-light text-primary' :
                             job.type === 'delivered' ? 'bg-success-light text-success' : 'bg-sky-50 text-sky-600'}`}>
                           <svg className="w-8 h-8 fill-current opacity-80" viewBox="0 0 24 24">
                              <path d="M20 8H17L15 4H9L7 8H4C2.9 8 2 8.9 2 10V19C2 19.55 2.45 20 3 20H5C5 21.1 5.9 22 7 22C8.1 22 9 21.1 9 20H15C15 21.1 15.9 22 17 22C18.1 22 19 21.1 19 20H21C21.55 20 22 19.55 22 19V10C22 8.9 21.1 8 20 8Z" />
                           </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                           <span className="block font-display font-extrabold text-secondary text-[15px] tracking-tight">{job.id}</span>
                           <p className="text-[11px] text-neutral-400 truncate mt-0.5 font-bold uppercase tracking-tight">{job.route}</p>
                        </div>
                        <span className={`text-[9px] font-extrabold px-3 py-1.5 rounded-full uppercase tracking-widest border
                        ${job.type === 'transit' ? 'bg-primary/5 text-primary border-primary/10' :
                             job.type === 'delivered' ? 'bg-success/5 text-success border-success/10' : 'bg-sky-50 text-sky-600 border-sky-100'}`}>
                           ● {job.status}
                        </span>
                     </div>
                  </Link>
               ))}
            </div>
         </div>

         {/* Bottom Sticky Navigation */}
         <nav className="fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-white/50 flex justify-around py-4 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50">
            <div className="flex flex-col items-center gap-1.5 text-primary">
               <div className="w-1.5 h-1.5 bg-primary rounded-full absolute -top-1" />
               <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
               <span className="text-[9px] font-extrabold uppercase tracking-widest">Home</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-neutral-300 hover:text-secondary transition-colors cursor-pointer">
               <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M20 6H16V4C16 2.89 15.11 2 14 2H10C8.89 2 8 2.89 8 4V6H4C2.89 6 2 6.89 2 8V19C2 20.11 2.89 21 4 21H20C21.11 21 22 20.11 22 19V8C22 6.89 21.11 6 20 6ZM10 4H14V6H10V4ZM20 19H4V8H20V19Z" /></svg>
               <span className="text-[9px] font-extrabold uppercase tracking-widest">My Jobs</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-neutral-300 hover:text-secondary transition-colors cursor-pointer">
               <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2ZM16 18H8V16H16V18ZM16 14H8V12H16V14ZM13 9V3.5L18.5 9H13Z" /></svg>
               <span className="text-[9px] font-extrabold uppercase tracking-widest">Ledger</span>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-neutral-300 hover:text-secondary transition-colors cursor-pointer">
               <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
               <span className="text-[9px] font-extrabold uppercase tracking-widest">Profile</span>
            </div>
         </nav>
      </div>
   );
}
