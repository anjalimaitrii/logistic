"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck, MapPin, Camera, User, Trash2, Mail } from "lucide-react";

const NAVY = "#1B2340";
const RED = "#E11D2A";

const SUPPORT_EMAIL = "goyalpiyush7@gmail.com";
const APP_NAME = "Speedogistic Driver";
const LAST_UPDATED = "14 July 2026";

export default function PrivacyPolicyPage() {
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
                  <ArrowLeft className="w-4 h-4" /> Back to home
               </Link>
               <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                     <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex flex-col items-start gap-1">
                     <h1 className="text-2xl sm:text-[30px] font-extrabold text-white tracking-tight leading-none">
                        Privacy Policy
                     </h1>
                     <p className="text-[11px] sm:text-[12px] font-semibold text-white/50 uppercase tracking-[0.22em]">
                        {APP_NAME} · Maitrii Infotech
                     </p>
                  </div>
               </div>
            </div>

            {/* ── Body ── */}
            <div className="px-6 sm:px-10 py-8 space-y-8 text-slate-600">
               <p className="text-[13px] text-slate-400">Last updated: {LAST_UPDATED}</p>

               <p className="text-[14px] leading-relaxed">
                  This Privacy Policy explains how <span className="font-semibold text-slate-900">Maitrii Infotech</span>{" "}
                  (&quot;we&quot;, &quot;us&quot;) collects, uses, and protects information in the{" "}
                  <span className="font-semibold text-slate-900">{APP_NAME}</span> mobile application (the
                  &quot;App&quot;). The App is used by drivers to receive assigned trips, update trip status, and record
                  delivery activity for fleet operations.
               </p>

               <Section icon={<User className="w-4 h-4" />} title="Information we collect">
                  <ul className="space-y-2 text-[13.5px] leading-relaxed list-disc pl-5">
                     <li>
                        <span className="font-semibold text-slate-900">Account details</span> — your name, phone number,
                        driver&apos;s licence number, and driver ID. These are provided by your fleet operator; the App does
                        not offer public sign-up.
                     </li>
                     <li>
                        <span className="font-semibold text-slate-900">Location data</span> — precise GPS location, captured
                        when you start or complete a trip, to record trip start/end points and support fleet tracking.
                     </li>
                     <li>
                        <span className="font-semibold text-slate-900">Trip &amp; activity data</span> — trip statuses,
                        timestamps, delivery order numbers, reported damages, and related records.
                     </li>
                     <li>
                        <span className="font-semibold text-slate-900">Photos</span> — images you capture or upload as
                        offloading receipts or proof of delivery.
                     </li>
                     <li>
                        <span className="font-semibold text-slate-900">Device information</span> — basic technical data
                        needed for the App to function and stay secure.
                     </li>
                  </ul>
               </Section>

               <Section icon={<MapPin className="w-4 h-4" />} title="How we use location">
                  <p className="text-[13.5px] leading-relaxed">
                     The App accesses your device location only to record the truck&apos;s position at key trip events
                     (e.g. trip start and completion) and to support live fleet tracking during an active trip. Location
                     is used while you use the App for these purposes. You can control location access through your
                     device settings; disabling it may limit trip features.
                  </p>
               </Section>

               <Section icon={<Camera className="w-4 h-4" />} title="How we use your information">
                  <ul className="space-y-2 text-[13.5px] leading-relaxed list-disc pl-5">
                     <li>Assign, display, and update your trips and their status.</li>
                     <li>Record proof of delivery, offloading, and reported damages.</li>
                     <li>Enable fleet operators to coordinate and track trips.</li>
                     <li>Keep the App secure and troubleshoot issues.</li>
                  </ul>
               </Section>

               <Section icon={<ShieldCheck className="w-4 h-4" />} title="Sharing of information">
                  <p className="text-[13.5px] leading-relaxed">
                     We do <span className="font-semibold text-slate-900">not sell</span> your personal information. Your
                     data is shared only with the fleet operator you drive for, and with service providers that help us
                     run the platform (secure cloud hosting and GPS tracking services), strictly to provide the App.
                     We may disclose information if required by law.
                  </p>
               </Section>

               <Section icon={<ShieldCheck className="w-4 h-4" />} title="Data retention & security">
                  <p className="text-[13.5px] leading-relaxed">
                     We retain your information for as long as your account is active or as needed to provide fleet
                     services, and only as long as required by applicable law thereafter. We use reasonable technical and
                     organisational measures to protect your data against unauthorised access.
                  </p>
               </Section>

               <Section icon={<Trash2 className="w-4 h-4" />} title="Deleting your account & data">
                  <p className="text-[13.5px] leading-relaxed">
                     You can request permanent deletion of your account and personal data at any time. See our{" "}
                     <Link href="/delete-account" className="font-semibold" style={{ color: RED }}>
                        account deletion page
                     </Link>{" "}
                     for the steps.
                  </p>
               </Section>

               <Section icon={<User className="w-4 h-4" />} title="Children">
                  <p className="text-[13.5px] leading-relaxed">
                     The App is intended for professional drivers and is not directed to children under 16. We do not
                     knowingly collect data from children.
                  </p>
               </Section>

               <Section icon={<ShieldCheck className="w-4 h-4" />} title="Changes to this policy">
                  <p className="text-[13.5px] leading-relaxed">
                     We may update this policy from time to time. Material changes will be reflected here with a new
                     &quot;Last updated&quot; date.
                  </p>
               </Section>

               {/* Contact */}
               <div className="pt-2 border-t border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0" style={{ color: RED }}>
                     <Mail className="w-4 h-4" />
                  </div>
                  <p className="text-[13px] text-slate-500">
                     Questions about this policy?{" "}
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

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
   return (
      <div>
         <h2 className="text-[12px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            {icon} {title}
         </h2>
         {children}
      </div>
   );
}
