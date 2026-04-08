"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Truck, 
  Settings, 
  Calendar, 
  Activity,
  Fuel,
  Weight
} from "lucide-react";

interface CreateTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function CreateTruckModal({ isOpen, onClose, onSubmit }: CreateTruckModalProps) {
  const [formData, setFormData] = useState({
    truckId: "",
    model: "",
    capacity: "", // Tonnage
    year: "2024",
    fuelType: "Diesel",
    health: "Excellent",
    truckType: "Medium",
    length: "",
    width: "",
    height: "",
    maintenanceDate: new Date().toISOString().split('T')[0]
  });

  const calculatedVolume = (parseFloat(formData.length) || 0) * (parseFloat(formData.width) || 0) * (parseFloat(formData.height) || 0);

  const handleFormSubmit = () => {
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-600 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm pointer-events-auto"
              onClick={onClose}
            />

            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-[450px] bg-white shadow-2xl pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div>
                  <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Add New Truck</h2>
                  <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">Register vehicle to fleet</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white border border-transparent hover:border-neutral-100 text-neutral-400 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* Section 1: Basic Info */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2 px-1">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                         <Truck className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">General Information</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-100 shadow-sm">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest ml-1">Truck ID / Plate No.</label>
                        <input
                          type="text"
                          value={formData.truckId}
                          onChange={(e) => setFormData({...formData, truckId: e.target.value})}
                          placeholder="e.g. TRK-045"
                          className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 focus:border-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest ml-1">Model / Make</label>
                        <input
                          type="text"
                          value={formData.model}
                          onChange={(e) => setFormData({...formData, model: e.target.value})}
                          placeholder="e.g. Volvo FH16"
                          className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 focus:border-primary/20 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest ml-1">Vehicle Type</label>
                        <select 
                          className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 focus:border-primary/20 outline-none transition-all cursor-pointer"
                          value={formData.truckType}
                          onChange={(e) => setFormData({...formData, truckType: e.target.value})}
                        >
                           <option value="Mini">Mini Truck</option>
                           <option value="Small">Small LCV</option>
                           <option value="Medium">Medium Duty</option>
                           <option value="Heavy">Heavy Duty</option>
                           <option value="Trailer">Flatbed / Trailer</option>
                        </select>
                      </div>
                   </div>
                </section>

                {/* Section 2: Dimensions & Cargo */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2 px-1">
                      <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                         <Weight className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Dimensions & Cargo Specs</h3>
                   </div>

                   <div className="grid grid-cols-3 gap-3">
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1">
                          Length (ft)
                        </label>
                        <input
                          type="number"
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                          placeholder="L"
                          value={formData.length}
                          onChange={(e) => setFormData({...formData, length: e.target.value})}
                        />
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1">
                          Width (ft)
                        </label>
                        <input
                          type="number"
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                          placeholder="W"
                          value={formData.width}
                          onChange={(e) => setFormData({...formData, width: e.target.value})}
                        />
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1">
                          Height (ft)
                        </label>
                        <input
                          type="number"
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                          placeholder="H"
                          value={formData.height}
                          onChange={(e) => setFormData({...formData, height: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="bg-slate-900 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-slate-200">
                      <div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Calculated Volume</p>
                         <h4 className="text-lg font-bold text-white tracking-tight">{calculatedVolume.toLocaleString()} <span className="text-[10px] text-slate-500 font-medium">Cu. Ft.</span></h4>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white">
                         📦
                      </div>
                   </div>
                </section>

                {/* Section 3: Technical & Health */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2 px-1">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                         <Settings className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Technical & Status</h3>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1 flex items-center gap-1.5">
                          <Weight className="w-3 h-3" /> Max Capacity (Tons)
                        </label>
                        <input
                          type="number"
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                          placeholder="30"
                          value={formData.capacity}
                          onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                        />
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3" /> Year
                        </label>
                        <input
                          type="number"
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                          value={formData.year}
                          onChange={(e) => setFormData({...formData, year: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1 flex items-center gap-1.5">
                          <Fuel className="w-3 h-3 text-primary" /> Fuel Type
                        </label>
                        <select 
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full cursor-pointer"
                          value={formData.fuelType}
                          onChange={(e) => setFormData({...formData, fuelType: e.target.value})}
                        >
                           <option>Diesel</option>
                           <option>Petrol</option>
                           <option>Electric</option>
                           <option>CNG</option>
                        </select>
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1 flex items-center gap-1.5">
                          <Activity className="w-3 h-3 text-emerald-500" /> Truck Health
                        </label>
                        <select 
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full cursor-pointer"
                          value={formData.health}
                          onChange={(e) => setFormData({...formData, health: e.target.value})}
                        >
                           <option value="Excellent">Excellent</option>
                           <option value="Good">Good</option>
                           <option value="Maintenance">Needs Check</option>
                           <option value="Poor">Poor Status</option>
                        </select>
                      </div>
                   </div>

                   <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> Next Maintenance Schedule
                      </label>
                      <input
                        type="date"
                        className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                        value={formData.maintenanceDate}
                        onChange={(e) => setFormData({...formData, maintenanceDate: e.target.value})}
                      />
                   </div>
                </section>

              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className="px-6 py-4 bg-white border border-neutral-100 rounded-2xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleFormSubmit}
                  className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Confirm & Add Truck
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
