"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
   X,
   ShieldCheck,
   FileText,
   Wallet,
   Settings,
   Calendar,
   Upload,
   AlertCircle,
   Hash,
   Wrench
} from "lucide-react";
import { truckService } from "@/services/truckService";

interface TruckComplianceDrawerProps {
   isOpen: boolean;
   onClose: () => void;
   truckId: string | null; // This is the MongoDB _id
}

export default function TruckComplianceDrawer({ isOpen, onClose, truckId }: TruckComplianceDrawerProps) {
   const [activeTab, setActiveTab] = useState<'compliance' | 'technical'>('compliance');
   const [fastagBalance, setFastagBalance] = useState("0");
   const [tireNumbers, setTireNumbers] = useState("");
   const [nextServiceKm, setNextServiceKm] = useState("");
   const [estNextServiceDate, setEstNextServiceDate] = useState("");
   const [docs, setDocs] = useState([
      { type: 'Insurance', dueDate: '', file: '' },
      { type: 'Registration (RC)', dueDate: '', file: '' },
      { type: 'Pollution (PUC)', dueDate: '', file: '' },
      { type: 'State Taxation', dueDate: '', file: '' },
   ]);
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
         setFastagBalance(data.fastagBalance || "0");
         setTireNumbers(data.tireNumbers || "");
         setNextServiceKm(data.nextServiceKm || "");
         setEstNextServiceDate(data.estNextServiceDate || "");
         
         if (data.complianceDocs && data.complianceDocs.length > 0) {
            setDocs(data.complianceDocs);
         } else {
            // Reset to defaults if no docs in backend
            setDocs([
               { type: 'Insurance', dueDate: '', file: '' },
               { type: 'Registration (RC)', dueDate: '', file: '' },
               { type: 'Pollution (PUC)', dueDate: '', file: '' },
               { type: 'State Taxation', dueDate: '', file: '' },
            ]);
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
            fastagBalance,
            tireNumbers,
            nextServiceKm,
            estNextServiceDate
         });
         onClose();
      } catch (error) {
         console.error("Failed to update truck compliance:", error);
         alert("Failed to save changes.");
      } finally {
         setIsLoading(false);
      }
   };

   const updateDocDate = (type: string, date: string) => {
      setDocs(prev => prev.map(d => d.type === type ? { ...d, dueDate: date } : d));
   };

   const handleFileUpload = (type: string, file: File) => {
      setDocs(prev => prev.map(d => d.type === type ? { ...d, file: file.name } : d));
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
                           onClick={() => setActiveTab('compliance')}
                           className={`py-4 px-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'compliance' ? 'border-primary text-primary' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                        >
                           Compliance
                        </button>
                        <button
                           onClick={() => setActiveTab('technical')}
                           className={`py-4 px-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'technical' ? 'border-primary text-primary' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
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
                              {activeTab === 'compliance' && (
                                 <section className="space-y-6">
                                    <div className="flex items-center justify-between px-1">
                                       <div className="flex items-center gap-2">
                                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                                             <ShieldCheck className="w-3.5 h-3.5" />
                                          </div>
                                          <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Registry & Permits</h3>
                                       </div>
                                    </div>

                                    <div className="space-y-3">
                                       {docs.map((doc, idx) => (
                                          <div key={idx} className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 transition-all hover:bg-neutral-100/50 group">
                                             <div className="flex justify-between items-start mb-4">
                                                <div>
                                                   <div className="flex items-center gap-2 mb-1">
                                                      <span className="text-[13px] font-semibold text-slate-900">{doc.type}</span>
                                                   </div>
                                                   <div className="flex items-center gap-3 text-[10px] font-medium text-neutral-400">
                                                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {doc.dueDate || "Not Set"}</span>
                                                      <span className="text-neutral-200">|</span>
                                                      <span className={`flex items-center gap-1 ${doc.file ? 'text-primary font-bold' : ''}`}>
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
                                                   <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Action</label>
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

                              {activeTab === 'technical' && (
                                 <section className="space-y-8">
                                    <div className="space-y-6">
                                       <div className="flex items-center gap-2 px-1">
                                          <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                                             <Hash className="w-3.5 h-3.5" />
                                          </div>
                                          <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Technical Assets</h3>
                                       </div>

                                       <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-4">
                                          <div className="space-y-1.5">
                                             <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">Tire Serial Numbers</label>
                                             <textarea
                                                className="w-full bg-white border border-neutral-100 rounded-xl p-4 text-[13px] font-semibold text-slate-900 focus:border-primary/20 outline-none transition-all placeholder:text-neutral-300 min-h-[120px] shadow-sm resize-none"
                                                placeholder="e.g. T-9811 (FL), T-9812 (FR)..."
                                                value={tireNumbers}
                                                onChange={(e) => setTireNumbers(e.target.value)}
                                             />
                                          </div>
                                       </div>
                                    </div>

                                    <div className="space-y-6">
                                       <div className="flex items-center gap-2 px-1">
                                          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                                             <Wrench className="w-3.5 h-3.5" />
                                          </div>
                                          <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Maintenance Forecast</h3>
                                       </div>

                                       <div className="grid grid-cols-2 gap-4">
                                          <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-3">
                                             <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Next Service (KM)</span>
                                             <input 
                                                type="text"
                                                className="w-full bg-white border border-neutral-100 rounded-lg px-2 py-1 text-[13px] font-bold text-slate-900 outline-none"
                                                value={nextServiceKm}
                                                onChange={(e) => setNextServiceKm(e.target.value)}
                                                placeholder="15,000"
                                             />
                                          </div>
                                          <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-3">
                                             <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Est. Date</span>
                                             <input 
                                                type="date"
                                                className="w-full bg-white border border-neutral-100 rounded-lg px-2 py-1 text-[13px] font-bold text-slate-900 outline-none"
                                                value={estNextServiceDate}
                                                onChange={(e) => setEstNextServiceDate(e.target.value)}
                                             />
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
