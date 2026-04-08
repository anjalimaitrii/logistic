"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  ArrowLeft,
  Truck,
  Fuel,
  MapPin,
  User,
  Check,
  Clock,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Activity,
  DollarSign,
  Plus,
  Trash2,
  Receipt,
  Settings
} from "lucide-react";

export default function AccountantJobDetail() {
  const router = useRouter();
  const { id } = useParams();

  // Local state for calculations - Split into Pickup & Dropoff
  const [calcData, setCalcData] = useState({
    pickupKm: "280",
    pickupRate: "1200",
    dropoffKm: "350",
    dropoffRate: "1200",
    mileage: "4",
    allocationMoney: ""
  });

  // State for additional transactions/expenses
  const [transactions, setTransactions] = useState<any[]>([]);
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    category: "Other"
  });

  const handleAddTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount) return;

    const id = Math.random().toString(36).substr(2, 9);
    setTransactions([...transactions, {
      id,
      date: new Date().toLocaleDateString(),
      ...newTransaction,
      amount: parseFloat(newTransaction.amount)
    }]);

    setNewTransaction({ description: "", amount: "", category: "Other" });
  };

  const removeTransaction = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  // Auto-calculation logic for both phases
  const calculations = useMemo(() => {
    const pKm = parseFloat(calcData.pickupKm) || 0;
    const pMileage = parseFloat(calcData.pickupRate) || 1; // Now phase-specific mileage
    const dKm = parseFloat(calcData.dropoffKm) || 0;
    const dMileage = parseFloat(calcData.dropoffRate) || 1; // Now phase-specific mileage
    const fuelRate = parseFloat(calcData.mileage) || 0; // Now the shared fuel rate (₦/L)

    const pLiters = pKm / pMileage;
    const pAmount = pLiters * fuelRate;

    const dLiters = dKm / dMileage;
    const dAmount = dLiters * fuelRate;

    const transactionTotal = transactions.reduce((sum, t) => sum + t.amount, 0);

    return {
      pickupLiters: pLiters.toFixed(2),
      pickupAmount: Math.round(pAmount),
      dropoffLiters: dLiters.toFixed(2),
      dropoffAmount: Math.round(dAmount),
      totalLiters: (pLiters + dLiters).toFixed(2),
      fuelTotal: Math.round(pAmount + dAmount),
      transactionTotal,
      grandTotal: Math.round(pAmount + dAmount + transactionTotal)
    };
  }, [calcData, transactions]);

  // Mock data for the specific job
  const jobIdStr = Array.isArray(id) ? id[0] : id;
  const job = {
    id: `#${jobIdStr?.toUpperCase() || "JOB-4005"}`,
    status: "Assigned",
    client: "Dangote Cement",
    driver: "Adaeze Okafor",
    truckNumber: "TRK-2201",
    truckHealth: "Excellent",
    pickup: "Lagos Business Hub, Marina",
    dropoff: "Central Park Plaza, Abuja",
    contact: "+234 812 345 6789",
    cargo: "Electronics (Fragile)",
    weight: "5,000 kg",
    schedule: "April 8th, 2026 - 10:00 AM"
  };

  const statCards = [
    { label: "Fuel Allocation", value: `₦${calculations.fuelTotal.toLocaleString()}`, icon: <Fuel className="w-4 h-4 text-amber-500" />, color: "border-amber-500" },
    { label: "Other Expenses", value: `₦${calculations.transactionTotal.toLocaleString()}`, icon: <Receipt className="w-4 h-4 text-blue-500" />, color: "border-blue-500" },
    { label: "Grand Total", value: `₦${calculations.grandTotal.toLocaleString()}`, icon: <DollarSign className="w-4 h-4 text-emerald-500" />, color: "border-emerald-500" },
    { label: "Driver Cash", value: calcData.allocationMoney ? `₦${parseFloat(calcData.allocationMoney).toLocaleString()}` : "---", icon: <TrendingUp className="w-4 h-4 text-primary" />, color: "border-primary" },
  ];

  return (
    <AdminLayout>
      <div className="bg-neutral-50 min-h-screen font-sans">
        {/* Header - Fund Flick Style */}
        <div className="bg-white border-b border-neutral-100 px-4 md:px-8 py-3 md:py-5 sticky top-0 z-20">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 md:gap-5">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-neutral-100 flex items-center justify-center text-neutral-400 hover:bg-neutral-50 hover:text-primary transition-all shrink-0"
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
                  Accountant <ChevronRight className="w-2.5 h-2.5" /> Settlement Ledger
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="flex-1 md:flex-none px-4 md:px-5 py-1.5 md:py-2 rounded-lg bg-slate-900 text-white text-[10px] md:text-[10px] font-semibold uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Trip
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 max-w-[1280px] mx-auto space-y-4 md:space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {statCards.map((card, i) => (
              <div key={i} className={`bg-white rounded-xl md:rounded-2xl p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border-t-2 ${card.color} transition-transform hover:-translate-y-1`}>
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
            {/* Left Column: Information */}
            <div className="lg:col-span-2 space-y-6">
              {/* Job Info Section */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <h2 className="text-xs md:text-sm font-semibold text-slate-950">Trip Address Details</h2>
                  <div className="px-2 md:px-3 py-1 rounded-full bg-emerald-50 text-[8px] md:text-[9px] font-medium text-emerald-600 uppercase tracking-wider">Live Route</div>
                </div>

                <div className="space-y-6 md:space-y-10">
                  <div className="relative">
                    {/* Vertical line connecting locations */}
                    <div className="absolute left-4 md:left-4.5 top-8 md:top-8 bottom-0 w-0.5 bg-neutral-50 border-l-2 border-dashed border-neutral-200 -mb-6 md:-mb-10" />

                    <div className="flex gap-4 md:gap-5 items-start relative z-10">
                      <div className="w-8 h-8 rounded-lg md:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 md:w-4.5 md:h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1 font-sans">ORIGIN / PICKUP</div>
                        <h3 className="text-sm md:text-base font-semibold text-slate-900 leading-tight mb-1 md:mb-1.5 break-words">{job.pickup}</h3>
                        <div className="flex flex-wrap items-center gap-2 md:gap-3">
                          <span className="text-[9px] md:text-[10px] font-normal text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md">Expected: 10:00 AM</span>
                          <span className="text-[9px] md:text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Ready
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 md:gap-5 items-start relative z-10">
                    <div className="w-8 h-8 rounded-lg md:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 md:w-4.5 md:h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-1 font-sans">DESTINATION / DROP-OFF</div>
                      <h3 className="text-sm md:text-base font-semibold text-slate-900 leading-tight mb-1 md:mb-1.5 break-words">{job.dropoff}</h3>
                      <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <span className="text-[9px] md:text-[10px] font-normal text-neutral-500 bg-neutral-50 px-2 py-0.5 rounded-md">Dist: {calcData.dropoffKm} KM Away</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 md:mt-10 pt-6 md:pt-6 border-t border-neutral-50 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                  <div>
                    <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-0.5">Cargo Type</div>
                    <div className="text-xs md:text-sm font-medium text-slate-800">{job.cargo}</div>
                  </div>
                  <div>
                    <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-0.5">Goods Weight</div>
                    <div className="text-xs md:text-sm font-medium text-slate-800">{job.weight}</div>
                  </div>
                  <div>
                    <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-0.5">Vehicle Health</div>
                    <div className="text-xs md:text-sm font-medium text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-2.5 h-2.5" /> {job.truckHealth}
                    </div>
                  </div>
                  <div className="md:flex md:flex-col md:items-end">
                    <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-0.5">Trip Schedule</div>
                    <div className="text-xs md:text-sm font-medium text-slate-800">{job.schedule.split(' - ')[0]}</div>
                  </div>
                </div>
              </div>

              {/* Transaction Ledger Section */}
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <Receipt className="w-4 h-4 md:w-4.5 md:h-4.5" />
                    </div>
                    <div>
                      <h2 className="text-xs md:text-sm font-semibold text-slate-950">Expense Ledger</h2>
                      <p className="text-[8px] md:text-[10px] font-normal text-neutral-400 uppercase tracking-widest">Ongoing transaction history</p>
                    </div>
                  </div>
                  <div className="flex md:flex-col justify-between items-center md:items-end bg-neutral-50 md:bg-transparent p-2.5 px-3 md:p-0 rounded-xl">
                    <div className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-0.5">Total Extra</div>
                    <div className="text-sm md:text-base font-semibold text-slate-950">₦{calculations.transactionTotal.toLocaleString()}</div>
                  </div>
                </div>

                {/* Form to add transaction */}
                <div className="p-4 md:p-5 bg-neutral-50/50 rounded-xl md:rounded-2xl border border-neutral-100 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-4">
                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Description</label>
                      <input
                        type="text"
                        value={newTransaction.description}
                        onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                        placeholder="e.g. Toll Gate, Repair..."
                        className="w-full bg-white border border-neutral-200 rounded-lg py-2 px-3 text-[11px] md:text-[12px] font-normal outline-none focus:border-slate-400 transition-all font-sans"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Amount (₦)</label>
                      <input
                        type="number"
                        value={newTransaction.amount}
                        onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full bg-white border border-neutral-200 rounded-lg py-2 px-3 text-[11px] md:text-[12px] font-semibold text-slate-900 outline-none focus:border-slate-400 transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Category</label>
                      <select
                        value={newTransaction.category}
                        onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                        className="w-full bg-white border border-neutral-200 rounded-lg py-2 px-3 text-[11px] md:text-[12px] font-medium text-slate-900 outline-none focus:border-slate-400 transition-all"
                      >
                        <option value="Fuel">Fuel</option>
                        <option value="Repair">Repair</option>
                        <option value="Toll">Tolls</option>
                        <option value="Food">Food</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
                    <button
                      onClick={handleAddTransaction}
                      className="px-4 py-2 bg-white border border-neutral-200 text-slate-700 rounded-lg text-[9px] md:text-[10px] font-semibold uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <Plus className="w-3 h-3" /> Add More
                    </button>
                    <button
                      onClick={handleAddTransaction}
                      className="px-6 py-2 bg-slate-900 text-white rounded-lg text-[9px] md:text-[10px] font-semibold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                      <Check className="w-3 h-3" /> Save Expense
                    </button>
                  </div>
                </div>

                {/* Transaction List */}
                <div className="space-y-3">
                  {transactions.length === 0 ? (
                    <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-neutral-100 rounded-2xl text-neutral-300">
                      <Activity className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-[10px] uppercase tracking-[0.2em] font-bold">No Records Yet</p>
                    </div>
                  ) : (
                    transactions.map((t) => (
                      <div key={t.id} className="group flex items-center justify-between p-3.5 bg-white border border-neutral-100 rounded-xl hover:border-slate-200 transition-all shadow-sm overflow-hidden relative">
                        <div className="flex items-center gap-3 relative z-10">
                          <div className="p-2 rounded-lg bg-neutral-50 text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                            {t.category === 'Fuel' ? <Fuel className="w-3.5 h-3.5" /> :
                              t.category === 'Repair' ? <Settings className="w-3.5 h-3.5" /> :
                                <Receipt className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="text-[11px] md:text-[12px] font-semibold text-slate-900">{t.description}</div>
                            <div className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest">{t.category} · {t.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 relative z-10">
                          <div className="text-[12px] md:text-[13px] font-bold text-slate-900 tracking-tight">₦{t.amount.toLocaleString()}</div>
                          <button
                            onClick={() => removeTransaction(t.id)}
                            className="p-1.5 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {/* Subtle background decoration */}
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-neutral-100 group-hover:bg-primary transition-all" />
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Spacing for layout balance */}
              <div className="hidden lg:block h-px" />
            </div>

            <div className="space-y-4 md:space-y-6 lg:h-full">
              <div className="bg-white rounded-2xl md:rounded-[24px] p-5 md:p-6 shadow-sm border border-neutral-100 h-full">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div className="flex items-center gap-2">
                    <div className="p-1 px-1.5 rounded-lg bg-orange-50 text-orange-600">
                      <Fuel className="w-3.5 h-3.5" />
                    </div>
                    <h2 className="text-xs md:text-sm font-semibold text-slate-950">Trip Summary</h2>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-slate-100 text-[8px] md:text-[9px] font-medium text-slate-600 uppercase tracking-widest">Calc Live</div>
                </div>

                <div className="space-y-4 md:space-y-5">
                  {/* Pickup Section */}
                  <div className="p-4 rounded-xl md:rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-medium text-emerald-700 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                        <MapPin className="w-2.5 h-2.5" /> Pickup Path
                      </span>
                      <span className="text-[10px] md:text-[11px] font-semibold text-slate-950">₦{calculations.pickupAmount.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Distance</label>
                        <input
                          type="number"
                          value={calcData.pickupKm}
                          onChange={(e) => setCalcData({ ...calcData, pickupKm: e.target.value })}
                          className="w-full bg-white border border-neutral-100 rounded-lg py-1.5 px-3 text-[11px] font-semibold text-slate-900 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Mileage</label>
                        <input
                          type="number"
                          value={calcData.pickupRate}
                          onChange={(e) => setCalcData({ ...calcData, pickupRate: e.target.value })}
                          placeholder="KM/L"
                          className="w-full bg-white border border-neutral-100 rounded-lg py-1.5 px-3 text-[11px] font-semibold text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Dropoff Section */}
                  <div className="p-4 rounded-xl md:rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[9px] font-medium text-rose-700 uppercase tracking-widest flex items-center gap-1.5 font-sans">
                        <MapPin className="w-2.5 h-2.5" /> Drop Path
                      </span>
                      <span className="text-[10px] md:text-[11px] font-semibold text-slate-950">₦{calculations.dropoffAmount.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Distance</label>
                        <input
                          type="number"
                          value={calcData.dropoffKm}
                          onChange={(e) => setCalcData({ ...calcData, dropoffKm: e.target.value })}
                          className="w-full bg-white border border-neutral-100 rounded-lg py-1.5 px-3 text-[11px] font-semibold text-slate-900 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] font-medium text-neutral-400 uppercase tracking-widest ml-1 font-sans">Mileage</label>
                        <input
                          type="number"
                          value={calcData.dropoffRate}
                          onChange={(e) => setCalcData({ ...calcData, dropoffRate: e.target.value })}
                          placeholder="KM/L"
                          className="w-full bg-white border border-neutral-100 rounded-lg py-1.5 px-3 text-[11px] font-semibold text-slate-900 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Shared Settings */}
                  <div className="px-1 py-1 flex items-center justify-between">
                    <label className="text-[8px] md:text-[9px] font-medium text-neutral-400 uppercase tracking-widest font-sans">Fuel Rate</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={calcData.mileage}
                        onChange={(e) => setCalcData({ ...calcData, mileage: e.target.value })}
                        className="w-16 bg-neutral-50 border-b-2 border-neutral-100 text-[11px] font-semibold text-slate-900 text-right outline-none pr-1"
                      />
                      <span className="text-[9px] font-medium text-neutral-400 font-sans">₦/L</span>
                    </div>
                  </div>

                  {/* Summary Section */}
                  <div className="py-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] md:text-[10px] font-medium text-neutral-400 uppercase tracking-widest font-sans">Settlement Total</span>
                        <span className="text-[8px] font-normal text-neutral-300 italic">Verified calculation</span>
                      </div>
                      <span className="text-base md:text-xl font-semibold text-emerald-600">₦{calculations.grandTotal.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Allocation Input */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-emerald-400 rounded-full" />
                      <label className="text-[9px] md:text-[10px] font-medium text-slate-600 uppercase tracking-widest font-sans">Cash Allocation (₦)</label>
                    </div>
                    <input
                      type="number"
                      value={calcData.allocationMoney}
                      onChange={(e) => setCalcData({ ...calcData, allocationMoney: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-emerald-50/30 border border-emerald-100 rounded-xl py-3 px-4 text-sm md:text-base font-semibold text-emerald-700 outline-none focus:bg-white focus:border-emerald-400 transition-all placeholder:text-emerald-200"
                    />
                  </div>

                  {/* Route Map Integration */}
                  <div className="mt-6 rounded-2xl border border-neutral-100 overflow-hidden shadow-sm relative group">
                     <div className="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-md px-2 py-1 rounded-md border border-neutral-100 shadow-sm">
                        <div className="text-[8px] font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                           <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                           Route Preview
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
