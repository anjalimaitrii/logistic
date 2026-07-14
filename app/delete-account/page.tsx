"use client";

import Link from "next/link";
import { ArrowLeft, Trash2, ShieldCheck, Mail } from "lucide-react";

const NAVY = "#1B2340";
const RED = "#E11D2A";

// Where deletion requests are received. <<< UPDATE with Piyush's email >>>
const SUPPORT_EMAIL = "piyush@maitriiinfotech.com";
const APP_NAME = "Speedogistic Driver";

export default function DeleteAccountPage() {
   return (
      <div className="min-h-screen w-full bg-[#EEF0F4] flex items-center justify-center p-4 sm:p-6 font-sans">
         <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl overflow-hidden">

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
                  <ArrowLeft className="w-4 h-4" /> Back to home
               </Link>
               <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                     <Trash2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col items-start gap-1">
                     <h1 className="text-2xl sm:text-[30px] font-extrabold text-white tracking-tight leading-none">
                        Delete your account
                     </h1>
                     <p className="text-[11px] sm:text-[12px] font-semibold text-white/50 uppercase tracking-[0.22em]">
                        {APP_NAME} · Maitrii Infotech
                     </p>
                  </div>
               </div>
            </div>

            {/* ── Body ── */}
            <div className="px-6 sm:px-10 py-8 space-y-8">
               <p className="text-[14px] text-slate-600 leading-relaxed">
                  You can request permanent deletion of your{" "}
                  <span className="font-semibold text-slate-900">{APP_NAME}</span> account and personal data. Follow the
                  steps below. Deletion is permanent and cannot be undone.
               </p>

               {/* Steps */}
               <div>
                  <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                     How to request deletion
                  </h2>
                  <ol className="space-y-4">
                     {[
                        <>
                           Send an email to{" "}
                           <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold" style={{ color: RED }}>
                              {SUPPORT_EMAIL}
                           </a>{" "}
                           from the email address registered with your account.
                        </>,
                        <>
                           Use the subject line <span className="font-semibold text-slate-900">“Delete my account”</span>.
                        </>,
                        <>
                           Include your registered <span className="font-semibold text-slate-900">email or phone number</span>{" "}
                           so we can verify it is your account.
                        </>,
                        <>
                           Our team verifies the request and deletes your account and data within{" "}
                           <span className="font-semibold text-slate-900">30 days</span>. We&apos;ll confirm by email once done.
                        </>,
                     ].map((step, i) => (
                        <li key={i} className="flex items-start gap-4">
                           <span
                              className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold text-white"
                              style={{ background: NAVY }}
                           >
                              {i + 1}
                           </span>
                           <p className="text-[14px] text-slate-700 leading-relaxed pt-0.5">{step}</p>
                        </li>
                     ))}
                  </ol>
               </div>

               {/* What gets deleted */}
               <div>
                  <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                     <ShieldCheck className="w-4 h-4" /> What is deleted &amp; retained
                  </h2>
                  <ul className="space-y-2 text-[13.5px] text-slate-600 leading-relaxed list-disc pl-5">
                     <li>
                        <span className="font-semibold text-slate-900">Deleted:</span> your driver profile, login
                        credentials, personal details (name, phone, license) and trip activity records tied to your account.
                     </li>
                     <li>
                        <span className="font-semibold text-slate-900">Retained:</span> records we are legally required to
                        keep (e.g. financial or compliance records) are kept only for the period required by law, then deleted.
                     </li>
                  </ul>
               </div>

               {/* Contact */}
               <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0" style={{ color: RED }}>
                     <Mail className="w-4 h-4" />
                  </div>
                  <p className="text-[13px] text-slate-500">
                     Requests &amp; questions:{" "}
                     <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold" style={{ color: RED }}>
                        {SUPPORT_EMAIL}
                     </a>
                  </p>
               </div>
            </div>
         </div>
      </div>
   );
}
