"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
   X,
   ShieldCheck,
   FileText,
   Settings,
   Calendar,
   Upload,
   Hash,
   Wrench,
   DollarSign,
   ChevronDown,
   Check,
} from "lucide-react";
import { truckService } from "@/services/truckService";

interface TruckComplianceDrawerProps {
   isOpen: boolean;
   onClose: () => void;
   truckId: string | null;
}

const COMPLIANCE_DOC_TYPES = [
   "White Book",
   "Fitness",
   "Road Tax",
   "Insurance",
   "Identity",
];

const TYRE_POSITIONS = [
   "Front Left (1)",
   "Front Right (2)",
   "1st Axle Left Inner (3)",
   "1st Axle Right Inner (4)",
   "1st Axle Left Outer (5)",
   "1st Axle Right Outer (6)",
   "2nd Axle Left Inner (7)",
   "2nd Axle Right Inner (8)",
   "2nd Axle Left Outer (9)",
   "2nd Axle Right Outer (10)",
   "3rd Axle Left Inner (11)",
   "3rd Axle Right Inner (12)",
   "3rd Axle Left Outer (13)",
   "3rd Axle Right Outer (14)",
   "4th Axle Left Inner (15)",
   "4th Axle Right Inner (16)",
   "4th Axle Left Outer (17)",
   "4th Axle Right Outer (18)",
   "5th Axle Left Inner (19)",
   "5th Axle Right Inner (20)",
   "5th Axle Left Outer (21)",
   "5th Axle Right Outer (22)",
   "Spare Tyre (23)",
];

const defaultDocs = () =>
   COMPLIANCE_DOC_TYPES.map((type) => ({ type, dueDate: "", file: "" }));

