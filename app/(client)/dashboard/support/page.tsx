"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Search, 
  ChevronRight, 
  HelpCircle, 
  FileText, 
  ShieldCheck, 
  Clock,
  ArrowRight,
  ExternalLink,
  Bell,
  TrendingUp,
  Package,
  Plus,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import Link from "next/link";

export default function ClientSupportPage() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const helpCategories = [
    { title: "Booking Help", desc: "Issues with new or active shipments", icon: Package, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Payments", desc: "Billing, invoices and ledger queries", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Account Safety", desc: "Security and profile management", icon: ShieldCheck, color: "text-purple-500", bg: "bg-purple-50" },
    { title: "App Guidance", desc: "How to use the dashboard features", icon: FileText, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  const faqs = [
    { q: "How do I track my active shipment?", a: "Go to the 'Jobs' section in your sidebar to see real-time updates for all your in-transit shipments." },
    { q: "Can I cancel a booking request?", a: "Yes, requests can be cancelled as long as they haven't been accepted by an admin." },
    { q: "When do I get my final invoice?", a: "Final invoices are generated automatically once a shipment is marked as 'Delivered' in the system." },
  ];

  return (
    <div className="flex bg-white min-h-screen relative overflow-x-hidden transition-colors duration-500">
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
        className="flex-1 min-w-0 bg-neutral-50 pb-24 md:pb-12"
      >
        {/* ── CLEAN TOP BAR ── */}
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-neutral-100 flex items-center justify-between sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 mb-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search help topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-transparent rounded-lg py-1.5 pl-9 pr-4 text-[12px] font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-200 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 relative">
              <Bell className="w-4 h-4" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-white" />
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <div className="flex items-center gap-2 pl-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-medium">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden lg:block leading-none">
                <p className="text-[11px] font-semibold text-slate-900">{user?.name || "User"}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">Verified Client</p>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-5xl mx-auto">
          {/* ── HERO SECTION ── */}
          <div className="mb-12">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">How can we help?</h1>
            <p className="text-[13px] md:text-[14px] font-medium text-slate-400 mt-2">Get instant assistance for all your logistics needs.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* ── LEFT: CATEGORIES & CONTACT ── */}
            <div className="lg:col-span-8 space-y-8">
              {/* Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {helpCategories.map((cat, i) => (
                  <button key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all text-left group">
                    <div className={`w-10 h-10 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-[14px] font-bold text-slate-900 mb-1">{cat.title}</h3>
                    <p className="text-[11px] font-medium text-slate-400 leading-relaxed">{cat.desc}</p>
                  </button>
                ))}
              </div>

              {/* Quick Contact Options */}
              <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-[15px] font-bold text-slate-900">Direct Assistance</h3>
                    <p className="text-[11px] font-medium text-slate-400 mt-0.5">Typically responds in under 15 minutes</p>
                  </div>
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Online Now
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Live Chat", icon: MessageCircle, color: "text-primary", bg: "bg-primary/5", action: "Start Chat" },
                    { label: "Email Support", icon: Mail, color: "text-blue-500", bg: "bg-blue-50", action: "Write Us" },
                    { label: "Call Center", icon: Phone, color: "text-slate-900", bg: "bg-slate-50", action: "+234 123 456" },
                  ].map((opt, i) => (
                    <button key={i} className="flex flex-col items-center p-6 rounded-[24px] border border-slate-50 hover:border-slate-100 hover:bg-slate-50 transition-all group">
                      <div className={`w-12 h-12 rounded-2xl ${opt.bg} ${opt.color} flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1`}>
                        <opt.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{opt.label}</span>
                      <span className="text-[13px] font-bold text-slate-900">{opt.action}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── RIGHT: FAQs & TICKETS ── */}
            <div className="lg:col-span-4 space-y-6">
              {/* FAQ Section */}
              <div className="bg-slate-900 rounded-[32px] p-6 text-white overflow-hidden relative">
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-4">
                    <HelpCircle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-[16px] font-bold mb-4">Common Questions</h3>
                  <div className="space-y-4">
                    {faqs.map((faq, i) => (
                      <div key={i} className="group cursor-pointer">
                        <div className="flex items-center justify-between py-2 border-b border-white/5 group-hover:border-white/20 transition-all">
                          <span className="text-[12px] font-medium text-white/80 group-hover:text-white transition-colors">{faq.q}</span>
                          <ChevronRight className="w-3 h-3 text-white/30 group-hover:text-white transition-all group-hover:translate-x-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all">
                    Browse All Articles
                  </button>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              </div>

              {/* Support Hours */}
              <div className="bg-white rounded-[28px] border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-[13px] font-bold text-slate-900">Support Hours</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-400">Weekdays</span>
                    <span className="font-bold text-slate-900">24 Hours</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-400">Saturdays</span>
                    <span className="font-bold text-slate-900">08:00 - 18:00</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-400">Sundays</span>
                    <span className="font-bold text-primary">Emergency Only</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.main>

      {/* ── MOBILE NAV ── */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-xl border border-neutral-100 flex justify-around py-3 rounded-2xl shadow-xl z-50">
        <Link href="/dashboard" className="flex flex-col items-center gap-1 text-slate-300">
          <TrendingUp className="w-5 h-5" />
          <span className="text-[8px] font-semibold uppercase tracking-tighter">Dash</span>
        </Link>
        <Link href="/dashboard/jobs" className="flex flex-col items-center gap-1 text-slate-300">
          <Package className="w-5 h-5" />
          <span className="text-[8px] font-semibold uppercase tracking-tighter">Jobs</span>
        </Link>
        <div className="flex flex-col items-center gap-1 text-slate-300">
          <div className="relative">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white -mt-6">
              <Plus className="w-6 h-6" />
            </div>
          </div>
          <span className="text-[8px] font-semibold uppercase tracking-tighter">New</span>
        </div>
        <Link href="/dashboard/ledger" className="flex flex-col items-center gap-1 text-slate-300">
          <DollarSign className="w-5 h-5" />
          <span className="text-[8px] font-semibold uppercase tracking-tighter">Ledger</span>
        </Link>
        <Link href="/dashboard/support" className="flex flex-col items-center gap-1 text-primary">
          <MessageCircle className="w-5 h-5" />
          <span className="text-[8px] font-semibold uppercase tracking-tighter">Help</span>
        </Link>
      </nav>
    </div>
  );
}
