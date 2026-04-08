"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  ArrowLeft,
  MapPin,
  Truck,
  User,
  Fuel,
  Receipt,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  CreditCard,
  FileText
} from "lucide-react";

export default function JobDetailReport() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Mock data for the job - in a real app, this would be fetched based on ID
  const job = {
    id: id || "#FL-2851",
    client: "Dangote Cement",
    driver: "Adaeze O.",
    truckNumber: "KJA-442-XB",
    truckHealth: "Excellent",
    pickup: "Lagos Port Terminal A",
    dropoff: "Central Warehouse Abuja",
    cargo: "Industrial Cement",
    weight: "24 Tons",
    schedule: "April 08, 2024 - 10:00 AM",
    status: "Delivered",
  };

  // Mock data for financial report
  const [calcData] = useState({
    pickupKm: "450",
    pickupRate: "1250",
    dropoffKm: "120",
    dropoffRate: "1250",
    mileage: "4.2",
    allocationMoney: "850000",
  });

  const [transactions] = useState([
    { id: "1", description: "Tire Replacement at Lokoja", amount: 45000, category: "Repair", date: "April 08, 2024" },
    { id: "2", description: "Extra Fuel Top-up (50L)", amount: 32500, category: "Fuel", date: "April 09, 2024" },
    { id: "3", description: "Toll Gate Charges (Lagos-Ibadan)", amount: 15000, category: "Toll", date: "April 08, 2024" },
  ]);

  const calculations = useMemo(() => {
    const pKm = parseFloat(calcData.pickupKm) || 0;
    const pRate = parseFloat(calcData.pickupRate) || 0;
    const dKm = parseFloat(calcData.dropoffKm) || 0;
    const dRate = parseFloat(calcData.dropoffRate) || 0;
    const mil = parseFloat(calcData.mileage) || 1;

    const pAmt = (pKm / mil) * pRate;
    const dAmt = (dKm / mil) * dRate;
    const fuelTotal = pAmt + dAmt;

    const transactionTotal = transactions.reduce((acc, t) => acc + t.amount, 0);
    const totalTripCost = fuelTotal + transactionTotal;

    return {
      pickupAmount: pAmt,
      dropoffAmount: dAmt,
      fuelTotal,
      transactionTotal,
      totalTripCost,
    };
  }, [calcData, transactions]);

  const statCards = [
    { label: "Fuel Total", value: `₦${calculations.fuelTotal.toLocaleString()}`, icon: <Fuel className="w-4 h-4 text-orange-500" />, color: "border-orange-500" },
    { label: "Other Logs", value: `₦${calculations.transactionTotal.toLocaleString()}`, icon: <Receipt className="w-4 h-4 text-blue-500" />, color: "border-blue-500" },
    { label: "Total Cost", value: `₦${calculations.totalTripCost.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, color: "border-emerald-500" },
    { label: "Trip Health", value: job.truckHealth, icon: <Truck className="w-4 h-4 text-slate-500" />, color: "border-slate-500" },
  ];

  return (
    <AdminLayout>
      <div className="bg-neutral-50 min-h-screen font-sans">
        {/* Header */}
        <div className="bg-white border-b border-neutral-100 px-4 md:px-8 py-3 md:py-5 sticky top-0 z-20">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-5">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 transition-all shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-0.5">
                  <h1 className="text-md md:text-xl font-semibold text-slate-900 tracking-tight">{job.id}</h1>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[8px] md:text-[9px] font-medium uppercase tracking-widest">
                    {job.driver}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-400 text-[8px] md:text-[9px] font-medium uppercase tracking-widest">
                    {job.truckNumber}
                  </span>
                </div>
                <p className="text-[9px] md:text-[11px] font-normal text-neutral-400 flex items-center gap-1.5">
                  General Jobs <ChevronRight className="w-2.5 h-2.5" /> Final Report
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex-1 md:flex-none px-4 md:px-5 py-1.5 md:py-2 rounded-lg border border-neutral-200 text-slate-600 text-[10px] font-semibold uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center justify-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Export PDF
              </button>
              <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">
                Delivered
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-[1280px] mx-auto space-y-4 md:space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {statCards.map((card, i) => (
              <div key={i} className={`bg-white rounded-xl md:rounded-2xl p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border-t-2 ${card.color}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1 px-1.5 rounded-lg bg-neutral-50 shrink-0">
                    {card.icon}
                  </div>
                </div>
                <div className="text-sm md:text-lg font-semibold text-slate-900 mb-0.5">{card.value}</div>
                <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Trip Address Details */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs md:text-sm font-semibold text-slate-950">Trip Summary Report</h2>
                  <div className="px-2 md:px-3 py-1 rounded-full bg-slate-50 text-[8px] md:text-[9px] font-medium text-slate-400 uppercase tracking-wider">Completed Trip</div>
                </div>

                <div className="space-y-6 md:space-y-10">
                  <div className="relative">
                    <div className="absolute left-4 md:left-4.5 top-8 md:top-8 bottom-0 w-0.5 bg-neutral-50 border-l-2 border-dashed border-neutral-200 -mb-6 md:-mb-10" />
                    <div className="flex gap-4 md:gap-5 items-start relative z-10">
                      <div className="w-8 h-8 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1 font-sans">ORIGIN / PICKUP</div>
                        <h3 className="text-sm md:text-base font-semibold text-slate-900 leading-tight mb-1 wrap-break-word">{job.pickup}</h3>
                        <div className="text-[9px] md:text-[10px] font-normal text-neutral-400">Departed: April 08, 09:45 AM</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 md:gap-5 items-start relative z-10">
                    <div className="w-8 h-8 rounded-lg md:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1 font-sans">DESTINATION / DROP-OFF</div>
                      <h3 className="text-sm md:text-base font-semibold text-slate-900 leading-tight mb-1 wrap-break-word">{job.dropoff}</h3>
                      <div className="text-[9px] md:text-[10px] font-normal text-neutral-400">Arrived: April 10, 02:30 PM</div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 md:mt-10 pt-6 border-t border-neutral-50 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                  <div>
                    <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-0.5">Cargo</div>
                    <div className="text-xs md:text-sm font-medium text-slate-800">{job.cargo}</div>
                  </div>
                  <div>
                    <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-0.5">Weight</div>
                    <div className="text-xs md:text-sm font-medium text-slate-800">{job.weight}</div>
                  </div>
                  <div>
                    <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-0.5">Vehicle</div>
                    <div className="text-xs md:text-sm font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {job.truckHealth}
                    </div>
                  </div>
                  <div className="md:flex md:flex-col md:items-end">
                    <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-0.5">Completed</div>
                    <div className="text-xs md:text-sm font-medium text-slate-800">2 days total</div>
                  </div>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs md:text-sm font-semibold text-slate-950">Expense History</h2>
                      <p className="text-[8px] md:text-[10px] font-normal text-neutral-400 uppercase tracking-widest">Formal transaction records</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3.5 bg-neutral-50/50 border border-neutral-100 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white border border-neutral-100 text-slate-400">
                          {t.category === 'Fuel' ? <Fuel className="w-3.5 h-3.5" /> : <Receipt className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <div className="text-[11px] md:text-[12px] font-semibold text-slate-900">{t.description}</div>
                          <div className="text-[9px] font-normal text-neutral-400 uppercase tracking-widest">{t.category} · {t.date}</div>
                        </div>
                      </div>
                      <div className="text-[12px] md:text-[13px] font-bold text-slate-900">₦{t.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6 lg:h-full">
              {/* Trip Cost Summary Card */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100 h-full">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-1.5 rounded-lg bg-orange-50 text-orange-600">
                      <Fuel className="w-3.5 h-3.5" />
                    </div>
                    <h2 className="text-xs md:text-sm font-semibold text-slate-950">Financial Report</h2>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest">Calculated Fuel</span>
                      <span className="text-[11px] font-semibold text-slate-900">₦{calculations.fuelTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest">Additional Logs</span>
                      <span className="text-[11px] font-semibold text-slate-900">₦{calculations.transactionTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="py-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] md:text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                          Total Trip Expenditure
                        </span>
                        <span className="text-[8px] font-normal text-neutral-300 italic">Net Company Cost</span>
                      </div>
                      <span className="text-base md:text-xl font-bold text-slate-950">
                        ₦{calculations.totalTripCost.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Final Status</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      This trip has been marked as completed. All expenses have been verified and the final settlement is processed.
                    </p>
                  </div>

                  {/* Route Map Integration */}
                  <div className="mt-4 rounded-xl border border-neutral-100 overflow-hidden shadow-sm relative group">
                    <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md border border-neutral-100 shadow-sm">
                      <div className="text-[8px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Route Breakdown
                      </div>
                    </div>
                    <div className="h-[180px] bg-neutral-50 relative">
                      <img
                        src="/images/fleet-map.png"
                        alt="Trip Route"
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-neutral-900/5 group-hover:bg-transparent transition-colors" />
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
