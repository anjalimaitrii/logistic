"use client";

import { useState } from "react";
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

interface TruckComplianceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  truckId: string | null;
}

export default function TruckComplianceDrawer({ isOpen, onClose, truckId }: TruckComplianceDrawerProps) {
  const [activeTab, setActiveTab] = useState<'compliance' | 'finance' | 'technical'>('compliance');
  const [fastagBalance, setFastagBalance] = useState("4,250");
  const [tireNumbers, setTireNumbers] = useState("");
  const [docs, setDocs] = useState([
     { type: 'Insurance', dueDate: '2026-12-15', status: 'Active' },
     { type: 'Registration (RC)', dueDate: '2028-04-20', status: 'Active' },
     { type: 'Pollution (PUC)', dueDate: '2026-05-10', status: 'Expiring Soon' },
     { type: 'State Taxation', dueDate: '2026-08-30', status: 'Active' },
  ]);

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
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase tracking-widest">{truckId}</span>
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
                    onClick={() => setActiveTab('finance')}
                    className={`py-4 px-4 text-[11px] font-bold uppercase tracking-widest border-b-2 transition-all ${activeTab === 'finance' ? 'border-primary text-primary' : 'border-transparent text-neutral-400 hover:text-neutral-600'}`}
                 >
                    Financials
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
                                       {doc.status === 'Expiring Soon' && (
                                          <span className="flex items-center gap-1 text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full uppercase">
                                             <AlertCircle className="w-2.5 h-2.5" /> Soon
                                          </span>
                                       )}
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] font-medium text-neutral-400">
                                       <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due: {doc.dueDate}</span>
                                    </div>
                                 </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Renewal Date</label>
                                    <input type="date" className="w-full bg-white border border-neutral-100 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-900 outline-none focus:border-primary/20" defaultValue={doc.dueDate} />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-neutral-400 uppercase tracking-tighter">Action</label>
                                    <button className="w-full py-2 bg-neutral-100/80 text-neutral-500 text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-primary/10 hover:text-primary transition-all flex items-center justify-center gap-1.5 border border-dashed border-neutral-200">
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

                {activeTab === 'finance' && (
                  <section className="space-y-6">
                     <div className="flex items-center gap-2 px-1">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                           <Wallet className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Asset Financials</h3>
                     </div>

                     <div className="bg-neutral-50 border border-neutral-100 rounded-[28px] p-6 relative overflow-hidden shadow-sm">
                        <div className="relative z-10 flex items-center justify-between">
                           <div>
                              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mb-1 block">Fastag Balance</span>
                              <div className="flex items-end gap-2">
                                 <span className="text-3xl font-bold tracking-tight text-slate-900">₹{fastagBalance}</span>
                                 <span className="text-[11px] font-semibold text-primary mb-1.5 uppercase tracking-wider">Active</span>
                              </div>
                              <p className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest mt-1">Linked to: {truckId}</p>
                           </div>
                           <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                              <Wallet className="w-7 h-7" />
                           </div>
                        </div>
                     </div>

                     <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-100 space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Add Money to Fastag</label>
                           <div className="flex gap-2">
                              <div className="relative flex-1">
                                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-bold text-slate-400">₹</span>
                                 <input 
                                    type="text" 
                                    placeholder="Amount" 
                                    className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-4 py-3 text-[13px] font-bold text-slate-900 outline-none focus:border-primary/30 transition-all shadow-inner"
                                 />
                              </div>
                              <button className="bg-primary text-white px-6 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                                 Recharge
                              </button>
                           </div>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
                           <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                           <p className="text-[10px] font-medium text-amber-700 leading-snug">Balance is below threshold (₹5,000). Please recharge to avoid toll delays.</p>
                        </div>
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
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Next Service</span>
                              <div className="space-y-0.5">
                                 <p className="text-lg font-bold text-slate-900 tracking-tight">15,000 <span className="text-[11px] font-medium text-slate-400">km</span></p>
                                 <p className="text-[9px] font-medium text-emerald-600 uppercase">2,600 km remaining</p>
                              </div>
                           </div>
                           <div className="bg-neutral-50 border border-neutral-100 rounded-2xl p-4 space-y-3">
                              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">Est. Date</span>
                              <div className="space-y-0.5">
                                 <p className="text-lg font-bold text-slate-900 tracking-tight">12 May</p>
                                 <p className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest">2026</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </section>
                )}

              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3">
                <button 
                  onClick={onClose}
                  className="px-6 py-4 bg-white border border-neutral-100 rounded-2xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all flex items-center justify-center gap-2"
                >
                  Close Manager
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 px-8 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Save All Changes
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
