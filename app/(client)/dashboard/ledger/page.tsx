"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Search, 
  ChevronRight, 
  Wallet, 
  Clock, 
  CheckCircle2,
  Bell,
  TrendingUp,
  Package,
  Plus,
  DollarSign
} from "lucide-react";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ClientSidebarNavigation } from "@/components/client/ClientSidebarNavigation";
import { bookingService } from "@/services/bookingService";

export default function ClientLedgerPage() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      loadData(parsedUser._id || parsedUser.id);
    } else {
      loadData();
    }
  }, []);

  const loadData = async (clientId?: string) => {
    try {
      setIsLoading(true);
      const data = await bookingService.getAll(clientId);
      setBookings(Array.isArray(data) ? data : (data?.bookings || []));
    } catch (error) {
      console.error("Ledger load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Financial Stats — across all bookings
  const stats = {
    totalSpent:         bookings.reduce((sum, b) => sum + (b.finalAmount  || 0), 0),
    advancePaid:        bookings.reduce((sum, b) => sum + (b.advancePaid  || 0), 0),
    completedJobs:      bookings.filter(b => ["completed", "delivered", "finalized"].includes(b.status?.toLowerCase())).length,
    outstandingBalance: bookings.reduce((sum, b) => sum + Math.max(0, (b.finalAmount || 0) - (b.advancePaid || 0)), 0),
  };

  const filteredBookings = bookings.filter(b => {
    const q = searchQuery.toLowerCase();
    const allCities = [
      ...(b.pickupLocations || []).map((p: any) => p?.address?.city || ""),
      ...(b.dropoffLocations || []).map((d: any) => d?.address?.city || ""),
    ].join(" ").toLowerCase();
    const matchesSearch = !q || b.tripId?.toLowerCase().includes(q) || allCities.includes(q);
    const bal = (b.finalAmount || 0) - (b.advancePaid || 0);
    const hasAmount = (b.finalAmount || 0) > 0;
    const matchesStatus = statusFilter === "all"
      || (statusFilter === "due"     && hasAmount && bal > 0)
      || (statusFilter === "settled" && hasAmount && bal <= 0);
    return matchesSearch && matchesStatus;
  });

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
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-neutral-100 flex items-center justify-between sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 mb-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-sm w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 md:w-3.5 md:h-3.5 text-slate-400 group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-slate-50 border border-transparent rounded-lg py-1.5 pl-9 pr-4 text-[11px] md:text-[12px] font-medium placeholder:text-slate-400 focus:bg-white focus:border-slate-200 outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 relative">
              <Bell className="w-4 h-4" />
              <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full ring-2 ring-white" />
            </button>
            <div className="h-4 w-px bg-slate-200 mx-1" />
            <Link href="/dashboard/profile" className="flex items-center gap-2 pl-2 hover:opacity-80 transition-opacity cursor-pointer">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-[10px] font-medium">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden lg:block leading-none">
                <p className="text-[11px] font-semibold text-slate-900">{user?.name || "User"}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{user?.designation || "Representative"}</p>
              </div>
            </Link>
          </div>
        </header>

        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[9px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
                <span>Account</span>
                <ChevronRight className="w-3 h-3 text-neutral-300" />
                <span className="text-primary/80">Financial Ledger</span>
              </div>
              <h1 className="text-lg md:text-xl font-semibold text-slate-900 tracking-tight">Trip Statement</h1>
              <p className="text-[11px] text-neutral-400 font-medium">Track your shipment expenses and payment history.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white border border-neutral-100 rounded-xl p-1 flex items-center gap-1 shadow-sm">
                <button className="px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-slate-900 text-white transition-all">Daily</button>
                <button className="px-4 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-neutral-400 hover:text-slate-600 transition-all">Monthly</button>
              </div>
            </div>
          </div>

          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Final Cost", value: `K${stats.totalSpent.toLocaleString()}`, icon: Wallet, trend: "Statement", color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Paid Amount", value: `K${stats.advancePaid.toLocaleString()}`, icon: CheckCircle2, trend: "Settled", color: "text-emerald-600", bg: "bg-emerald-50" },
              { label: "Completed Trips", value: stats.completedJobs, icon: Package, trend: "History", color: "text-amber-600", bg: "bg-amber-50" },
              { label: "Balance Due", value: `K${stats.outstandingBalance.toLocaleString()}`, icon: FileText, trend: "Pending", color: "text-rose-600", bg: "bg-rose-50" }
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${s.bg} ${s.color} transition-all`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter bg-neutral-50 text-neutral-400">
                    {s.trend}
                  </span>
                </div>
                <div className="text-lg font-bold text-slate-900 leading-none mb-1">{isLoading ? "..." : s.value}</div>
                <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-900">Transaction History</h3>
                  <p className="text-[9px] text-neutral-400 font-bold uppercase tracking-widest">Total {filteredBookings.length} Records</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-300 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    placeholder="Search Job ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-neutral-50 border border-transparent rounded-lg pl-9 pr-3 py-1.5 text-[11px] font-medium outline-none focus:bg-white focus:border-slate-100 transition-all w-48"
                  />
                </div>
                <div className="flex bg-neutral-50 border border-neutral-100 rounded-lg p-0.5 gap-0.5">
                  {[
                    { key: "all",     label: "All" },
                    { key: "due",     label: "Payment Due" },
                    { key: "settled", label: "Fully Settled" },
                  ].map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => setStatusFilter(opt.key)}
                      className={`px-3 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest transition-all ${statusFilter === opt.key ? "bg-white text-slate-900 shadow-sm" : "text-neutral-400 hover:text-slate-600"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-50">
                    <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Sr. No.</th>
                    <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Route</th>
                    <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payment Status</th>
                    <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Trip Cost</th>
                    <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Paid</th>
                    <th className="px-5 py-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={6} className="px-5 py-6"><div className="h-2 bg-slate-100 rounded-full w-full" /></td>
                      </tr>
                    ))
                  ) : filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No transactions found</p>
                      </td>
                    </tr>
                  ) : filteredBookings.map((b, i) => {
                    const balance = (b.finalAmount || 0) - (b.advancePaid || 0);
                    const isNotInvoiced = (b.finalAmount || 0) === 0;
                    const isFullyPaid = !isNotInvoiced && balance <= 0;
                    const cities = [
                      ...(b.pickupLocations || []).map((p: any) => p?.address?.city).filter(Boolean),
                      ...(b.dropoffLocations || []).map((d: any) => d?.address?.city).filter(Boolean),
                    ] as string[];
                    if (!cities.length) cities.push("—");

                    return (
                      <tr key={b._id} className="hover:bg-neutral-50/50 transition-colors group border-b border-neutral-50 last:border-none">
                        <td className="px-5 py-5">
                          <div className="flex flex-col">
                            <span className="text-[12px] font-bold text-slate-900 tracking-tight">{i + 1}</span>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mt-0.5">
                              {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex flex-col gap-0.5">
                            <div className="relative group/route inline-flex items-center gap-1">
                              <span className="text-[11px] font-medium text-slate-600 italic">{cities[0]}</span>
                              {cities.length > 1 && <span className="text-slate-300 text-[10px] font-bold">→</span>}
                              {cities.length > 2 && <span className="text-[11px] text-slate-400 italic">...</span>}
                              {cities.length > 2 && <span className="text-slate-300 text-[10px] font-bold">→</span>}
                              {cities.length > 1 && <span className="text-[11px] font-medium text-slate-600 italic">{cities[cities.length - 1]}</span>}
                              {cities.length > 2 && (
                                <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover/route:block z-50 bg-slate-900 text-white text-[10px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl pointer-events-none">
                                  {cities.join(" → ")}
                                  <div className="absolute top-full left-3 border-4 border-transparent border-t-slate-900" />
                                </div>
                              )}
                            </div>
                            <span className="text-[9px] font-medium text-slate-400">{b.cargoDetails?.goodsType}{b.cargoDetails?.weight ? ` • ${b.cargoDetails.weight} KG` : ""}</span>
                          </div>
                        </td>
                        <td className="px-5 py-5">
                          <div className="flex flex-col gap-1">
                            <span className={`w-fit px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest border ${
                              isNotInvoiced ? 'bg-slate-50 text-slate-400 border-slate-100'
                              : isFullyPaid  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                              :                'bg-amber-50 text-amber-600 border-amber-100'
                            }`}>
                              {isNotInvoiced ? 'Not Invoiced' : isFullyPaid ? 'Fully Settled' : 'Payment Due'}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-5 text-right">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-slate-900 tracking-tight">K{(b.finalAmount || 0).toLocaleString()}</span>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Total Invoice</span>
                          </div>
                        </td>
                        <td className="px-5 py-5 text-right">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-bold text-emerald-600 tracking-tight">K{(b.advancePaid || 0).toLocaleString()}</span>
                            <span className="text-[9px] font-bold text-emerald-500/60 uppercase tracking-widest">Paid (Advance)</span>
                          </div>
                        </td>
                        <td className="px-5 py-5 text-right">
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[13px] font-bold tracking-tight ${balance > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                                K{balance.toLocaleString()}
                              </span>
                              {isFullyPaid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                            </div>
                            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Outstanding</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
        <Link href="/dashboard/ledger" className="flex flex-col items-center gap-1 text-primary">
          <DollarSign className="w-5 h-5" />
          <span className="text-[8px] font-semibold uppercase tracking-tighter">Ledger</span>
        </Link>
        <div className="flex flex-col items-center gap-1 text-slate-300">
          <div className="w-5 h-5 rounded-md bg-slate-100" />
          <span className="text-[8px] font-semibold uppercase tracking-tighter">Acc</span>
        </div>
      </nav>
    </div>
  );
}
