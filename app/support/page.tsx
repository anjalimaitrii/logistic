"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Globe } from "lucide-react";

const NAVY = "#1B2340";
const RED = "#E11D2A";

export default function SupportPage() {
   return (
      <div className="min-h-screen w-full bg-[#EEF0F4] flex items-center justify-center p-4 sm:p-6 font-sans">
         <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl overflow-hidden">

            {/* ── Header band ── */}
            <div className="px-6 sm:px-10 py-8 relative overflow-hidden" style={{ background: NAVY }}>
               <div
                  className="absolute -right-16 -bottom-20 w-64 h-64 rounded-full"
                  style={{ background: `radial-gradient(circle, ${RED}22 0%, transparent 70%)` }}
               />
               <Link
                  href="/"
                  className="relative z-10 inline-flex items-center gap-2 text-white/60 hover:text-white text-[12px] font-medium mb-6 transition-colors"
               >
                  <ArrowLeft className="w-4 h-4" /> Back to login
               </Link>
               <div className="relative z-10 flex flex-col items-start gap-2">
                  <h1 className="text-2xl sm:text-[34px] font-extrabold text-white tracking-tight leading-none">
                     maitri<span style={{ color: RED }}>i</span>infotech<span style={{ color: RED }}>.</span>
                  </h1>
                  <p className="text-[10px] sm:text-[11px] font-bold text-white/45 uppercase tracking-[0.28em]">
                     Innovate · Integrate · Implement
                  </p>
               </div>
            </div>

            {/* ── Body ── */}
            <div className="px-6 sm:px-10 py-8 space-y-8">
               <div>
                  <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contact &amp; Support</h2>
                  <p className="text-[14px] text-slate-600 leading-relaxed">
                     This platform is built and maintained by{" "}
                     <span className="font-semibold text-slate-900">Maitrii Infotech</span> — a software studio that
                     builds reliable, modern business platforms. Feel free to reach out for any kind of query — we're
                     available for you.
                  </p>
               </div>

               {/* Contact cards */}
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <a
                     href="mailto:utkarsh@maitriiinfotech.com"
                     className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/40 transition-all"
                  >
                     <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0" style={{ color: RED }}>
                        <Mail className="w-5 h-5" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</p>
                        <p className="text-[13px] font-semibold text-slate-900 truncate">utkarsh@maitriiinfotech.com</p>
                     </div>
                  </a>

                  <a
                     href="tel:+917792077777"
                     className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/40 transition-all"
                  >
                     <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0" style={{ color: RED }}>
                        <Phone className="w-5 h-5" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Phone</p>
                        <p className="text-[13px] font-semibold text-slate-900">+91 77920 77777</p>
                     </div>
                  </a>

                  <a
                     href="https://www.google.com/maps?q=11/70+Madhyam+Marg,+Mansarovar,+Jaipur+302020"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/40 transition-all"
                  >
                     <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0" style={{ color: RED }}>
                        <MapPin className="w-5 h-5" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Office</p>
                        <p className="text-[13px] font-semibold text-slate-900 leading-snug">
                           11/70 Madhyam Marg, Mansarovar, Jaipur – 302020
                        </p>
                     </div>
                  </a>

                  <a
                     href="https://www.maitriiinfotech.com/"
                     target="_blank"
                     rel="noopener noreferrer"
                     className="group flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/40 transition-all"
                  >
                     <div className="w-11 h-11 rounded-xl bg-rose-50 flex items-center justify-center shrink-0" style={{ color: RED }}>
                        <Globe className="w-5 h-5" />
                     </div>
                     <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Website</p>
                        <p className="text-[13px] font-semibold text-slate-900 truncate">www.maitriiinfotech.com</p>
                     </div>
                  </a>
               </div>

            </div>

            {/* ── Footer ── */}
            <div className="px-6 sm:px-10 py-5 border-t border-slate-100 bg-slate-50/60">
               <p className="text-[11px] text-slate-400 text-center">
                  © Maitrii Infotech · Innovate • Integrate • Implement
               </p>
            </div>
         </div>
      </div>
   );
}
