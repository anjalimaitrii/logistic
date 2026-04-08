"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Package, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  Clock, 
  Map,
  Truck
} from "lucide-react";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function CreateJobModal({ isOpen, onClose, onSubmit }: CreateJobModalProps) {
  const [formData, setFormData] = useState({
    client: "",
    pickupStreet: "",
    pickupCity: "",
    pickupPincode: "",
    pickupContact: "",
    dropoffStreet: "",
    dropoffCity: "",
    dropoffPincode: "",
    dropoffContact: "",
    goodsType: "",
    weight: "",
    truckType: "",
    advancePaid: "",
    scheduleDate: new Date().toISOString().split('T')[0],
    scheduleTime: "10:00"
  });

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
              className="absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div>
                  <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Create New Job</h2>
                  <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">Global Logistics Assignment</p>
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
                
                {/* Section 1: Client Details */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2 px-1">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                         <User className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Client Identification</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-100 shadow-sm">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest ml-1">Company / Consignor</label>
                        <input
                          type="text"
                          value={formData.client}
                          onChange={(e) => setFormData({...formData, client: e.target.value})}
                          placeholder="Logistics Partner Name"
                          className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 focus:border-primary/20 outline-none transition-all"
                        />
                      </div>
                   </div>
                </section>

                {/* Section 2: Route Details */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2 px-1">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                         <Map className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Route Specifications</h3>
                   </div>

                   <div className="space-y-4">
                      {/* Pickup Block */}
                      <div className="p-4 rounded-2xl bg-emerald-50/10 border border-emerald-100/30 space-y-3">
                         <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight">Origin Location</span>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            <input
                              placeholder="City"
                              className="bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[12px] font-semibold outline-none"
                              onChange={(e) => setFormData({...formData, pickupCity: e.target.value})}
                            />
                            <input
                              placeholder="Pincode"
                              className="bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[12px] font-semibold outline-none"
                              onChange={(e) => setFormData({...formData, pickupPincode: e.target.value})}
                            />
                            <input
                              placeholder="Contact no."
                              className="bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[12px] font-semibold outline-none"
                              onChange={(e) => setFormData({...formData, pickupContact: e.target.value})}
                            />
                         </div>
                         <input
                           placeholder="Street address / Landmark"
                           className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[12px] font-semibold outline-none"
                           onChange={(e) => setFormData({...formData, pickupStreet: e.target.value})}
                         />
                      </div>

                      {/* Dropoff Block */}
                      <div className="p-4 rounded-2xl bg-rose-50/10 border border-rose-100/30 space-y-3">
                         <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tight">Destination Point</span>
                         </div>
                         <div className="grid grid-cols-3 gap-2">
                            <input
                              placeholder="City"
                              className="bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[12px] font-semibold outline-none"
                              onChange={(e) => setFormData({...formData, dropoffCity: e.target.value})}
                            />
                            <input
                              placeholder="Pincode"
                              className="bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[12px] font-semibold outline-none"
                              onChange={(e) => setFormData({...formData, dropoffPincode: e.target.value})}
                            />
                            <input
                              placeholder="Contact no."
                              className="bg-white border border-neutral-100 rounded-xl px-4 py-2 text-[12px] font-semibold outline-none"
                              onChange={(e) => setFormData({...formData, dropoffContact: e.target.value})}
                            />
                         </div>
                         <input
                           placeholder="Full street address"
                           className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[12px] font-semibold outline-none"
                           onChange={(e) => setFormData({...formData, dropoffStreet: e.target.value})}
                         />
                      </div>
                   </div>
                </section>

                {/* Section 3: Cargo Details */}
                <section className="space-y-4 pb-4">
                   <div className="flex items-center gap-2 px-1">
                      <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                         <Package className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Cargo & Schedule</h3>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Weight (kg)</label>
                        <input
                          type="text"
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                          placeholder="e.g. 5,000"
                          onChange={(e) => setFormData({...formData, weight: e.target.value})}
                        />
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Vehicle Type</label>
                        <select 
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full cursor-pointer appearance-none"
                          onChange={(e) => setFormData({...formData, truckType: e.target.value})}
                          defaultValue=""
                        >
                          <option value="" disabled>Select Class</option>
                          <option value="mini">Mini (1.5 Ton)</option>
                          <option value="small">Small (3.5 Ton)</option>
                          <option value="medium">Medium (7.5 Ton)</option>
                          <option value="heavy">Heavy (15+ Ton)</option>
                        </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-3">
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Cargo Details / Description</label>
                        <input
                          type="text"
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                          placeholder="Textiles, Electronics..."
                          onChange={(e) => setFormData({...formData, goodsType: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 gap-3">
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Advance Paid</label>
                        <input
                          type="text"
                          className="bg-transparent text-[13px] font-semibold text-emerald-600 outline-none w-full"
                          placeholder="Amount in ₦"
                          onChange={(e) => setFormData({...formData, advancePaid: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Date</label>
                        <input
                          type="date"
                          value={formData.scheduleDate}
                          className="bg-transparent text-[12px] font-semibold text-slate-900 outline-none w-full"
                          onChange={(e) => setFormData({...formData, scheduleDate: e.target.value})}
                        />
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase block mb-1">Time</label>
                        <input
                          type="time"
                          value={formData.scheduleTime}
                          className="bg-transparent text-[12px] font-semibold text-slate-900 outline-none w-full"
                          onChange={(e) => setFormData({...formData, scheduleTime: e.target.value})}
                        />
                      </div>
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
                  Confirm & Create Job
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
