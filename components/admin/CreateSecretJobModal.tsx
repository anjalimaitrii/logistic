"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ChevronRight, MapPin, Package, Calendar,
  CheckCircle2, ArrowLeft, Users
} from "lucide-react";
import { clientService } from "@/services/clientService";
import { bookingService } from "@/services/bookingService";

interface CreateSecretJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const emptyLocation = () => ({ contactPerson: "", contact: "", plotNo: "", street: "", city: "", pincode: "" });

export default function CreateSecretJobModal({ isOpen, onClose, onSubmit }: CreateSecretJobModalProps) {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [withTax, setWithTax] = useState(true);

  const [formData, setFormData] = useState({
    clientId: "",
    goodsType: "",
    weight: "",
    scheduleDate: new Date().toISOString().split("T")[0],
    pickupLocations: [emptyLocation()],
    dropoffLocations: [emptyLocation()],
    truckType: "Flat Bed",
  });

  useEffect(() => {
    if (isOpen) loadClients();
  }, [isOpen]);

  const loadClients = async () => {
    try {
      setIsLoadingClients(true);
      const data = await clientService.getAll();
      setClients(data || []);
    } catch { } finally {
      setIsLoadingClients(false);
    }
  };

  const lbl = (pCount: number, dCount: number, isPick: boolean, idx: number) =>
    String.fromCharCode(65 + (isPick ? idx : pCount + idx));

  const sanitize = (key: string, val: string) => {
    if (key === "contactPerson") return val.replace(/[0-9]/g, "");
    if (key === "contact") return val.replace(/\D/g, "").slice(0, 10);
    return val;
  };

  const updatePickup = (idx: number, key: string, val: string) => {
    const locs = [...formData.pickupLocations];
    (locs[idx] as any)[key] = sanitize(key, val);
    setFormData({ ...formData, pickupLocations: locs });
  };

  const updateDropoff = (idx: number, key: string, val: string) => {
    const locs = [...formData.dropoffLocations];
    (locs[idx] as any)[key] = sanitize(key, val);
    setFormData({ ...formData, dropoffLocations: locs });
  };

  const handleSubmit = async () => {
    if (!formData.clientId) { alert("Please select a client."); return; }
    if (!formData.goodsType || !formData.weight) { alert("Please fill in cargo details."); return; }
    if (!formData.pickupLocations.some(l => l.city && l.contactPerson && l.contact)) {
      alert("Please fill at least one complete pickup location."); return;
    }
    if (!formData.dropoffLocations.some(l => l.city && l.contactPerson && l.contact)) {
      alert("Please fill at least one complete dropoff location."); return;
    }

    try {
      await bookingService.create({
        clientId: formData.clientId,
        isSecret: true,
        withTax,
        cargoDetails: {
          goodsType: formData.goodsType,
          weight: parseInt(formData.weight),
          loadingDate: formData.scheduleDate,
        },
        pickupLocations: formData.pickupLocations.map((l, i) => ({
          sequence: i + 1,
          contactPerson: l.contactPerson,
          contactNumber: l.contact,
          address: { plotNo: l.plotNo, street: l.street, city: l.city, pincode: l.pincode },
          gpsEnabled: false,
        })),
        dropoffLocations: formData.dropoffLocations.map((l, i) => ({
          sequence: i + 1,
          contactPerson: l.contactPerson,
          contactNumber: l.contact,
          address: { plotNo: l.plotNo, street: l.street, city: l.city, pincode: l.pincode },
          gpsEnabled: false,
        })),
        requirement: { bodyType: formData.truckType },
        status: "active",
        metadata: { source: "secret_panel", createdAt: new Date().toISOString(), isSecret: true },
      } as any);

      onSubmit(formData);
      onClose();
      setStep(1);
      setFormData({ clientId: "", goodsType: "", weight: "", scheduleDate: new Date().toISOString().split("T")[0], pickupLocations: [emptyLocation()], dropoffLocations: [emptyLocation()], truckType: "Flat Bed" });
    } catch (err) {
      console.error(err);
      alert("Failed to create job. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] pointer-events-none">
      <div
        className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm pointer-events-auto"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[480px] bg-white shadow-2xl pointer-events-auto flex flex-col">

        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Create Special Job</h2>
            <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">Secret panel · Tax configurable</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-50 rounded-xl text-neutral-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-4 bg-neutral-50/50 border-b border-neutral-100 flex items-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${step >= s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white border border-neutral-200 text-neutral-400"}`}>
                {step > s ? <CheckCircle2 className="w-3.5 h-3.5" /> : s}
              </div>
              {s < 3 && <div className={`w-8 h-[2px] rounded-full ${step > s ? "bg-primary" : "bg-neutral-200"}`} />}
            </div>
          ))}
          <span className="ml-auto text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Step {step} of 3</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <AnimatePresence mode="wait">

            {/* ── STEP 1: Client, Cargo, Tax ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">

                {/* TAX TOGGLE — extra field */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-[12px] font-bold text-neutral-900">Tax Configuration</h3>
                      <p className="text-[10px] text-neutral-400 font-medium mt-0.5">Toggle GST/Tax inclusion for this job</p>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-neutral-100 shadow-sm">
                      <button
                        onClick={() => setWithTax(true)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${withTax ? "bg-primary text-white shadow-md" : "text-neutral-400 hover:text-neutral-600"}`}
                      >WITH TAX</button>
                      <button
                        onClick={() => setWithTax(false)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${!withTax ? "bg-amber-500 text-white shadow-md" : "text-neutral-400 hover:text-neutral-600"}`}
                      >WITHOUT TAX</button>
                    </div>
                  </div>
                  {!withTax && (
                    <div className="flex items-center gap-3 px-3 py-2 bg-amber-50 rounded-xl border border-amber-100">
                      <span>⚠️</span>
                      <p className="text-[10px] font-bold text-amber-700">Without Tax — ensure documentation is logged in the Special Ledger.</p>
                    </div>
                  )}
                </div>

                {/* Client */}
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
                    {isLoadingClients && <p className="text-[9px] text-primary animate-pulse ml-1">Fetching clients...</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Type of Goods</label>
                      <div className="relative group">
                        <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                        <input type="text" value={formData.goodsType} onChange={(e) => setFormData({ ...formData, goodsType: e.target.value })} placeholder="e.g. Textiles" className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Weight (kg)</label>
                      <input type="number" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="0" className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 px-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Schedule Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
                      <input type="date" value={formData.scheduleDate} onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })} className="w-full bg-neutral-50 border border-transparent rounded-xl py-2.5 pl-10 pr-4 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-widest ml-1">Requirement</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ name: "Flat Bed", icon: "🚜" }, { name: "Walled", icon: "🚛" }].map((truck) => (
                        <button
                          key={truck.name}
                          onClick={() => setFormData({ ...formData, truckType: truck.name })}
                          className={`p-3 rounded-xl border flex flex-col items-center transition-all group ${formData.truckType === truck.name ? "bg-primary border-primary shadow-lg shadow-primary/20 text-white" : "bg-white border-neutral-100 hover:border-primary/20 text-neutral-900"}`}
                        >
                          <span className={`text-xl mb-1 transition-transform group-hover:scale-110 ${formData.truckType === truck.name ? "" : "filter grayscale opacity-50"}`}>{truck.icon}</span>
                          <span className="text-[11px] font-semibold">{truck.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Locations ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-[0.15em] border-b border-neutral-50 pb-2">Location Logistics</h3>

                {/* Pickup Locations */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Pickup Locations</span>
                    <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded">{formData.pickupLocations.length}</span>
                  </div>
                  {formData.pickupLocations.map((loc, idx) => (
                    <div key={idx} className="space-y-3 p-4 rounded-2xl bg-emerald-50/10 border border-emerald-100/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[11px] font-bold">
                            {lbl(formData.pickupLocations.length, formData.dropoffLocations.length, true, idx)}
                          </div>
                          <span className="text-[10px] font-semibold text-emerald-700">Pickup Stop</span>
                        </div>
                        {formData.pickupLocations.length > 1 && (
                          <button onClick={() => setFormData({ ...formData, pickupLocations: formData.pickupLocations.filter((_, i) => i !== idx) })} className="text-[10px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors">Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Contact Person" value={loc.contactPerson} onChange={(e) => updatePickup(idx, "contactPerson", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                        <input placeholder="Contact Number" value={loc.contact} inputMode="numeric" maxLength={10} onChange={(e) => updatePickup(idx, "contact", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Plot/Shop No" value={loc.plotNo} onChange={(e) => updatePickup(idx, "plotNo", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                        <input placeholder="Street/Building" value={loc.street} onChange={(e) => updatePickup(idx, "street", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="City" value={loc.city} onChange={(e) => updatePickup(idx, "city", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                        <input placeholder="Pincode" value={loc.pincode} onChange={(e) => updatePickup(idx, "pincode", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setFormData({ ...formData, pickupLocations: [...formData.pickupLocations, emptyLocation()] })} className="w-full py-2.5 border border-dashed border-emerald-300 rounded-lg text-[11px] font-semibold text-emerald-600 hover:bg-emerald-50 transition-colors">
                    + Add Pickup Location
                  </button>
                </div>

                {/* Dropoff Locations */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Dropoff Locations</span>
                    <span className="text-[9px] text-rose-600 font-semibold bg-rose-50 px-2 py-1 rounded">{formData.dropoffLocations.length}</span>
                  </div>
                  {formData.dropoffLocations.map((loc, idx) => (
                    <div key={idx} className="space-y-3 p-4 rounded-2xl bg-rose-50/10 border border-rose-100/30">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-[11px] font-bold">
                            {lbl(formData.pickupLocations.length, formData.dropoffLocations.length, false, idx)}
                          </div>
                          <span className="text-[10px] font-semibold text-rose-700">Dropoff Stop</span>
                        </div>
                        {formData.dropoffLocations.length > 1 && (
                          <button onClick={() => setFormData({ ...formData, dropoffLocations: formData.dropoffLocations.filter((_, i) => i !== idx) })} className="text-[10px] font-semibold text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors">Remove</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Contact Person" value={loc.contactPerson} onChange={(e) => updateDropoff(idx, "contactPerson", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                        <input placeholder="Contact Number" value={loc.contact} inputMode="numeric" maxLength={10} onChange={(e) => updateDropoff(idx, "contact", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="Plot/Shop No" value={loc.plotNo} onChange={(e) => updateDropoff(idx, "plotNo", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                        <input placeholder="Street/Building" value={loc.street} onChange={(e) => updateDropoff(idx, "street", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input placeholder="City" value={loc.city} onChange={(e) => updateDropoff(idx, "city", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                        <input placeholder="Pincode" value={loc.pincode} onChange={(e) => updateDropoff(idx, "pincode", e.target.value)} className="w-full bg-white border border-neutral-100 rounded-lg py-2 px-3 text-[12px] outline-none" />
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setFormData({ ...formData, dropoffLocations: [...formData.dropoffLocations, emptyLocation()] })} className="w-full py-2.5 border border-dashed border-rose-300 rounded-lg text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition-colors">
                    + Add Dropoff Location
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Review ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-[13px] font-bold text-emerald-900">Review & Confirm</h4>
                    <p className="text-[10px] font-medium text-emerald-600/80">Special job will be created in active state.</p>
                  </div>
                </div>

                {/* Tax badge */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${withTax ? "bg-primary/5 border-primary/20 text-primary" : "bg-amber-50 border-amber-100 text-amber-700"}`}>
                  <span className="text-lg">{withTax ? "🧾" : "🔒"}</span>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest">{withTax ? "With Tax (GST Inclusive)" : "Without Tax Job"}</div>
                    <div className="text-[9px] font-medium opacity-70 mt-0.5">{withTax ? "Standard taxation applies" : "Ensure proper documentation is logged"}</div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-100 space-y-4">
                  <div className="space-y-2">
                    <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Selected Client</div>
                    <div className="text-[12px] font-semibold text-slate-900">{clients.find(c => c._id === formData.clientId)?.name || "N/A"}</div>
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
                </div>

                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Pickup Route</div>
                  {formData.pickupLocations.map((loc, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {lbl(formData.pickupLocations.length, formData.dropoffLocations.length, true, idx)}
                      </div>
                      <div>
                        <div className="font-semibold text-emerald-900 text-[11px]">{loc.city}</div>
                        <div className="text-emerald-600 text-[9px] mt-0.5">{loc.contactPerson} · {loc.contact}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center"><div className="text-2xl text-neutral-300">↓</div></div>

                <div className="space-y-2">
                  <div className="text-[9px] font-bold text-rose-600 uppercase tracking-widest">Dropoff Route</div>
                  {formData.dropoffLocations.map((loc, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {lbl(formData.pickupLocations.length, formData.dropoffLocations.length, false, idx)}
                      </div>
                      <div>
                        <div className="font-semibold text-rose-900 text-[11px]">{loc.city}</div>
                        <div className="text-rose-600 text-[9px] mt-0.5">{loc.contactPerson} · {loc.contact}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="px-6 py-3 border border-neutral-100 rounded-xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <button
            onClick={step === 3 ? handleSubmit : () => setStep(step + 1)}
            className="flex-1 px-8 py-3 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {step === 3 ? "Create Special Job" : "Next Details"}
            {step < 3 && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
