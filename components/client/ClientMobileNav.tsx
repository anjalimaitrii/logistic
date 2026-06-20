"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Package, Plus, DollarSign, User } from "lucide-react";

// Bottom tab bar for client pages on mobile. Every tab is a real link.
export function ClientMobileNav() {
   const pathname = usePathname();
   const active = (href: string) => pathname === href;
   const cls = (href: string) =>
      `flex flex-col items-center gap-1 transition-colors ${active(href) ? "text-primary" : "text-slate-300"}`;

   return (
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-neutral-100 flex justify-around py-3 rounded-2xl shadow-xl z-50">
         <Link href="/dashboard" className={cls("/dashboard")}>
            <TrendingUp className="w-5 h-5" />
            <span className="text-[8px] font-semibold uppercase tracking-tighter">Dash</span>
         </Link>
         <Link href="/dashboard/jobs" className={cls("/dashboard/jobs")}>
            <Package className="w-5 h-5" />
            <span className="text-[8px] font-semibold uppercase tracking-tighter">Jobs</span>
         </Link>
         <Link href="/bookings/new" className="flex flex-col items-center gap-1 text-slate-300">
            <div className="relative">
               <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white -mt-6">
                  <Plus className="w-6 h-6" />
               </div>
            </div>
            <span className="text-[8px] font-semibold uppercase tracking-tighter">New</span>
         </Link>
         <Link href="/dashboard/ledger" className={cls("/dashboard/ledger")}>
            <DollarSign className="w-5 h-5" />
            <span className="text-[8px] font-semibold uppercase tracking-tighter">Ledger</span>
         </Link>
         <Link href="/dashboard/profile" className={cls("/dashboard/profile")}>
            <User className="w-5 h-5" />
            <span className="text-[8px] font-semibold uppercase tracking-tighter">Acc</span>
         </Link>
      </nav>
   );
}
