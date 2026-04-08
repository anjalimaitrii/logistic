"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Fuel, 
  MapPin, 
  CheckCircle2, 
  DollarSign, 
  User, 
  Truck,
  ArrowRight
} from "lucide-react";

interface AccountantProcessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  job: any | null;
  onSubmit: (data: any) => void;
}

export default function AccountantProcessDrawer({ isOpen, onClose, job, onSubmit }: AccountantProcessDrawerProps) {
  const [formData, setFormData] = useState({
    petrolFilled: false,
    pickupCompleted: false,
    dropoffCompleted: false,
    allocationMoney: ""
  });

  useEffect(() => {
    if (job) {
      setFormData({
        petrolFilled: job.petrolFilled || false,
        pickupCompleted: job.status === 'In Transit' || job.status === 'Delivered',
        dropoffCompleted: job.status === 'Delivered',
        allocationMoney: job.allocationMoney || ""
      });
    }
  }, [job, isOpen]);

  const handleFormSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-600 pointer-events-none font-sans">
      <div
        className={`absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity duration-300 pointer-events-auto ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-[460px] bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
               <h2 className="text-[16px] font-bold text-neutral-900 tracking-tight">Accountant Checklist</h2>
            </div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest ml-4.5">Processing Job {job?.id}</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-neutral-400 transition-all border border-transparent hover:border-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Job Summary Context */}
          <div className="bg-slate-900 rounded-[32px] p-6 text-white shadow-xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
             
             <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                   <div className="px-3 py-1 rounded-full bg-white/10 text-[10px] font-bold uppercase tracking-widest border border-white/5">
                      Assigned Workflow
                   </div>
                   <span className="text-[14px] font-bold text-primary">{job?.id}</span>
                </div>

                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                      <User className="w-6 h-6" />
                   </div>
                   <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Assigned Driver</div>
                      <div className="text-[15px] font-bold text-white">{job?.driver || "N/A"}</div>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div className="space-y-1">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Truck Number</div>
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-200">
                        <Truck className="w-3.5 h-3.5 text-slate-400" />
                        {job?.truckNumber || "N/A"}
                      </div>
                   </div>
                   <div className="space-y-1 text-right">
                      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Route Area</div>
                      <div className="text-[12px] font-semibold text-slate-200">{job?.collection || "Standard"}</div>
                   </div>
                </div>
             </div>
          </div>

          {/* Checklist Sections */}
          <div className="space-y-6">
            {/* 1. Status Checkpoints */}
            <div className="space-y-4">
               <div className="flex items-center gap-2 px-1">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Operations Status</h3>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'petrolFilled', label: 'Fuel/Petrol Filled', icon: Fuel, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { id: 'pickupCompleted', label: 'Pickup Completed', icon: MapPin, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { id: 'dropoffCompleted', label: 'Drop-off Completed', icon: MapPin, color: 'text-rose-500', bg: 'bg-rose-50' },
                  ].map((item) => (
                    <label 
                      key={item.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        (formData as any)[item.id] 
                        ? 'bg-white border-primary/20 shadow-md translate-x-1' 
                        : 'bg-neutral-50/50 border-neutral-100 opacity-70 grayscale'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${item.bg}`}>
                          <item.icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <span className="text-[13px] font-bold text-slate-900 tracking-tight">{item.label}</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={(formData as any)[item.id]}
                        onChange={(e) => setFormData({...formData, [item.id]: e.target.checked})}
                        className="w-5 h-5 rounded-lg border-neutral-300 text-primary focus:ring-primary/20 cursor-pointer"
                      />
                    </label>
                  ))}
               </div>
            </div>

            {/* 2. Financial Allocation */}
            <div className="space-y-4 pt-2">
               <div className="flex items-center gap-2 px-1">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Driver Allocation</h3>
               </div>

               <div className="bg-emerald-50/30 border border-emerald-100/50 rounded-[32px] p-6 space-y-4">
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                       <span className="text-[14px] font-bold">₦</span>
                    </div>
                    <input 
                      type="number"
                      value={formData.allocationMoney}
                      onChange={(e) => setFormData({...formData, allocationMoney: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-white border border-emerald-100 rounded-2xl py-4 pl-14 pr-6 text-[18px] font-bold text-slate-950 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-inner placeholder:text-emerald-200"
                    />
                  </div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest text-center">Amount allocated to driver for trip expenses</p>
               </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3">
          <button 
            onClick={onClose}
            className="flex-1 px-6 py-4 border border-neutral-100 rounded-2xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleFormSubmit}
            className="flex-[1.5] px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-emerald-700/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Approve & Release
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