export default function TruckComplianceDrawer({ isOpen, onClose, truckId }: TruckComplianceDrawerProps) {
   const [activeTab, setActiveTab] = useState<"compliance" | "technical">("compliance");
   const [docs, setDocs] = useState(defaultDocs());
   const [maintenanceFareCost, setMaintenanceFareCost] = useState("");
   const [currentService, setCurrentService] = useState("");
   const [nextService, setNextService] = useState("");
   const [nextServiceDate, setNextServiceDate] = useState("");
   const [tyrePositions, setTyrePositions] = useState<string[]>([]);
   const [tyreDropdownOpen, setTyreDropdownOpen] = useState(false);
   const tyreDropdownRef = useRef<HTMLDivElement>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [truckPlateNo, setTruckPlateNo] = useState("");

   useEffect(() => {
      if (isOpen && truckId) {
         loadTruckDetails();
      }
   }, [isOpen, truckId]);

   const loadTruckDetails = async () => {
      try {
         setIsLoading(true);
         const data = await truckService.getById(truckId!);
         setTruckPlateNo(data.truckId);
         setMaintenanceFareCost(data.maintenanceFareCost || "");
         setCurrentService(data.currentService || "");
         setNextService(data.nextService || "");
         setNextServiceDate(data.nextServiceDate || data.estNextServiceDate || "");
         setTyrePositions(Array.isArray(data.tireSerialNumber) ? data.tireSerialNumber : data.tireSerialNumber ? [data.tireSerialNumber] : []);

         if (data.complianceDocs && data.complianceDocs.length > 0) {
            // Merge saved docs with the required types (add missing ones)
            const merged = COMPLIANCE_DOC_TYPES.map((type) => {
               const saved = data.complianceDocs.find((d: any) => d.type === type);
               return saved || { type, dueDate: "", file: "" };
            });
            setDocs(merged);
         } else {
            setDocs(defaultDocs());
         }
      } catch (error) {
         console.error("Failed to load truck details:", error);
      } finally {
         setIsLoading(false);
      }
   };

   const handleSave = async () => {
      try {
         setIsLoading(true);
         await truckService.update(truckId!, {
            complianceDocs: docs,
            maintenanceFareCost,
            currentService,
            nextService,
            nextServiceDate,
            tireSerialNumber: tyrePositions,
         });
         onClose();
      } catch (error) {
         console.error("Failed to update truck compliance:", error);
         alert("Failed to save changes.");
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      const handler = (e: MouseEvent) => {
         if (tyreDropdownRef.current && !tyreDropdownRef.current.contains(e.target as Node)) {
            setTyreDropdownOpen(false);
         }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
   }, []);

   const toggleTyrePosition = (pos: string) => {
      setTyrePositions(prev =>
         prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
      );
   };

   const updateDocDate = (type: string, date: string) => {
      setDocs((prev) => prev.map((d) => (d.type === type ? { ...d, dueDate: date } : d)));
   };

   const handleFileUpload = (type: string, file: File) => {
      setDocs((prev) => prev.map((d) => (d.type === type ? { ...d, file: file.name } : d)));
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
                           <div className="flex items-center gap-2 mb-0.5">
                              <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Vehicle Compliance</h2>
                              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase tracking-widest">{truckPlateNo}</span>
                           </div>
                           <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-widest">Document & Logistics Management</p>
                        </div>
                        <button
                           onClick={onClose}
                           className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white border border-transparent hover:border-neutral-100 text-neutral-400 transition-all"
                        >
                           <X className="w-5 h-5" />
                        </button>
                     </div>

                     {/* Navigation Tabs */}
                     <div className="flex px-6 border-b border-neutral-50 bg-white">
                        <button
                           onClick={() => setActiveTab("compliance")}
                           className={`py-4 px-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === "compliance" ? "border-primary text-primary" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}
                        >
                           Compliance
                        </button>
                        <button
                           onClick={() => setActiveTab("technical")}
                           className={`py-4 px-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === "technical" ? "border-primary text-primary" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}
                        >
                           Technical
                        </button>
                     </div>

                     {/* Form Body */}
                     <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                        {isLoading ? (
                           <div className="flex items-center justify-center h-40">
                              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                           </div>
                        ) : (
                           <>
                              {/* ── COMPLIANCE TAB ── */}
                              {activeTab === "compliance" && (
                                 <section className="space-y-6">
                                    <div className="flex items-center gap-2 px-1">
                                       <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                          <ShieldCheck className="w-3.5 h-3.5" />
                                       </div>
                                       <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Registry & Permits</h3>
                                    </div>

                                    <div className="space-y-3">
                                       {docs.map((doc, idx) => (
                                          <div key={idx} className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 hover:bg-neutral-100/50 transition-all group">
                                             <div className="flex justify-between items-start mb-4">
                                                <div>
                                                   <span className="text-[13px] font-semibold text-slate-900">{doc.type}</span>
                                                   <div className="flex items-center gap-3 text-[10px] font-medium text-neutral-400 mt-0.5">
                                                      <span className="flex items-center gap-1">
                                                         <Calendar className="w-3 h-3" /> Due: {doc.dueDate || "Not Set"}
                                                      </span>
                                                      <span className="text-neutral-200">|</span>
                                                      <span className={`flex items-center gap-1 ${doc.file ? "text-primary font-bold" : ""}`}>
                                                         <FileText className="w-3 h-3" /> {doc.file || "No File"}
                                                      </span>
                                                   </div>
                                                </div>
                                             </div>

                                             <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                   <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Renewal Date</label>
                                                   <input
                                                      type="date"
                                                      className="w-full bg-white border border-neutral-100 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-primary/20"
                                                      value={doc.dueDate}
                                                      onChange={(e) => updateDocDate(doc.type, e.target.value)}
                                                   />
                                                </div>
                                                <div className="space-y-1">
                                                   <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Upload</label>
                                                   <input
                                                      type="file"
                                                      id={`file-upload-${idx}`}
                                                      className="hidden"
                                                      onChange={(e) => {
                                                         const file = e.target.files?.[0];
                                                         if (file) handleFileUpload(doc.type, file);
                                                      }}
                                                   />
                                                   <button
                                                      onClick={() => document.getElementById(`file-upload-${idx}`)?.click()}
                                                      className="w-full py-2 bg-neutral-100/80 text-neutral-500 text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-1.5 border border-dashed border-neutral-200"
                                                   >
                                                      <Upload className="w-3 h-3" />
                                                      Upload Doc
                                                   </button>
                                                </div>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </section>
                              )}

                              {/* ── TECHNICAL TAB ── */}
                              {activeTab === "technical" && (
                                 <section className="space-y-8">
                                    {/* Maintenance */}
                                    <div className="space-y-5">
                                       <div className="flex items-center gap-2 px-1">
                                          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                             <Wrench className="w-3.5 h-3.5" />
                                          </div>
                                          <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Maintenance</h3>
                                       </div>

                                       <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-4">
                                          {/* Maintenance Fare Cost */}
                                          <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                                <DollarSign className="w-3 h-3" /> Maintenance Fare Cost (₦)
                                             </label>
                                             <input
                                                type="number"
                                                className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 outline-none focus:border-primary/20 transition-all placeholder:text-neutral-300"
                                                placeholder="e.g. 50000"
                                                value={maintenanceFareCost}
                                                onChange={(e) => setMaintenanceFareCost(e.target.value)}
                                             />
                                          </div>

                                          {/* Current Service */}
                                          <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Current Service</label>
                                             <input
                                                type="text"
                                                className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 outline-none focus:border-primary/20 transition-all placeholder:text-neutral-300"
                                                placeholder="e.g. Oil Change, Brake Check"
                                                value={currentService}
                                                onChange={(e) => setCurrentService(e.target.value)}
                                             />
                                          </div>

                                          {/* Next Service */}
                                          <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Next Service</label>
                                             <input
                                                type="text"
                                                className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 outline-none focus:border-primary/20 transition-all placeholder:text-neutral-300"
                                                placeholder="e.g. Full Service, Tyre Rotation"
                                                value={nextService}
                                                onChange={(e) => setNextService(e.target.value)}
                                             />
                                          </div>

                                          {/* Next Service Date */}
                                          <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                                <Calendar className="w-3 h-3" /> Next Service Date
                                             </label>
                                             <input
                                                type="date"
                                                className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 outline-none focus:border-primary/20 transition-all"
                                                value={nextServiceDate}
                                                onChange={(e) => setNextServiceDate(e.target.value)}
                                             />
                                          </div>
                                       </div>
                                    </div>

                                    {/* Tire Serial Number */}
                                    <div className="space-y-5">
                                       <div className="flex items-center gap-2 px-1">
                                          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                                             <Hash className="w-3.5 h-3.5" />
                                          </div>
                                          <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Tyre Position</h3>
                                       </div>

                                       <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4">
                                          <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                                                Select Tyre Position{tyrePositions.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-white rounded text-[8px]">{tyrePositions.length}</span>}
                                             </label>
                                             <div className="relative" ref={tyreDropdownRef}>
                                                {/* Trigger */}
                                                <button
                                                   type="button"
                                                   onClick={() => setTyreDropdownOpen(v => !v)}
                                                   className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-slate-900 outline-none focus:border-primary/20 transition-all flex items-center justify-between gap-2 text-left"
                                                >
                                                   <span className={tyrePositions.length === 0 ? "text-neutral-300" : "text-slate-900"}>
                                                      {tyrePositions.length === 0
                                                         ? "Select positions..."
                                                         : tyrePositions.length === 1
                                                         ? tyrePositions[0]
                                                         : `${tyrePositions.length} positions selected`}
                                                   </span>
                                                   <ChevronDown className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${tyreDropdownOpen ? "rotate-180" : ""}`} />
                                                </button>

                                                {/* Dropdown list */}
                                                {tyreDropdownOpen && (
                                                   <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-neutral-100 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto">
                                                      {TYRE_POSITIONS.map((pos) => {
                                                         const selected = tyrePositions.includes(pos);
                                                         return (
                                                            <button
                                                               key={pos}
                                                               type="button"
                                                               onClick={() => toggleTyrePosition(pos)}
                                                               className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-[12px] font-medium transition-colors hover:bg-neutral-50 ${selected ? "text-primary" : "text-slate-700"}`}
                                                            >
                                                               <span className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${selected ? "bg-primary border-primary" : "border-neutral-200"}`}>
                                                                  {selected && <Check className="w-2.5 h-2.5 text-white" />}
                                                               </span>
                                                               {pos}
                                                            </button>
                                                         );
                                                      })}
                                                   </div>
                                                )}
                                             </div>

                                             {/* Selected chips */}
                                             {tyrePositions.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 pt-1">
                                                   {tyrePositions.map(pos => (
                                                      <span key={pos} className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-bold">
                                                         {pos}
                                                         <button type="button" onClick={() => toggleTyrePosition(pos)} className="hover:text-rose-500 transition-colors ml-0.5">×</button>
                                                      </span>
                                                   ))}
                                                </div>
                                             )}
                                          </div>
                                       </div>
                                    </div>
                                 </section>
                              )}
                           </>
                        )}
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
                           onClick={handleSave}
                           disabled={isLoading}
                           className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                           {isLoading ? "Saving..." : "Save All Changes"}
                        </button>
                     </div>
                  </motion.div>
               </>
            )}
         </AnimatePresence>
      </div>
   );
}
