import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, ShieldCheck, Phone, MapPin } from "lucide-react";

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export default function CreateDriverModal({ isOpen, onClose, onSubmit }: CreateDriverModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    licenseType: "Class A",
    licenseNo: "",
    experience: "5",
    emergencyContact: "",
    assignedTruck: "Select Truck"
  });

  const handleFormSubmit = () => {
    onSubmit(formData);
    onClose();
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
              className="absolute right-0 top-0 bottom-0 w-full max-w-[450px] bg-white shadow-2xl pointer-events-auto flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
                <div>
                  <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">Add New Driver</h2>
                  <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">Register personnel to fleet</p>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white border border-transparent hover:border-neutral-100 text-neutral-400 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                
                {/* Section 1: Personal Info */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2 px-1">
                      <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                         <User className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Personal Information</h3>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-100 shadow-sm">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="e.g. Adebayo Okafor"
                          className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 focus:border-primary/20 outline-none transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest ml-1">Phone Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            placeholder="+234 ..."
                            className="w-full bg-white border border-neutral-100 rounded-xl pl-9 pr-4 py-2.5 text-[13px] font-semibold text-slate-900 focus:border-primary/20 outline-none transition-all shadow-sm"
                          />
                          <Phone className="w-3.5 h-3.5 text-neutral-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                   </div>
                </section>

                {/* Section 2: Professional Details */}
                <section className="space-y-4">
                   <div className="flex items-center gap-2 px-1">
                      <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                         <ShieldCheck className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Compliance & Skills</h3>
                   </div>

                   <div className="grid grid-cols-2 gap-3">
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1">
                          License Type
                        </label>
                        <select 
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full cursor-pointer"
                          value={formData.licenseType}
                          onChange={(e) => setFormData({...formData, licenseType: e.target.value})}
                        >
                           <option>Class A</option>
                           <option>Class B</option>
                           <option>Heavy Vehicle</option>
                        </select>
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                        <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1">
                          Experience (Yrs)
                        </label>
                        <input
                          type="number"
                          className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                          value={formData.experience}
                          onChange={(e) => setFormData({...formData, experience: e.target.value})}
                        />
                      </div>
                   </div>

                   <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1">
                        License Number
                      </label>
                      <input
                        type="text"
                        className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                        placeholder="ABC-12345-XYZ"
                        value={formData.licenseNo}
                        onChange={(e) => setFormData({...formData, licenseNo: e.target.value})}
                      />
                   </div>

                   <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 space-y-1.5">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1">
                         Assigned Truck
                      </label>
                      <select 
                        className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full cursor-pointer"
                        value={formData.assignedTruck}
                        onChange={(e) => setFormData({...formData, assignedTruck: e.target.value})}
                      >
                         <option>Select Truck</option>
                         <option>TRK-014 (Volvo)</option>
                         <option>TRK-022 (Scania)</option>
                         <option>TRK-038 (Mack)</option>
                      </select>
                   </div>
                </section>

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
                  onClick={handleFormSubmit}
                  className="flex-1 px-8 py-4 bg-primary text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  Create Driver Profile
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
