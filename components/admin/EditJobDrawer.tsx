"use client";

import { useState, useEffect } from "react";
import {
  X,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface EditJobDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  job: any | null;
  onUpdate: (id: string, data: any) => void;
}

export default function EditJobDrawer({ isOpen, onClose, job, onUpdate }: EditJobDrawerProps) {
  const [formData, setFormData] = useState({
    finalAmount: "",
    advancePaid: "",
    specialRequest: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData({
        finalAmount: job.finalAmount || "",
        advancePaid: job.advancePaid || "",
        specialRequest: job.specialRequest || ""
      });
    }
  }, [job, isOpen]);

  const handleSubmit = async () => {
    if (!formData.finalAmount || Number(formData.finalAmount) <= 0) {
      alert("Job amount must be greater than 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      await onUpdate(job._id, {
        finalAmount: Number(formData.finalAmount),
        advancePaid: Number(formData.advancePaid),
        specialRequest: formData.specialRequest
      });
      onClose();
    } catch (error) {
      console.error("Failed to update job:", error);
      alert("Failed to update job details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[700] pointer-events-none">
      <div
        className={`absolute inset-0 bg-neutral-900/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      <div className={`absolute right-0 top-0 bottom-0 w-full max-w-[420px] bg-white shadow-2xl transition-transform duration-300 pointer-events-auto flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
               <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                 <CheckCircle2 className="w-4 h-4" />
               </div>
               <h2 className="text-[16px] font-bold text-neutral-900 tracking-tight">Edit Job Details</h2>
            </div>
            <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest ml-7.5">Job ID: {job?.tripId || job?._id}</p>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white hover:shadow-sm rounded-xl text-neutral-400 transition-all border border-transparent hover:border-neutral-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Warning Note */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-3">
             <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
             <div>
                <p className="text-[12px] font-bold text-amber-900 mb-0.5">Financial Update</p>
                <p className="text-[11px] text-amber-700 leading-relaxed font-medium">Changing these values will reflect in the official settlement and reports. Please ensure data accuracy.</p>
             </div>
          </div>

          <div className="space-y-6">
            {/* Amount Fields */}
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Final Deal Amount (K)</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[14px] font-bold shadow-lg shadow-slate-900/10">K</div>
                  <input
                    type="number"
                    value={formData.finalAmount}
                    onChange={(e) => setFormData({ ...formData, finalAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-transparent rounded-2xl py-4 pl-14 pr-6 text-[18px] font-bold text-slate-950 outline-none focus:bg-white focus:border-primary/20 focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Advance Paid to Driver (K)</label>
                <div className="relative group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-[14px] font-bold shadow-lg shadow-emerald-600/10">K</div>
                  <input
                    type="number"
                    value={formData.advancePaid}
                    onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-transparent rounded-2xl py-4 pl-14 pr-6 text-[18px] font-bold text-emerald-700 outline-none focus:bg-white focus:border-emerald-500/20 focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Special Request */}
            <div className="space-y-2 pt-2">
              <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-widest ml-1">Notes / Special Request</label>
              <div className="relative group">
                <FileText className="absolute left-4 top-4 w-4 h-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
                <textarea
                  rows={5}
                  value={formData.specialRequest}
                  onChange={(e) => setFormData({ ...formData, specialRequest: e.target.value })}
                  placeholder="Update instructions or notes..."
                  className="w-full bg-slate-50 border border-transparent rounded-[24px] py-4 pl-12 pr-6 text-[13px] font-medium text-neutral-900 focus:bg-white focus:border-primary/20 outline-none transition-all shadow-inner resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-neutral-100 bg-white flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 border border-neutral-100 rounded-2xl text-[11px] font-bold text-neutral-400 uppercase tracking-widest hover:bg-neutral-50 transition-all"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-[1.5] px-8 py-4 bg-primary text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Save Changes"}
            {!isSubmitting && <CheckCircle2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
