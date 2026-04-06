"use client";

import { useState } from "react";

interface CreateSecretJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function CreateSecretJobModal({ isOpen, onClose, onSubmit }: CreateSecretJobModalProps) {
  const [withTax, setWithTax] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border border-neutral-100 rounded-[32px] shadow-2xl overflow-hidden animate-fade-up">
        
        {/* Special Header */}
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-linear-to-r from-indigo-50/50 to-amber-50/30">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-200">Secret</span>
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Special Protocol</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Create Special Job</h2>
            <p className="text-[12px] font-medium text-neutral-400 mt-0.5">Custom assignment with specialized tax configuration</p>
          </div>
          <button
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-neutral-100 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-8">
          
          {/* Tax Configuration - THE EXTRA FEATURE */}
          <div className="p-5 rounded-[24px] bg-neutral-50 border border-neutral-100 space-y-4">
             <div className="flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-bold text-neutral-900">Tax Configuration</h3>
                   <p className="text-[11px] text-neutral-400 font-medium">Toggle if this job should include standard GST/Tax</p>
                </div>
                <div className="flex bg-white p-1 rounded-xl border border-neutral-100 shadow-sm">
                   <button 
                    onClick={() => setWithTax(true)}
                    className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${withTax ? 'bg-indigo-600 text-white shadow-md' : 'text-neutral-400 hover:text-neutral-600'}`}
                   >
                      WITH TAX
                   </button>
                   <button 
                    onClick={() => setWithTax(false)}
                    className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${!withTax ? 'bg-amber-500 text-white shadow-md' : 'text-neutral-400 hover:text-neutral-600'}`}
                   >
                      WITHOUT TAX
                   </button>
                </div>
             </div>
             
             {!withTax && (
                <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 rounded-xl border border-amber-100 animate-fade-in">
                   <span className="text-lg">⚠️</span>
                   <p className="text-[10px] font-bold text-amber-700 leading-tight">
                      This job will be flagged as <span className="underline">Tax Exempt</span>. 
                      Ensure proper documentation is logged in the Special Ledger.
                   </p>
                </div>
             )}
          </div>

          {/* Party Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              Special Client Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Client / Entity Name
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-inner"
                  placeholder="Apex Logistics, Bridge-Link..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Reference ID (Optional)
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900 placeholder:text-neutral-300 outline-none shadow-inner"
                  placeholder="SL-XXXXX"
                />
              </div>
            </div>
          </div>

          {/* Logistics Data */}
          <div className="space-y-4 pt-6 border-t border-neutral-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-900 uppercase tracking-widest px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
              Route & Cargo
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Pickup Point
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900 shadow-inner"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Destination
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900 shadow-inner"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
          <button
            className="flex-1 bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-xl shadow-indigo-100 hover:scale-[1.01] active:scale-[0.99] transition-all text-[13px] uppercase tracking-widest"
            onClick={() => onSubmit({ withTax })}
          >
            Dispatch Special Job
          </button>
          <button
            className="px-8 bg-white border border-neutral-100 text-neutral-400 font-bold rounded-xl hover:bg-neutral-100 hover:text-neutral-900 transition-all text-[13px] uppercase tracking-widest"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
