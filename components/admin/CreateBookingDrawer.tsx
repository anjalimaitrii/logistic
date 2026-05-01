"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  MapPin,
  Package,
  Phone,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  User,
  Hash,
  Building,
  Users
} from "lucide-react";
import { clientService } from "@/services/clientService";

interface CreateBookingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function CreateBookingDrawer({ isOpen, onClose, onSubmit }: CreateBookingDrawerProps) {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);

  const [formData, setFormData] = useState({
    clientId: "",
    goodsType: "",
    weight: "",
    scheduleDate: new Date().toISOString().split('T')[0],
    pickupContactPerson: "",
    pickupContact: "",
    pickupPlotNo: "",
    pickupStreet: "",
    pickupCity: "",
    pickupPincode: "",
    dropoffContactPerson: "",
    dropoffContact: "",
    dropoffPlotNo: "",
    dropoffStreet: "",
    dropoffCity: "",
    dropoffPincode: "",
    truckType: "Flat Bed"
  });

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen]);

  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const data = await clientService.getAll();
      setClients(data || []);
    } catch (error) {
      console.error("Failed to load clients:", error);
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleFormSubmit = () => {
    if (!formData.clientId) {
      alert("Please select a client.");
      return;
    }
    onSubmit(formData);
    onClose();
    setStep(1);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] pointer-events-none">
      <div
        className={`absolute inset-0 bg-neutral-900/30 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Create New Booking</h2>
            <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">Manual entry from admin panel</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-xl text-neutral-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white border border-neutral-200 text-neutral-400"}`}>
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-[2px] rounded-full ${step > s ? "bg-primary" : "bg-neutral-200"}`} />}
            </div>
          ))}
          <span className="ml-auto text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            Step {step} of 3
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Client & Cargo</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Select Client</label>
                    <div className="relative group">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                      <select
                        value={formData.clientId}
                        onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                        className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-semibold text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm cursor-pointer appearance-none"
                      >
                        <option value="">Choose Client...</option>
                        {clients.map(c => <option key={c._id} value={c._id}>{c.name} ({c.email})</option>)}
                      </select>
                    </div>
                    {isLoadingClients && <p className="text-[9px] text-primary animate-pulse ml-1">Fetching active clients...</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Type of Goods</label>
                      <div className="relative group">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          value={formData.goodsType}
                          onChange={(e) => setFormData({ ...formData, goodsType: e.target.value })}
                          placeholder="e.g. Textiles"
                          className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Weight (kg)</label>
                      <input
                        type="number"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                        placeholder="0"
                        className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Schedule Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                      <input
                        type="date"
                        value={formData.scheduleDate}
                        onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                        className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Requirement</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { name: "Flat Bed", icon: "🚜" },
                        { name: "Walled", icon: "🚛" },
                      ].map((truck) => (
                        <button
                          key={truck.name}
                          onClick={() => setFormData({ ...formData, truckType: truck.name })}
                          className={`p-3 rounded-xl border flex flex-col items-center transition-all group ${formData.truckType === truck.name ? 'bg-primary border-primary shadow-lg shadow-primary/20 text-white' : 'bg-white border-neutral-100 hover:border-primary/20 text-neutral-900'}`}
                        >
                          <span className={`text-xl mb-1 transition-transform group-hover:scale-110 ${formData.truckType === truck.name ? '' : 'filter grayscale opacity-50'}`}>{truck.icon}</span>
                          <span className="text-[11px] font-semibold">{truck.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Location Logistics</h3>
                  
                  <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/10 border border-emerald-100/30">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pickup Info</span>
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="Contact Person"
                        value={formData.pickupContactPerson}
                        onChange={(e) => setFormData({...formData, pickupContactPerson: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                      <input
                        placeholder="Contact Number"
                        value={formData.pickupContact}
                        onChange={(e) => setFormData({...formData, pickupContact: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="Plot/Shop No"
                        value={formData.pickupPlotNo}
                        onChange={(e) => setFormData({...formData, pickupPlotNo: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                      <input
                        placeholder="Street/Building"
                        value={formData.pickupStreet}
                        onChange={(e) => setFormData({...formData, pickupStreet: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="City"
                        value={formData.pickupCity}
                        onChange={(e) => setFormData({...formData, pickupCity: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                      <input
                        placeholder="Pincode"
                        value={formData.pickupPincode}
                        onChange={(e) => setFormData({...formData, pickupPincode: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 p-4 rounded-2xl bg-rose-50/10 border border-rose-100/30">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Dropoff Info</span>
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="Contact Person"
                        value={formData.dropoffContactPerson}
                        onChange={(e) => setFormData({...formData, dropoffContactPerson: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                      <input
                        placeholder="Contact Number"
                        value={formData.dropoffContact}
                        onChange={(e) => setFormData({...formData, dropoffContact: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="Plot/Shop No"
                        value={formData.dropoffPlotNo}
                        onChange={(e) => setFormData({...formData, dropoffPlotNo: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                      <input
                        placeholder="Street/Building"
                        value={formData.dropoffStreet}
                        onChange={(e) => setFormData({...formData, dropoffStreet: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        placeholder="City"
                        value={formData.dropoffCity}
                        onChange={(e) => setFormData({...formData, dropoffCity: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                      <input
                        placeholder="Pincode"
                        value={formData.dropoffPincode}
                        onChange={(e) => setFormData({...formData, dropoffPincode: e.target.value})}
                        className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-emerald-900">Review & Confirm</h4>
                    <p className="text-[10px] font-medium text-emerald-600/80">Manual booking will be created in active state.</p>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4">
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Selected Client</div>
                    <div className="text-[12px] font-semibold text-slate-900">
                      {clients.find(c => c._id === formData.clientId)?.name || "N/A"}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Cargo</div>
                      <div className="text-[11px] font-medium text-slate-700">{formData.goodsType} ({formData.weight}kg)</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Vehicle</div>
                      <div className="text-[11px] font-medium text-slate-700">{formData.truckType}</div>
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-neutral-100">
                    <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Route</div>
                    <div className="text-[11px] font-medium text-slate-900">
                      {formData.pickupCity} → {formData.dropoffCity}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="px-6 py-3 border border-neutral-100 rounded-xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>
          )}
          <button
            onClick={step === 3 ? handleFormSubmit : handleNext}
            className="flex-1 px-8 py-3 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {step === 3 ? "Create Booking" : "Next Details"}
            {step < 3 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
