"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Truck,
  Package,
  Phone,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  ListOrdered,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from "lucide-react";

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).setHours(0,0,0,0) - new Date().setHours(0,0,0,0);
  return Math.ceil(diff / 86400000);
}

function complianceDot(complianceDocs: any[]): string {
  if (!complianceDocs?.length) return "⚪";
  const hasExpired = complianceDocs.some((d: any) => { const x = daysUntil(d.dueDate); return x !== null && x <= 0; });
  if (hasExpired) return "🔴";
  const hasExpiring = complianceDocs.some((d: any) => { const x = daysUntil(d.dueDate); return x !== null && x <= 20; });
  if (hasExpiring) return "🟠";
  return "🟢";
}
import { driverService } from "@/services/driverService";
import { assignmentService } from "@/services/assignmentService";
import { truckService } from "@/services/truckService";
import { cleanDriverName } from "@/services/liveTrackingService";
import { useNotifications } from "@/context/NotificationContext";

interface OperationAssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  job: any | null;
  onSubmit: (data: any) => void;
}

export default function OperationAssignmentDrawer({ isOpen, onClose, job, onSubmit }: OperationAssignmentDrawerProps) {
  const { addNotification } = useNotifications();
  const [step, setStep] = useState(1);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false);
  const [driverQueueInfo, setDriverQueueInfo] = useState<any[]>([]);
  const [truckDocs, setTruckDocs] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    driver: "",
    driverId: "",
    driverStatus: "",
    truckId: "",
    truckNumber: "",
    truckHealth: "Excellent",
  });

  useEffect(() => {
    if (isOpen) {
      loadDrivers();
    }
  }, [isOpen]);

  const loadDrivers = async () => {
    try {
      setIsLoadingDrivers(true);
      const data = await driverService.getAll();
      // Only Active employees; exclude those under inspection
      setDrivers((data || []).filter((d: any) =>
        d.status === "Active" && d.driverStatus !== "under_inspection"
      ));
    } catch (error) {
      console.error("Failed to load drivers:", error);
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  const handleFleetSelect = async (driverId: string) => {
    const driver = drivers.find(d => d._id === driverId);
    if (driver) {
      const ds = driver.driverStatus || "available";
      setFormData({
        ...formData,
        driver: driver.name,
        driverId: driver._id,
        driverStatus: ds,
        truckId: driver.assignedTruck?._id || "",
        truckNumber: driver.assignedTruck?.truckId || "N/A",
        truckHealth: driver.assignedTruck?.health || "Good"
      });

      // Fetch truck compliance docs
      if (driver.assignedTruck?._id) {
        try {
          const truck = await truckService.getById(driver.assignedTruck._id);
          setTruckDocs(truck?.complianceDocs || []);
        } catch { setTruckDocs([]); }
      } else {
        setTruckDocs([]);
      }

      // Fetch current queue for on_trip or returning drivers
      if (ds === "on_trip" || ds === "returning") {
        try {
          const assignments = await assignmentService.getByDriverId(driver._id);
          setDriverQueueInfo((assignments || []).filter((a: any) =>
            a.queueStatus === "active" || a.queueStatus === "queued"
          ));
        } catch {
          setDriverQueueInfo([]);
        }
      } else {
        setDriverQueueInfo([]);
      }
    } else {
      setFormData({
        ...formData,
        driver: "",
        driverId: "",
        driverStatus: "",
        truckId: "",
        truckNumber: "",
        truckHealth: "Excellent"
      });
      setTruckDocs([]);
      setDriverQueueInfo([]);
    }
  };

  useEffect(() => {
    if (job && isOpen) {
      if (job.assignment) {
        setFormData({
          driver: job.assignment.driverName || "",
          driverId: job.assignment.driverId || "",
          driverStatus: "",
          truckId: job.assignment.truckId || "",
          truckNumber: job.assignment.truckNumber || "",
          truckHealth: job.assignment.truckHealth || "Excellent",
        });
      } else {
        setFormData({
          driver: "",
          driverId: "",
          driverStatus: "",
          truckId: "",
          truckNumber: "",
          truckHealth: "Excellent",
        });
      }
      setDriverQueueInfo([]);
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

    const tripId = job?.tripId || `#${job?._id?.slice(-6).toUpperCase()}`;
    const pickup = job?.pickupLocations?.[0]?.address?.city || "—";
    const dropoff = job?.dropoffLocations?.[job?.dropoffLocations?.length - 1]?.address?.city || "—";
    const isQueued = formData.driverStatus === "on_trip";

    addNotification(
      "🚛",
      `Driver Assigned — ${tripId}`,
      `${formData.driver} · ${formData.truckNumber} · ${pickup} → ${dropoff}${isQueued ? " (Queued)" : ""}`
    );

    onSubmit(formData);
    onClose();
  };

  // Group drivers for optgroups
  // returning = trip done, coming back — available for new assignment (starts after inspection)
  const availableDrivers = drivers.filter(d => !d.driverStatus || d.driverStatus === "available" || d.driverStatus === "returning");
  const onTripDrivers = drivers.filter(d => d.driverStatus === "on_trip");

  const queuePosition = driverQueueInfo.length + 1;

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
                    {/* Pickup Locations */}
                    <div className="p-4 rounded-2xl bg-emerald-50/10 border border-emerald-100/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tight bg-emerald-50 px-2 py-0.5 rounded-full">
                          Pickup {(job?.pickupLocations?.length || 0) > 1 ? `(${job.pickupLocations.length} stops)` : ""}
                        </span>
                      </div>
                      {(job?.pickupLocations || []).map((loc: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <div className="flex-1">
                            <div className="text-[12px] font-semibold text-neutral-900">{[loc.address?.city, loc.address?.state, loc.address?.country].filter(Boolean).join(", ") || "—"}</div>
                            {(loc.address?.plotNo || loc.address?.street) && (
                              <div className="text-[11px] text-neutral-500 mt-0.5">
                                {[loc.address?.plotNo, loc.address?.street].filter(Boolean).join(", ")}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{loc.contactPerson}{loc.contactNumber ? ` · ${loc.contactNumber}` : ""}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Dropoff Locations */}
                    <div className="p-4 rounded-2xl bg-rose-50/10 border border-rose-100/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-rose-600 uppercase tracking-tight bg-rose-50 px-2 py-0.5 rounded-full">
                          Drop-off {(job?.dropoffLocations?.length || 0) > 1 ? `(${job.dropoffLocations.length} stops)` : ""}
                        </span>
                      </div>
                      {(job?.dropoffLocations || []).map((loc: any, idx: number) => (
                        <div key={idx} className="flex gap-3">
                          <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                            {String.fromCharCode(65 + (job?.pickupLocations?.length || 0) + idx)}
                          </div>
                          <div className="flex-1">
                            <div className="text-[12px] font-semibold text-neutral-900">{[loc.address?.city, loc.address?.state, loc.address?.country].filter(Boolean).join(", ") || "—"}</div>
                            {(loc.address?.plotNo || loc.address?.street) && (
                              <div className="text-[11px] text-neutral-500 mt-0.5">
                                {[loc.address?.plotNo, loc.address?.street].filter(Boolean).join(", ")}
                              </div>
                            )}
                            <div className="flex items-center gap-1 text-[10px] text-rose-600 mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{loc.contactPerson}{loc.contactNumber ? ` · ${loc.contactNumber}` : ""}</span>
                            </div>
                          </div>
                        </div>
                      ))}
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
                      <div className="text-[13px] font-bold text-neutral-900">{Array.isArray(job?.cargoDetails?.goodsType) ? job.cargoDetails.goodsType.join(", ") : job?.cargoDetails?.goodsType}</div>
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
                        <h4 className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Driver & Truck</h4>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[9px] font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Truck className="w-3 h-3 text-primary" /> Select Fleet Unit
                            </label>
                            <div className="flex items-center gap-2.5">
                              <span className="flex items-center gap-1 text-[9px] font-semibold text-neutral-400">🟢 <span>Compliant</span></span>
                              <span className="flex items-center gap-1 text-[9px] font-semibold text-neutral-400">🟠 <span>Expiring soon</span></span>
                              <span className="flex items-center gap-1 text-[9px] font-semibold text-neutral-400">🔴 <span>Expired</span></span>
                              <span className="flex items-center gap-1 text-[9px] font-semibold text-neutral-400">⚪ <span>No Docs</span></span>
                            </div>
                          </div>
                          <div className="relative">
                            <select
                              value={drivers.find(d => d.name === formData.driver)?._id || ""}
                              onChange={(e) => handleFleetSelect(e.target.value)}
                              disabled={job?.isApproved}
                              className={`bg-white border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-semibold text-slate-900 outline-none w-full focus:border-primary/30 transition-all shadow-sm appearance-none ${job?.isApproved ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <option value="" disabled>{isLoadingDrivers ? "Loading units..." : "Select Fleet Unit"}</option>

                              {availableDrivers.length > 0 && (
                                <optgroup label="── Available ──">
                                  {availableDrivers.map((d) => (
                                    <option key={d._id} value={d._id}>
                                      {complianceDot(d.assignedTruck?.complianceDocs)} {cleanDriverName(d.name)} · {d.assignedTruck?.truckId || "No Truck"}{d.driverStatus === "returning" ? " — RETURNING" : ""}
                                    </option>
                                  ))}
                                </optgroup>
                              )}

                              {onTripDrivers.length > 0 && (
                                <optgroup label="── On Trip — Will Queue ──">
                                  {onTripDrivers.map((d) => (
                                    <option key={d._id} value={d._id}>
                                      {complianceDot(d.assignedTruck?.complianceDocs)} {cleanDriverName(d.name)} · {d.assignedTruck?.truckId || "No Truck"} — ON TRIP
                                    </option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                            {!job?.isApproved && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 pointer-events-none" />}
                          </div>

                          {formData.driver && (
                            <div className="mt-3 p-3 bg-white rounded-xl border border-neutral-100 space-y-2">
                              <div className="flex justify-between">
                                <span className="text-[10px] text-neutral-400 font-bold uppercase">Driver</span>
                                <span className="text-[11px] font-bold text-slate-900">{cleanDriverName(formData.driver)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[10px] text-neutral-400 font-bold uppercase">Vehicle</span>
                                <span className="text-[11px] font-bold text-slate-900">{formData.truckNumber}</span>
                              </div>
                              {/* Compliance status summary */}
                              {(() => {
                                if (!truckDocs.length) return (
                                  <div className="flex justify-between items-center pt-1 border-t border-neutral-50">
                                    <span className="text-[10px] text-neutral-400 font-bold uppercase">Compliance</span>
                                    <span className="text-[10px] font-bold text-neutral-400">No docs on file</span>
                                  </div>
                                );
                                const expired = truckDocs.filter((d: any) => { const x = daysUntil(d.dueDate); return x !== null && x <= 0; });
                                const expiring = truckDocs.filter((d: any) => { const x = daysUntil(d.dueDate); return x !== null && x > 0 && x <= 20; });
                                const isOk = expired.length === 0 && expiring.length === 0;
                                return (
                                  <div className="pt-1 border-t border-neutral-50 space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] text-neutral-400 font-bold uppercase">Compliance</span>
                                      <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg ${expired.length > 0 ? "bg-rose-50 text-rose-600" : expiring.length > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
                                        {expired.length > 0 ? <AlertTriangle className="w-3 h-3" /> : expiring.length > 0 ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                                        {expired.length > 0 ? `${expired.length} Expired` : expiring.length > 0 ? `${expiring.length} Expiring Soon` : "Compliant"}
                                      </span>
                                    </div>
                                    {/* Individual docs */}
                                    <div className="space-y-1 pt-1">
                                      {truckDocs.map((doc: any, i: number) => {
                                        const d = daysUntil(doc.dueDate);
                                        const isExp = d !== null && d <= 0;
                                        const isCrit = d !== null && d > 0 && d <= 7;
                                        const isWarn = d !== null && d > 7 && d <= 20;
                                        return (
                                          <div key={i} className={`flex items-center justify-between px-2 py-1.5 rounded-lg ${isExp ? "bg-rose-50" : isCrit ? "bg-rose-50/50" : isWarn ? "bg-amber-50/50" : "bg-neutral-50"}`}>
                                            <div className="flex items-center gap-1.5">
                                              <FileText className={`w-3 h-3 ${isExp || isCrit ? "text-rose-400" : isWarn ? "text-amber-400" : "text-neutral-300"}`} />
                                              <span className="text-[10px] font-semibold text-slate-700">{doc.type}</span>
                                            </div>
                                            <span className={`text-[9px] font-bold ${isExp ? "text-rose-600" : isCrit ? "text-rose-500" : isWarn ? "text-amber-600" : "text-emerald-600"}`}>
                                              {!doc.dueDate ? "No date" : isExp ? "Expired" : d !== null && d <= 20 ? `${d}d left` : `✓ ${doc.dueDate}`}
                                            </span>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Queue info for on_trip drivers; returning drivers get a simple note */}
                              {formData.driverStatus === "returning" && (
                                <div className="mt-1 pt-2 border-t border-blue-100">
                                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-blue-50 rounded-lg border border-blue-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />
                                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">
                                      Driver returning — trip starts after truck inspection
                                    </span>
                                  </div>
                                </div>
                              )}

                              {formData.driverStatus === "on_trip" && (
                                <div className="mt-1 pt-2 border-t border-amber-100 space-y-1.5">
                                  <div className="flex items-center gap-1.5 px-2 py-1.5 bg-amber-50 rounded-lg border border-amber-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                                      {`Driver on trip — this job will be queued at position ${queuePosition}`}
                                    </span>
                                  </div>
                                  {driverQueueInfo.length > 0 && (
                                    <div className="px-2 py-1.5 bg-neutral-50 rounded-lg border border-neutral-100">
                                      <div className="flex items-center gap-1.5 mb-1.5">
                                        <ListOrdered className="w-3 h-3 text-neutral-400" />
                                        <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                                          Current Queue ({driverQueueInfo.length} trip{driverQueueInfo.length > 1 ? "s" : ""})
                                        </span>
                                      </div>
                                      {driverQueueInfo.map((a: any, idx: number) => (
                                        <div key={a._id} className="flex items-center gap-2 py-1 border-b border-neutral-50 last:border-0">
                                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0 ${a.queueStatus === "active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                            {idx + 1}
                                          </span>
                                          <span className="text-[10px] text-neutral-600 font-medium truncate">
                                            {a.bookingId?.tripId || `#${(a.bookingId?._id || a.bookingId)?.toString().slice(-6).toUpperCase()}`}
                                          </span>
                                          <span className={`ml-auto text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${a.queueStatus === "active" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                                            {a.queueStatus}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
