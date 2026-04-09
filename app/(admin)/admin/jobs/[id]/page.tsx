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

  // Replicating mock data to ensure consistency with the listing page
  const allJobs = [
    { id: "FL-2851", client: "Dangote Cement", status: "In Transit", driver: "Adaeze O.", truckNumber: "KJA-442-XB", pickup: "Lagos Port Terminal A", dropoff: "Central Warehouse Abuja", cargo: "Industrial Cement", weight: "24 Tons", type: "transit" },
    { id: "FL-2847", client: "Coca Cola Co.", status: "Delivered", driver: "Kwame M.", truckNumber: "KJA-123-AA", pickup: "Nairobi Port", dropoff: "Mombasa Hub", cargo: "Soft Drinks", weight: "12 Tons", type: "success" },
    { id: "FL-2843", client: "Indomie Food", status: "Delayed", driver: "Fatima O.", truckNumber: "KJA-889-CC", pickup: "Cairo Factory", dropoff: "Alexandria Depot", cargo: "Noodles", weight: "8 Tons", type: "danger" },
    { id: "FL-2840", client: "Lafarge Holcim", status: "In Transit", driver: "John B.", truckNumber: "KJA-556-DD", pickup: "Accra Terminal", dropoff: "Kumasi Site", cargo: "Construction Gear", weight: "18 Tons", type: "transit" },
    { id: "FL-2838", client: "Total Energies", status: "Returned to Warehouse", driver: "Oluwaseun P.", truckNumber: "KJA-771-GH", pickup: "P.Harcourt Hub", dropoff: "Enugu Depot", cargo: "Petrochemicals", weight: "20 Tons", type: "warehouse" },
  ];

  // Find the specific job by ID (ignoring the '#' prefix if present)
  const jobIdClean = id?.replace("FL-", "") || "2851";
  const matchedJob = allJobs.find(j => j.id.includes(jobIdClean)) || allJobs[0];

  const job = {
    ...matchedJob,
    id: `#${matchedJob.id}`,
    truckHealth: "Excellent",
    schedule: "April 08, 2024 - 10:00 AM",
  };

  // State for job status and audit
  const [jobStatus, setJobStatus] = useState<string>(job.status);
  const [isAuditComplete, setIsAuditComplete] = useState(false);
  const [auditData, setAuditData] = useState({
    tireCheck: "",
    fastTagAmount: "",
    vehicleCondition: "",
    remarks: ""
  });

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

  const handleFinalizeJob = () => {
    if (!auditData.tireCheck || !auditData.fastTagAmount || !auditData.vehicleCondition) {
      alert("Please complete all audit checks before finalizing.");
      return;
    }
    setJobStatus("Fully Completed");
    setIsAuditComplete(true);
  };

  const statCards = [
    { label: "Fuel Total", value: `₦${calculations.fuelTotal.toLocaleString()}`, icon: <Fuel className="w-4 h-4 text-orange-500" />, color: "border-orange-500" },
    { label: "Other Logs", value: `₦${calculations.transactionTotal.toLocaleString()}`, icon: <Receipt className="w-4 h-4 text-blue-500" />, color: "border-blue-500" },
    { label: "Total Cost", value: `₦${calculations.totalTripCost.toLocaleString()}`, icon: <TrendingUp className="w-4 h-4 text-emerald-500" />, color: "border-emerald-500" },
    { label: "Trip Health", value: job.truckHealth, icon: <Truck className="w-4 h-4 text-slate-500" />, color: "border-slate-500" },
  ];

  return (
    <AdminLayout>
      <div className="bg-neutral-50 min-h-screen font-sans pb-10">
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
              <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                jobStatus === "Returned to Warehouse" ? "bg-indigo-50 text-indigo-600" : 
                jobStatus === "Fully Completed" ? "bg-emerald-50 text-emerald-600" :
                "bg-blue-50 text-blue-600"
              }`}>
                {jobStatus}
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
              {/* Trip Summary Card */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xs md:text-sm font-semibold text-slate-950">Trip Route History</h2>
                  <div className="px-2 md:px-3 py-1 rounded-full bg-slate-50 text-[8px] md:text-[9px] font-medium text-slate-400 uppercase tracking-wider">Completed Route</div>
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

              {/* Warehouse Audit Checklist - Only visible if Returned to Warehouse or already Audited */}
              {(jobStatus === "Returned to Warehouse" || isAuditComplete) && (
                <div className={`rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border ${
                  isAuditComplete ? "bg-emerald-50/20 border-emerald-100" : "bg-indigo-50/10 border-indigo-100"
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isAuditComplete ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                      }`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-xs md:text-sm font-semibold text-slate-950">Vehicle Return Audit</h2>
                        <p className="text-[8px] md:text-[10px] font-normal text-neutral-400 uppercase tracking-widest">Mandatory warehouse checkpoint</p>
                      </div>
                    </div>
                    {isAuditComplete && (
                      <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-500 text-white uppercase tracking-widest">Verified</span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {/* Tire Check */}
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Tire Condition Check</label>
                        <div className="flex gap-2">
                          {["Good", "Fair", "Needs Replacement"].map((status) => (
                            <button
                              key={status}
                              disabled={isAuditComplete}
                              onClick={() => setAuditData({...auditData, tireCheck: status})}
                              className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                                auditData.tireCheck === status 
                                  ? "bg-slate-900 text-white border-slate-900" 
                                  : "bg-white text-slate-400 border-neutral-100 hover:border-neutral-200"
                              } ${isAuditComplete && auditData.tireCheck !== status && "opacity-50"}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fast Tag Check */}
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Fast Tag Balance (₦)</label>
                        <input
                          type="number"
                          disabled={isAuditComplete}
                          placeholder="Enter remaining balance"
                          value={auditData.fastTagAmount}
                          onChange={(e) => setAuditData({...auditData, fastTagAmount: e.target.value})}
                          className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-slate-900 focus:border-indigo-200 outline-none transition-all disabled:bg-neutral-50 disabled:text-neutral-400"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Vehicle Condition */}
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Overall Vehicle Condition</label>
                        <div className="flex gap-2">
                          {["Pristine", "Minor Scratches", "Damaged"].map((status) => (
                            <button
                              key={status}
                              disabled={isAuditComplete}
                              onClick={() => setAuditData({...auditData, vehicleCondition: status})}
                              className={`flex-1 py-2 rounded-xl text-[10px] font-bold border transition-all ${
                                auditData.vehicleCondition === status 
                                  ? "bg-slate-900 text-white border-slate-900" 
                                  : "bg-white text-slate-400 border-neutral-100 hover:border-neutral-200"
                              } ${isAuditComplete && auditData.vehicleCondition !== status && "opacity-50"}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Remarks */}
                      <div>
                        <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-2">Audit Remarks</label>
                        <textarea
                          disabled={isAuditComplete}
                          placeholder="Describe any issues..."
                          value={auditData.remarks}
                          onChange={(e) => setAuditData({...auditData, remarks: e.target.value})}
                          className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[12px] font-medium text-slate-900 outline-none h-[72px] resize-none focus:border-indigo-200 transition-all disabled:bg-neutral-50 disabled:text-neutral-400"
                        />
                      </div>
                    </div>
                  </div>

                  {!isAuditComplete && (
                    <div className="mt-8 flex justify-end">
                      <button 
                        onClick={handleFinalizeJob}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98]"
                      >
                        Complete Audit & Finalize Job
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Expense History Table */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs md:text-sm font-semibold text-slate-950">Expense Analysis</h2>
                      <p className="text-[8px] md:text-[10px] font-normal text-neutral-400 uppercase tracking-widest">Fuel & operational costs log</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-3.5 bg-neutral-50/50 border border-neutral-100 rounded-xl hover:bg-neutral-50 transition-colors">
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
              {/* Financial Report Summary Card */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100 h-full">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-1.5 rounded-lg bg-orange-50 text-orange-600">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <h2 className="text-xs md:text-sm font-semibold text-slate-950">Job Settlement Summary</h2>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest">Allocation Money</span>
                      <span className="text-[11px] font-semibold text-slate-900">₦{Number(calcData.allocationMoney).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest">Total Expenses</span>
                      <span className="text-[11px] font-bold text-rose-500">- ₦{calculations.totalTripCost.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="py-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex flex-col">
                        <span className="text-[9px] md:text-[10px] font-medium text-neutral-400 uppercase tracking-widest">
                          Remaining Profit
                        </span>
                        <span className="text-[8px] font-normal text-neutral-300 italic">Pre-tax settlement</span>
                      </div>
                      <span className="text-base md:text-xl font-bold text-emerald-600">
                        ₦{(Number(calcData.allocationMoney) - calculations.totalTripCost).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className={`p-4 rounded-xl border transition-all ${
                    isAuditComplete ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isAuditComplete ? "bg-emerald-500 animate-pulse" : "bg-indigo-500"}`} />
                      <span className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Workflow Stage</span>
                    </div>
                    <p className="text-[10px] text-neutral-500 leading-relaxed">
                      {isAuditComplete 
                        ? "Job is fully finalized. All post-trip warehouse audits are verified and financial settlement is complete."
                        : "Job is currently in Warehouse Return stage. Please complete the vehicle audit checklist to finalize the records."}
                    </p>
                  </div>

                  {/* Route Map Preview */}
                  <div className="mt-4 rounded-xl border border-neutral-100 shadow-sm relative group overflow-hidden">
                    <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md border border-neutral-100 shadow-sm">
                      <div className="text-[8px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                        Live Route Map
                      </div>
                    </div>
                    <div className="h-[180px] bg-neutral-50 relative">
                      <img
                        src="/images/fleet-map.png"
                        alt="Trip Route"
                        className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform duration-700"
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

