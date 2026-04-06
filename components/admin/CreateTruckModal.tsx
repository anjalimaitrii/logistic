"use client";

interface CreateTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function CreateTruckModal({ isOpen, onClose, onSubmit }: CreateTruckModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border border-neutral-100 rounded-[32px] shadow-2xl overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-[#0F172A]">Add New Truck</h2>
            <p className="text-[12px] font-medium text-neutral-400 mt-0.5">Register a new vehicle to the fleet</p>
          </div>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-neutral-100 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
          {/* Vehicle Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Vehicle Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Truck ID / Plate No.
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-[#0F172A] placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner"
                  placeholder="e.g. TRK-045"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Model / Make
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-[#0F172A] placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner"
                  placeholder="e.g. Volvo FH16"
                />
              </div>
            </div>
          </div>

          {/* Technical Specs */}
          <div className="space-y-4 pt-6 border-t border-neutral-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-[#0F172A] uppercase tracking-widest px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0F172A]" />
              Technical Specifications
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Capacity (Tons)
                </label>
                <input
                  type="number"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-[#0F172A]"
                  placeholder="e.g. 30"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                   Year of Manufacture
                </label>
                <input
                  type="number"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-[#0F172A]"
                  placeholder="2024"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Fuel Type
                </label>
                <select className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-[#0F172A] outline-none">
                   <option>Diesel</option>
                   <option>Petrol</option>
                   <option>Electric</option>
                   <option>CNG</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Maintenance Schedule
                </label>
                <input
                  type="date"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-[#0F172A]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
          <button
            className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] transition-all text-[13px] uppercase tracking-widest"
            onClick={() => onSubmit({})}
          >
            Confirm & Add Truck
          </button>
          <button
            className="px-6 bg-white border border-neutral-100 text-neutral-400 font-bold rounded-xl hover:bg-neutral-100 hover:text-[#0F172A] transition-all text-[13px] uppercase tracking-widest"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
