"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  ArrowLeft,
  MapPin,
  Truck,
  Fuel,
  Receipt,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  CreditCard
} from "lucide-react";

export default function JobDetailReport() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Static high-fidelity data matching the screenshot
  const job = {
    id: `#FL-${id?.substring(id.length - 4).toUpperCase() || "2851"}`,
    driver: "ADAEZE O.",
    truckNumber: "KJA-442-XB",
    status: "IN TRANSIT",
    truckHealth: "Excellent",
    pickup: "Lagos Port Terminal A",
    dropoff: "Central Warehouse Abuja",
    cargo: "Industrial Cement",
    weight: "24 Tons",
  };

  const [jobStatus] = useState<string>(job.status);

  // Financial values matching screenshot 2
  const financialData = {
    fuelTotal: 169642857,
    otherLogs: 92500,
    totalCost: 262142857,
    allocationMoney: 850000000,
    remainingProfit: 587857143
  };

  const transactions = [
    { id: "1", description: "Tire Replacement at Lokoja", amount: 45000, category: "Repair", date: "April 08, 2024" },
    { id: "2", description: "Extra Fuel Top-up (50L)", amount: 32500, category: "Fuel", date: "April 09, 2024" },
  ];

  const statCards = [
    { label: "Fuel Total", value: `₦${financialData.fuelTotal.toLocaleString()}`, icon: <Fuel className="w-4 h-4 text-orange-500" />, color: "border-orange-500" },
    { label: "Other Logs", value: `₦${financialData.otherLogs.toLocaleString()}`, icon: <Receipt className="w-4 h-4 text-blue-500" />, color: "border-blue-500" },
    { label: "Total Cost", value: `₦${financialData.totalCost.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, color: "border-emerald-500" },
    { label: "Trip Health", value: job.truckHealth, icon: <Truck className="w-4 h-4 text-slate-500" />, color: "border-slate-500" },
  ];

  return (
    <AdminLayout>
      <div className="bg-neutral-50 min-h-screen font-sans pb-10">
        {/* Header */}
        <div className="bg-white border-b border-neutral-100 px-4 md:px-8 py-5 sticky top-0 z-20">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <button
                onClick={() => router.back()}
                className="w-9 h-9 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-all shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">{job.id}</h1>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest">
                    {job.driver}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-400 text-[9px] font-bold uppercase tracking-widest">
                    {job.truckNumber}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5 uppercase tracking-widest">
                  General Jobs <ChevronRight className="w-2.5 h-2.5" /> Final Report
                </p>
              </div>
            </div>

            <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] ${
              jobStatus === "IN TRANSIT" ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
            }`}>
              {jobStatus}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <div key={i} className={`bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 border-t-4 ${card.color}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-slate-50">
                    {card.icon}
                  </div>
                </div>
                <div className="text-[20px] font-bold text-slate-900 mb-1 leading-tight">{card.value}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Route History */}
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Trip Route History</h2>
                  <div className="px-3 py-1 rounded-full bg-slate-50 text-[9px] font-bold text-slate-300 uppercase tracking-widest border border-slate-100">Completed Route</div>
                </div>

                <div className="space-y-12">
                  <div className="relative">
                    <div className="absolute left-[15px] top-10 bottom-[-48px] w-px bg-slate-100 border-l border-dashed border-slate-300" />
                    <div className="flex gap-6 items-start relative z-10">
                      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-sm shadow-emerald-100">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                           ORIGIN / PICKUP
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">{job.pickup}</h3>
                        <div className="text-[11px] font-medium text-slate-400 italic">Departed: April 08, 09:45 AM</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6 items-start relative z-10">
                    <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100 shadow-sm shadow-rose-100">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                         DESTINATION / DROP-OFF
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mb-1">{job.dropoff}</h3>
                      <div className="text-[11px] font-medium text-slate-400 italic">Arrived: April 10, 02:30 PM</div>
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50 grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cargo</div>
                    <div className="text-[12px] font-bold text-slate-800">{job.cargo}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Weight</div>
                    <div className="text-[12px] font-bold text-slate-800">{job.weight}</div>
                  </div>
                  <div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Vehicle</div>
                    <div className="text-[12px] font-bold text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3" /> {job.truckHealth}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Completed</div>
                    <div className="text-[12px] font-bold text-slate-800 tracking-tight">2 days total</div>
                  </div>
                </div>
              </div>

              {/* Expense Analysis Section */}
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Expense Analysis</h2>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5 font-sans">Fuel & operational costs log</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-[20px] hover:bg-white hover:shadow-md hover:border-transparent transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 text-slate-300 flex items-center justify-center group-hover:text-primary transition-colors">
                          {t.category === 'Fuel' ? <Fuel className="w-4 h-4" /> : <Receipt className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-[13px] font-bold text-slate-900">{t.description}</div>
                          <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">{t.category} · {t.date}</div>
                        </div>
                      </div>
                      <div className="text-[14px] font-bold text-slate-900 tracking-tight">₦{t.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side Cards */}
            <div className="space-y-6">
              {/* Job Settlement Summary */}
              <div className="bg-white rounded-[24px] p-8 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-8">
                   <CreditCard className="w-5 h-5 text-orange-400" />
                   <h2 className="text-[12px] font-bold text-slate-900 uppercase tracking-[0.1em]">Job Settlement Summary</h2>
                </div>

                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Allocation Money</span>
                      <span className="text-[13px] font-bold text-slate-900">₦{financialData.allocationMoney.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Expenses</span>
                      <span className="text-[13px] font-bold text-rose-500">- ₦{financialData.totalCost.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Remaining Profit
                        </span>
                        <span className="text-[9px] font-medium text-slate-300 italic">Pre-tax settlement</span>
                      </div>
                      <span className="text-[24px] font-bold text-emerald-500 tracking-tighter">
                        ₦{financialData.remainingProfit.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Workflow Stage */}
                  <div className="p-5 rounded-[20px] bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Workflow Stage</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                       Job is currently in Warehouse Return stage. Please complete the vehicle audit checklist to finalize the records.
                    </p>
                  </div>

                  {/* Route Map Preview */}
                  <div className="rounded-2xl border border-slate-100 shadow-sm relative group overflow-hidden bg-slate-50 p-1">
                    <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
                      <div className="text-[9px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Route Map
                      </div>
                    </div>
                    <div className="h-[200px] rounded-xl overflow-hidden relative">
                      <img
                        src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=2074&auto=format&fit=crop"
                        alt="Trip Route"
                        className="w-full h-full object-cover opacity-80 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
