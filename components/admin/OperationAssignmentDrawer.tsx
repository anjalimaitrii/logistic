"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Truck,
  MapPin,
  Package,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import { driverService } from "@/services/driverService";
import { collectionService } from "@/services/collectionService";

interface OperationAssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  job: any | null;
  onSubmit: (data: any) => void;
}

export default function OperationAssignmentDrawer({ isOpen, onClose, job, onSubmit }: OperationAssignmentDrawerProps) {
  const [step, setStep] = useState(1);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);

  const [formData, setFormData] = useState({
    driver: "",
    truckId: "", // New field
    truckNumber: "",
    truckHealth: "Excellent",
    collection: ""
  });

  useEffect(() => {
    if (isOpen) {
      loadDrivers();
      loadCollections();
    }
  }, [isOpen]);

  const loadDrivers = async () => {
    try {
      setIsLoadingDrivers(true);
      const data = await driverService.getAll();
      // Only show drivers who are Active
      setDrivers((data || []).filter((d: any) => d.status === "Active"));
    } catch (error) {
      console.error("Failed to load drivers:", error);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const loadCollections = async () => {
    try {
      setIsLoadingCollections(true);
      const data = await collectionService.getAll();
      setCollections(data || []);
      if (data && data.length > 0 && !formData.collection) {
        setFormData(prev => ({ ...prev, collection: data[0].name }));
      }
    } catch (error) {
      console.error("Failed to load collections:", error);
    } finally {
      setIsLoadingCollections(false);
    }
  };

  const handleFleetSelect = (driverId: string) => {
    const driver = drivers.find(d => d._id === driverId);
    if (driver) {
      setFormData({
        ...formData,
        driver: driver.name,
        truckId: driver.assignedTruck?._id || "", // Capture truckId
        truckNumber: driver.assignedTruck?.truckId || "N/A",
        truckHealth: driver.assignedTruck?.health || "Good"
      });
    } else {
      setFormData({
        ...formData,
        driver: "",
        truckId: "",
        truckNumber: "",
        truckHealth: "Excellent"
      });
    }
  };

  useEffect(() => {
    if (job && isOpen) {
      if (job.assignment) {
        setFormData({
          driver: job.assignment.driverName || "",
          truckId: job.assignment.truckId || "",
          truckNumber: job.assignment.truckNumber || "",
          truckHealth: job.assignment.truckHealth || "Excellent",
          collection: job.assignment.collectionArea || "Collection 1"
        });
      } else {
        setFormData({
          driver: "",
          truckId: "",
          truckNumber: "",
          truckHealth: "Excellent",
          collection: "Collection 1"
        });
      }
      setStep(1);
    }
  }, [job, isOpen]);

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleFormSubmit = () => {
    if (job?.isApproved) return;
    if (!formData.driver || !formData.truckNumber) {
      alert("Please select a fleet unit");
      return;
    }
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

      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-[500px] bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <h2 className="text-[16px] font-bold text-neutral-900 tracking-tight">Assign Operations</h2>
            </div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest ml-4">
              Management for Job #{job?._id?.substring(job?._id?.length - 6).toUpperCase()}
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-neutral-400 transition-all border border-transparent hover:border-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8"
              >
                {/* Section 1: Job Summary */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Package className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Review Job Details</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {/* Pickup Address */}
                    <div className="p-4 rounded-2xl bg-emerald-50/10 border border-emerald-100/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight bg-emerald-50 px-2 py-0.5 rounded-full">Pickup</span>
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <Phone className="w-3 h-3" />
                          <span className="text-[10px] font-semibold">{job?.pickup?.contactNumber}</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="text-[12px] font-medium text-neutral-900 leading-relaxed">
                          {job?.pickup?.address?.street}, {job?.pickup?.address?.city} ({job?.pickup?.address?.pincode})
                        </div>
                      </div>
                    </div>

                    {/* Dropoff Address */}
                    <div className="p-4 rounded-2xl bg-rose-50/10 border border-rose-100/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tight bg-rose-50 px-2 py-0.5 rounded-full">Drop-off</span>
                        <div className="flex items-center gap-1.5 text-neutral-400">
                          <Phone className="w-3 h-3" />
                          <span className="text-[10px] font-semibold">{job?.dropoff?.contactNumber}</span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        <div className="text-[12px] font-medium text-neutral-900 leading-relaxed">
                          {job?.dropoff?.address?.street}, {job?.dropoff?.address?.city} ({job?.dropoff?.address?.pincode})
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cargo & Schedule Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100/50">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter mb-1">Goods Weight</div>
                      <div className="text-[13px] font-bold text-neutral-900">{job?.cargoDetails?.weight} kg</div>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100/50">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter mb-1">Cargo Type</div>
                      <div className="text-[13px] font-bold text-neutral-900">{job?.cargoDetails?.goodsType}</div>
                    </div>
                    <div className="bg-neutral-50 rounded-xl p-3 shadow-sm border border-neutral-100/50">
                      <div className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter mb-1">Loading Date</div>
                      <div className="text-[12px] font-bold text-neutral-900 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-primary" />
                        {job?.cargoDetails?.loadingDate}
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-6 space-y-8"
              >
                {/* Section 2: Logistics Assignment */}
                <section className="space-y-5">
                  <div className="flex items-center gap-2 px-1">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Truck className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Fleet Assignment</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-neutral-50 rounded-[28px] p-5 border border-neutral-100 shadow-sm space-y-5">
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Fleet Unit Details</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Truck className="w-3 h-3 text-primary" /> Select Fleet Unit
                          </label>
                          <div className="relative">
                            <select
                              value={drivers.find(d => d.name === formData.driver)?._id || ""}
                              onChange={(e) => handleFleetSelect(e.target.value)}
                              disabled={job?.isApproved}
                              className={`bg-white border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-900 outline-none w-full focus:border-primary/30 transition-all shadow-sm appearance-none ${job?.isApproved ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <option value="" disabled>{isLoadingDrivers ? "Loading units..." : "Select Integrated Fleet Unit"}</option>
                              {drivers.map((d) => (
                                <option key={d._id} value={d._id}>
                                  {d.name} • {d.assignedTruck?.truckId || "No Truck"} ({d.assignedTruck?.health || "N/A"})
                                </option>
                              ))}
                            </select>
                            {!job?.isApproved && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 pointer-events-none" />}
                          </div>
                          {formData.driver && (
                            <div className="mt-3 p-3 bg-white rounded-xl border border-neutral-100 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-[10px] text-neutral-400 font-bold uppercase">Driver</span>
                                <span className="text-[11px] font-bold text-slate-900">{formData.driver}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[10px] text-neutral-400 font-bold uppercase">Vehicle</span>
                                <span className="text-[11px] font-bold text-slate-900">{formData.truckNumber}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[10px] text-neutral-400 font-bold uppercase">Health</span>
                                <span className={`text-[10px] font-bold uppercase ${formData.truckHealth === 'Excellent' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                  {formData.truckHealth}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Collection Area */}
                    <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-100 hover:border-primary/30 transition-all shadow-sm">
                      <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                        <MapPin className="w-3 h-3 text-primary" /> Dispatch Collection Area
                      </label>
                      <div className="relative">
                        <select
                          value={formData.collection}
                          onChange={(e) => setFormData({ ...formData, collection: e.target.value })}
                          disabled={job?.isApproved}
                          className={`bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full appearance-none ${job?.isApproved ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                        >
                          {isLoadingCollections ? (
                            <option>Loading...</option>
                          ) : collections.length > 0 ? (
                            collections.map((c: any) => (
                              <option key={c._id} value={c.name}>{c.name}</option>
                            ))
                          ) : (
                            <option value="">No collections found</option>
                          )}
                        </select>
                        {!job?.isApproved && <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 pointer-events-none" />}
                      </div>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3">
          {step === 2 && (
            <button
              onClick={handleBack}
              className="px-6 py-4 border border-neutral-100 rounded-2xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center gap-2"
            >
              <Truck className="w-3.5 h-3.5 rotate-180" />
              Back
            </button>
          )}
          <button
            onClick={step === 1 ? handleNext : handleFormSubmit}
            disabled={step === 2 && job?.isApproved}
            className={`flex-1 px-8 py-4 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${step === 2 && job?.isApproved
              ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              : 'bg-primary text-white shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98]'
              }`}
          >
            {step === 1 ? "Next Details" : job?.isApproved ? "Assignment Locked" : "Confirm Assignment"}
            {step === 2 && job?.isApproved ? <Clock className="w-4 h-4" /> : step === 2 ? <CheckCircle2 className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 -rotate-90" />}
          </button>
        </div>
      </div>
    </div>
  );
}
