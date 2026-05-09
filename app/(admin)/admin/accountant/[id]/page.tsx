"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  ArrowLeft,
  Fuel,
  MapPin,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { assignmentService } from "@/services/assignmentService";
import { settlementService } from "@/services/settlementService";

export default function AccountantJobDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [jobData, setJobData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [jobSettlement, setJobSettlement] = useState<any>(null);

  // Local state for calculations - Using clear naming
  const [calcData, setCalcData] = useState({
    pickupKm: "200",
    pickupMileage: "4", // KM/L
    dropoffKm: "350",
    dropoffMileage: "4", // KM/L
    fuelRate: "100", // ₦/L
    allocationMoney: ""
  });


  useEffect(() => {
    if (id) {
      loadJobDetails();
    }
  }, [id]);

  // Calculation logic: Fuel estimate + Cash allocation
  const calculations = useMemo(() => {
    const pKm = parseFloat(calcData.pickupKm) || 0;
    const pMileage = parseFloat(calcData.pickupMileage) || 1;
    const dKm = parseFloat(calcData.dropoffKm) || 0;
    const dMileage = parseFloat(calcData.dropoffMileage) || 1;
    const fuelRate = parseFloat(calcData.fuelRate) || 0;
    const cashAllocation = parseFloat(calcData.allocationMoney) || 0;

    const pLiters = pKm / pMileage;
    const pAmount = pLiters * fuelRate;

    const dLiters = dKm / dMileage;
    const dAmount = dLiters * fuelRate;

    const fuelTotal = Math.round(pAmount + dAmount);

    return {
      pickupLiters: pLiters.toFixed(1),
      pickupAmount: Math.round(pAmount),
      dropoffLiters: dLiters.toFixed(1),
      dropoffAmount: Math.round(dAmount),
      totalLiters: (pLiters + dLiters).toFixed(1),
      fuelTotal,
      grandTotal: fuelTotal + Math.round(cashAllocation)
    };
  }, [calcData]);

  const loadJobDetails = async () => {
    try {
      setIsLoading(true);
      const bookingId = (Array.isArray(id) ? id[0] : id) as string;
      if (!bookingId) return;

      const [data, assignment, settlement] = await Promise.all([
        bookingService.getById(bookingId),
        assignmentService.getByBookingId(bookingId),
        settlementService.getByBookingId(bookingId)
      ]);

      setJobData({ ...data, assignment });
      setJobSettlement(settlement);

      if (settlement) {
        setIsApproved(true);
        setCalcData({
          pickupKm: settlement.fuelDetails.pickupKm.toString(),
          pickupMileage: settlement.fuelDetails.pickupMileage.toString(),
          dropoffKm: settlement.fuelDetails.dropoffKm.toString(),
          dropoffMileage: settlement.fuelDetails.dropoffKm.toString(),
          fuelRate: settlement.fuelDetails.fuelRate.toString(),
          allocationMoney: settlement.financials.advancePaid.toString()
        });
      } else if (data.advancePaid) {
        setCalcData(prev => ({ ...prev, allocationMoney: data.advancePaid.toString() }));
      }
    } catch (error) {
      console.error("Failed to load job details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessSettlement = async (silent = false) => {
    if (!calcData.allocationMoney) {
      alert("Please enter the Cash Allocation amount");
      return;
    }
    try {
      const bookingId = (Array.isArray(id) ? id[0] : id) as string;
      if (!jobData?.assignment || (!jobData.assignment._id && !jobData.assignment.driverName)) {
        alert("Assignment details not found. Please assign a fleet unit first.");
        return;
      }

      const settlementPayload = {
        bookingId,
        assignmentId: jobData.assignment._id,
        fuelDetails: {
          pickupKm: Number(calcData.pickupKm),
          pickupMileage: Number(calcData.pickupMileage),
          dropoffKm: Number(calcData.dropoffKm),
          dropoffMileage: Number(calcData.dropoffMileage),
          fuelRate: Number(calcData.fuelRate)
        },
        expenses: jobSettlement?.expenses || [], // Preserving existing operational expenses
        financials: {
          advancePaid: Number(calcData.allocationMoney),
          grandTotal: calculations.grandTotal
        }
      };

      await settlementService.process(settlementPayload);

      // Also update booking status if needed (optional but good for consistency)
      await bookingService.updateStatus(bookingId, "finalized", {
        advancePaid: Number(calcData.allocationMoney),
        finalAmount: calculations.grandTotal
      });

      if (!silent) {
        alert("Trip approved successfully!");
        setIsApproved(true);
        router.push("/admin/accountant");
      }
    } catch (error) {
      console.error("Failed to approve trip:", error);
      if (!silent) alert("Error approving trip");
    }
  };

  // Data mapping for the specific job
  const jobIdStr = Array.isArray(id) ? id[0] : id;
  const job = jobData ? {
    id: jobData.jobId || `#JOB-${jobData._id.substring(jobData._id.length - 6).toUpperCase()}`,
    status: jobData.status,
    client: jobData.clientId?.name || "N/A",
    company: jobData.clientId?.company?.companyName || "Direct Booking",
    driver: jobData.assignment?.driverName || "Unassigned",
    truckNumber: jobData.assignment?.truckNumber || "N/A",
    truckHealth: jobData.assignment?.truckHealth || "Good",
    pickup: `${jobData.pickup?.address?.city}, ${jobData.pickup?.address?.street}`,
    dropoff: `${jobData.dropoff?.address?.city}, ${jobData.dropoff?.address?.street}`,
    contact: jobData.pickup?.contactNumber || "N/A",
    cargo: jobData.cargoDetails?.goodsType || "N/A",
    weight: `${jobData.cargoDetails?.weight || 0} kg`,
    schedule: jobData.cargoDetails?.loadingDate || "N/A"
  } : {
    id: `#${jobIdStr?.toUpperCase() || "JOB-4005"}`,
    status: "Loading...",
    client: "Loading...",
    driver: "Loading...",
    truckNumber: "Loading...",
    truckHealth: "---",
    pickup: "Loading...",
    dropoff: "Loading...",
    contact: "---",
    cargo: "---",
    weight: "---",
    schedule: "---"
  };

  const statCards = [
    { label: "Est. Fuel Cost", value: `₦${calculations.fuelTotal.toLocaleString()}`, icon: <Fuel className="w-4 h-4 text-amber-500" />, color: "border-amber-500" },
    { label: "Cash Allocation", value: calcData.allocationMoney ? `₦${parseFloat(calcData.allocationMoney).toLocaleString()}` : "---", icon: <DollarSign className="w-4 h-4 text-blue-500" />, color: "border-blue-500" },
  ];

  return (
    <AdminLayout>
      <div className="bg-neutral-50 min-h-screen font-sans">
        {/* Header */}
        <div className="bg-white border-b border-neutral-100 px-4 md:px-8 py-3 md:py-5 sticky top-0 z-20">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-5">
              <button onClick={() => router.back()} className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:text-primary transition-all shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <div className="flex items-center gap-2 md:gap-3 mb-0.5">
                  <h1 className="text-md md:text-xl font-semibold text-slate-900 tracking-tight">{job.id}</h1>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[8px] md:text-[9px] font-bold uppercase tracking-widest">{job.company}</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[8px] md:text-[9px] font-medium uppercase tracking-widest">{job.driver}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white border border-neutral-200 text-neutral-400 text-[8px] md:text-[9px] font-medium uppercase tracking-widest">{job.truckNumber}</span>
                </div>
                <p className="text-[9px] md:text-[11px] font-normal text-neutral-400 flex items-center gap-1.5">
                  Accountant <ChevronRight className="w-2.5 h-2.5" /> Settlement Ledger
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isApproved ? (
                <div className="px-5 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                </div>
              ) : (
                <button onClick={() => handleProcessSettlement(false)} className="flex-1 md:flex-none px-4 md:px-5 py-1.5 md:py-2 rounded-lg bg-slate-900 text-white text-[10px] md:text-[10px] font-semibold uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve Trip
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-[1280px] mx-auto space-y-4 md:space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {statCards.map((card, i) => (
              <div key={i} className={`bg-white rounded-xl md:rounded-2xl p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border-t-2 ${card.color} transition-transform hover:-translate-y-1`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1 px-1.5 rounded-lg bg-neutral-50 shrink-0">{card.icon}</div>
                </div>
                <div className="text-sm md:text-lg font-semibold text-slate-900 mb-0.5">{card.value}</div>
                <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <h2 className="text-xs md:text-sm font-semibold text-slate-950">Trip Address Details</h2>
                  <div className="px-2 md:px-3 py-1 rounded-full bg-emerald-50 text-[8px] md:text-[9px] font-medium text-emerald-600 uppercase tracking-wider">Live Route</div>
                </div>
                <div className="space-y-6 md:space-y-10">
                  <div className="relative">
                    <div className="absolute left-4 md:left-4.5 top-8 md:top-8 bottom-0 w-0.5 bg-neutral-50 border-l-2 border-dashed border-neutral-200 -mb-6 md:-mb-10" />
                    <div className="flex gap-4 md:gap-5 items-start relative z-10">
                      <div className="w-8 h-8 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 md:w-4.5 md:h-4.5" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1 font-sans">ORIGIN / PICKUP</div>
                        <h3 className="text-sm md:text-base font-semibold text-slate-900 leading-tight mb-1 md:mb-1.5 wrap-break-words">{job.pickup}</h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                          <span className="text-[9px] md:text-[10px] font-normal text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md">Expected: 10:00 AM</span>
                          <span className="text-[9px] md:text-[10px] font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 md:gap-5 items-start relative z-10">
                    <div className="w-8 h-8 rounded-lg md:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4 md:w-4.5 md:h-4.5" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1 font-sans">DESTINATION / DROP-OFF</div>
                      <h3 className="text-sm md:text-base font-semibold text-slate-900 leading-tight mb-1 md:mb-1.5 wrap-break-words">{job.dropoff}</h3>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3"><span className="text-[9px] md:text-[10px] font-normal text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md">Dist: {calcData.dropoffKm} KM Away</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash Allocation - Food & Other Expenses */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-1.5 rounded-lg bg-blue-50 text-blue-600"><DollarSign className="w-3.5 h-3.5" /></div>
                    <div>
                      <h2 className="text-xs md:text-sm font-semibold text-slate-950">Cash Allocation</h2>
                      <p className="text-[8px] md:text-[9px] font-normal text-neutral-400 uppercase tracking-widest">Food & Other Expenses</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-blue-50/30 border border-blue-100/50 mb-4">
                  <p className="text-[10px] font-medium text-blue-700 leading-relaxed">This amount is given to the driver for food, lodging, tolls and other miscellaneous expenses during the trip. This is <strong>not</strong> for fuel/petrol.</p>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest font-sans ml-1">Allocation Amount (₦)</label>
                  <input type="number" value={calcData.allocationMoney} onChange={(e) => setCalcData({ ...calcData, allocationMoney: e.target.value })} placeholder="0.00" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl py-3 px-4 text-sm font-bold text-slate-900 outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-neutral-300" />
                </div>

              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-1.5 rounded-lg bg-orange-50 text-orange-600"><Fuel className="w-3.5 h-3.5" /></div>
                    <h2 className="text-xs md:text-sm font-semibold text-slate-950">Fuel Estimate</h2>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-amber-50 text-[8px] md:text-[9px] font-medium text-amber-600 uppercase tracking-widest">Auto Calc</div>
                </div>

                <div className="space-y-4 md:space-y-5">
                  {/* Pickup Section */}
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-medium text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 font-sans"><MapPin className="w-2.5 h-2.5" /> Pickup Path</span>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] md:text-[11px] font-bold text-slate-950">₦{calculations.pickupAmount.toLocaleString()}</span>
                        <span className="text-[8px] font-bold text-emerald-600 uppercase">{calculations.pickupLiters}L used</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Distance (KM)</label>
                        <input type="number" value={calcData.pickupKm} onChange={(e) => setCalcData({ ...calcData, pickupKm: e.target.value })} className="w-full bg-white border border-neutral-100 rounded-lg py-1.5 px-3 text-[11px] font-semibold text-slate-900 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Mileage (KM/L)</label>
                        <input type="number" value={calcData.pickupMileage} onChange={(e) => setCalcData({ ...calcData, pickupMileage: e.target.value })} className="w-full bg-white border border-neutral-100 rounded-lg py-1.5 px-3 text-[11px] font-semibold text-slate-900 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Dropoff Section */}
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-medium text-rose-700 uppercase tracking-widest flex items-center gap-1.5 font-sans"><MapPin className="w-2.5 h-2.5" /> Drop Path</span>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] md:text-[11px] font-bold text-slate-950">₦{calculations.dropoffAmount.toLocaleString()}</span>
                        <span className="text-[8px] font-bold text-rose-600 uppercase">{calculations.dropoffLiters}L used</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Distance (KM)</label>
                        <input type="number" value={calcData.dropoffKm} onChange={(e) => setCalcData({ ...calcData, dropoffKm: e.target.value })} className="w-full bg-white border border-neutral-100 rounded-lg py-1.5 px-3 text-[11px] font-semibold text-slate-900 outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Mileage (KM/L)</label>
                        <input type="number" value={calcData.dropoffMileage} onChange={(e) => setCalcData({ ...calcData, dropoffMileage: e.target.value })} className="w-full bg-white border border-neutral-100 rounded-lg py-1.5 px-3 text-[11px] font-semibold text-slate-900 outline-none" />
                      </div>
                    </div>
                  </div>

                  {/* Shared Settings */}
                  <div className="px-1 py-1 flex items-center justify-between border-b border-neutral-50 pb-3">
                    <label className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest font-sans flex items-center gap-1.5"><Fuel className="w-3 h-3" /> Fuel Rate (₦/L)</label>
                    <div className="flex items-center gap-2">
                      <input type="number" value={calcData.fuelRate} onChange={(e) => setCalcData({ ...calcData, fuelRate: e.target.value })} className="w-16 bg-neutral-50 border-b-2 border-emerald-500/30 text-[11px] font-bold text-emerald-700 text-right outline-none pr-1 focus:border-emerald-500 transition-all" />
                    </div>
                  </div>

                  {/* Fuel Summary */}
                  <div className="py-4 border-t border-neutral-100 bg-amber-50/30 rounded-xl px-4 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest font-sans">Est. Fuel Cost</span>
                        <span className="text-[8px] font-bold text-amber-600 uppercase">{calculations.totalLiters}L total fuel</span>
                      </div>
                      <span className="text-base md:text-xl font-bold text-amber-600">₦{calculations.fuelTotal.toLocaleString()}</span>
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
