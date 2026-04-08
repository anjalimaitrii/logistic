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
  DollarSign,
  FileText,
  CheckCircle2,
  ArrowLeft,
  Clock
} from "lucide-react";

interface FinalizeDealDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  request: any | null;
  onSubmit: (data: any) => void;
}

export default function FinalizeDealDrawer({ isOpen, onClose, request, onSubmit }: FinalizeDealDrawerProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    pickupStreet: "",
    pickupCity: "",
    pickupPincode: "",
    pickupContact: "",
    dropoffStreet: "",
    dropoffCity: "",
    dropoffPincode: "",
    dropoffContact: "",
    weight: "",
    goodsType: "",
    scheduleDate: "",
    scheduleTime: "",
    amount: "",
    advancePaid: "",
    specialRequest: ""
  });

  useEffect(() => {
    if (request) {
      const [pickup, dropoff] = request.route.split(" → ");
      setFormData(prev => ({
        ...prev,
        pickupCity: pickup || "",
        dropoffCity: dropoff || "",
        goodsType: request.cargo || "",
        weight: request.weight || "",
        amount: request.price?.replace(/[^0-9]/g, "") || "",
        // Initialize with today if empty
        scheduleDate: new Date().toISOString().split('T')[0],
        scheduleTime: "10:00"
      }));
    }
  }, [request]);

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleFormSubmit = () => {
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

      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-[450px] bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Finalize Deal</h2>
            <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">Create job from request {request?.id}</p>
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
                  <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Pickup Details</h3>
                  
                  <div className="space-y-4 p-4 rounded-2xl bg-emerald-50/10 border border-emerald-100/30">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Contact Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          type="text"
                          value={formData.pickupContact}
                          onChange={(e) => setFormData({ ...formData, pickupContact: e.target.value })}
                          placeholder="+234..."
                          className="w-full bg-white border border-neutral-100 rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:border-emerald-500/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Street / Building</label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          type="text"
                          value={formData.pickupStreet}
                          onChange={(e) => setFormData({ ...formData, pickupStreet: e.target.value })}
                          placeholder="House no, Street name..."
                          className="w-full bg-white border border-neutral-100 rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:border-emerald-500/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">City</label>
                        <input
                          type="text"
                          value={formData.pickupCity}
                          onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })}
                          placeholder="City name"
                          className="w-full bg-white border border-neutral-100 rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:border-emerald-500/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Pincode</label>
                        <input
                          type="text"
                          value={formData.pickupPincode}
                          onChange={(e) => setFormData({ ...formData, pickupPincode: e.target.value })}
                          placeholder="123456"
                          className="w-full bg-white border border-neutral-100 rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:border-emerald-500/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2 mt-2">Drop-off Details</h3>
                  
                  <div className="space-y-4 p-4 rounded-2xl bg-rose-50/10 border border-rose-100/30">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Contact Number</label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-rose-500 transition-colors" />
                        <input
                          type="text"
                          value={formData.dropoffContact}
                          onChange={(e) => setFormData({ ...formData, dropoffContact: e.target.value })}
                          placeholder="+234..."
                          className="w-full bg-white border border-neutral-100 rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:border-rose-500/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Street / Building</label>
                      <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-rose-500 transition-colors" />
                        <input
                          type="text"
                          value={formData.dropoffStreet}
                          onChange={(e) => setFormData({ ...formData, dropoffStreet: e.target.value })}
                          placeholder="Dest. Street, building..."
                          className="w-full bg-white border border-neutral-100 rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:border-rose-500/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">City</label>
                        <input
                          type="text"
                          value={formData.dropoffCity}
                          onChange={(e) => setFormData({ ...formData, dropoffCity: e.target.value })}
                          placeholder="City name"
                          className="w-full bg-white border border-neutral-100 rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:border-rose-500/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Pincode</label>
                        <input
                          type="text"
                          value={formData.dropoffPincode}
                          onChange={(e) => setFormData({ ...formData, dropoffPincode: e.target.value })}
                          placeholder="123456"
                          className="w-full bg-white border border-neutral-100 rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:border-rose-500/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2 mt-2">Cargo Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Weight (kg)</label>
                      <div className="relative group">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          placeholder="e.g. 5000"
                          className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Type of Goods</label>
                      <input
                        type="text"
                        value={formData.goodsType}
                        onChange={(e) => setFormData({ ...formData, goodsType: e.target.value })}
                        placeholder="e.g. Textiles"
                        className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                      />
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
                  <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Schedule & Financials</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Schedule Date</label>
                      <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="date"
                          value={formData.scheduleDate}
                          onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                          className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Schedule Time</label>
                      <div className="relative group">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="time"
                          value={formData.scheduleTime}
                          onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                          className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Final Job Amount</label>
                      <div className="relative group">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="number"
                          value={formData.amount}
                          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                          placeholder="Total Price"
                          className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Advance Paid</label>
                      <input
                        type="number"
                        value={formData.advancePaid}
                        onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                        placeholder="Amount Paid"
                        className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Special Request / Description</label>
                    <div className="relative group">
                      <FileText className="absolute left-3 top-3 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                      <textarea
                        rows={4}
                        value={formData.specialRequest}
                        onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}
                        placeholder="Add special instructions for the driver or logistics team..."
                        className="w-full bg-neutral-50 border border-transparent rounded-xl py-3 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm resize-none"
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
                    <h4 className="text-[13px] font-bold text-emerald-900">Ready to Finalize</h4>
                    <p className="text-[10px] font-medium text-emerald-600/80">Please review the details before creating the job.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-3">
                    <div className="space-y-1">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-[0.2em]">Route Summary</div>
                      <div className="text-[11px] font-medium text-neutral-900">
                        <span className="text-emerald-600">Pickup:</span> {formData.pickupStreet}, {formData.pickupCity} ({formData.pickupPincode})
                      </div>
                      <div className="text-[11px] font-medium text-neutral-900">
                        <span className="text-rose-600">Drop-off:</span> {formData.dropoffStreet}, {formData.dropoffCity} ({formData.dropoffPincode})
                      </div>
                    </div>
                    <div className="w-full h-px bg-neutral-200/50" />
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-neutral-400 font-bold uppercase tracking-widest">Schedule</span>
                      <span className="text-neutral-900 font-semibold">{formData.scheduleDate} at {formData.scheduleTime}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-neutral-400 font-bold uppercase tracking-widest">Cargo</span>
                      <span className="text-neutral-900 font-semibold">{formData.goodsType} ({formData.weight}kg)</span>
                    </div>
                    <div className="w-full h-px bg-neutral-200/50" />
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-neutral-400 font-bold uppercase tracking-widest">Final Price</span>
                      <span className="text-primary font-bold text-base">₦{Number(formData.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-neutral-400 font-bold uppercase tracking-widest">Advance Paid</span>
                      <span className="text-emerald-600 font-bold text-base">₦{Number(formData.advancePaid).toLocaleString()}</span>
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
            {step === 3 ? "Confirm & Create Job" : "Next Details"}
            {step < 3 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
