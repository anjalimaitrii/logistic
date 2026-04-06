"use client";

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function CreateDriverModal({ isOpen, onClose, onSubmit }: CreateDriverModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border border-neutral-100 rounded-[32px] shadow-2xl overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">Add New Driver</h2>
            <p className="text-[12px] font-medium text-neutral-400 mt-0.5">Register a new driver to the fleet system</p>
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
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Personal Information
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900 placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner"
                  placeholder="e.g. Adebayo Okafor"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900 placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner"
                  placeholder="+234 ..."
                />
              </div>
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4 pt-6 border-t border-neutral-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-900 uppercase tracking-widest px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
              Professional Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  License Number
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900"
                  placeholder="ABC-12345-XYZ"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900"
                  placeholder="5"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900"
                  placeholder="Name / Phone"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Assigned Truck (Optional)
                </label>
                <select className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900 outline-none">
                   <option>Select Truck</option>
                   <option>TRK-014</option>
                   <option>TRK-022</option>
                </select>
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
            Confirm & Add Driver
          </button>
          <button
            className="px-6 bg-white border border-neutral-100 text-neutral-400 font-bold rounded-xl hover:bg-neutral-100 hover:text-neutral-900 transition-all text-[13px] uppercase tracking-widest"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
