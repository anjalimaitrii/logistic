import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, ShieldCheck, MapPin } from "lucide-react";
import PhoneInput from "@/components/admin/PhoneInput";
import { DEFAULT_DIAL_CODE, joinDialCode, splitDialCode } from "@/lib/dialCodes";
import { truckService } from "@/services/truckService";

interface CreateDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any; // For editing mode
}

export default function CreateDriverModal({ isOpen, onClose, onSubmit, initialData }: CreateDriverModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    // The dial code is a control on the form; phone is stored as one string.
    phoneCode: DEFAULT_DIAL_CODE,
    phone: "",
    nrc: "",
    experience: "5",
    assignedTruck: ""
  });
  const [trucks, setTrucks] = useState<any[]>([]);
  // Editing an existing driver? Trakzee-sourced fields are locked so they stay in sync.
  const isEdit = !!initialData;

  useEffect(() => {
    if (isOpen) {
      loadTrucks();
      if (initialData) {
        const saved = splitDialCode(initialData.phone);
        setFormData({
          name: initialData.name || "",
          phoneCode: saved.code,
          phone: saved.rest,
          nrc: initialData.nrc || "",
          experience: initialData.experience?.toString() || "5",
          assignedTruck: initialData.assignedTruck?._id || initialData.assignedTruck || ""
        });
      } else {
        setFormData({
          name: "",
          phoneCode: DEFAULT_DIAL_CODE,
          phone: "",
          nrc: "",
          experience: "5",
          assignedTruck: ""
        });
      }
    }
  }, [isOpen, initialData]);

  const loadTrucks = async () => {
    try {
      const data = await truckService.getAll();
      setTrucks(data || []);
    } catch (error) {
      console.error("Failed to load trucks:", error);
    }
  };

  const handleFormSubmit = () => {
    if (!formData.name || !formData.phone) {
      alert("Please fill all required fields");
      return;
    }
    
    const { phoneCode, ...driverFields } = formData;
    const payload = {
      ...driverFields,
      phone: joinDialCode(phoneCode, formData.phone),
      experience: Number(formData.experience),
      assignedTruck: formData.assignedTruck || undefined
    };
    
    onSubmit(payload);
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
                  <h2 className="text-[16px] font-semibold text-neutral-900 tracking-tight">
                    {initialData ? "Edit Driver Profile" : "Add New Driver"}
                  </h2>
                  <p className="text-[11px] font-medium text-neutral-400 mt-0.5 uppercase tracking-widest">
                    {initialData ? "Update personnel details" : "Register personnel to fleet"}
                  </p>
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
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                        Full Name
                        {isEdit && <span className="normal-case tracking-normal text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">🔒 Trakzee · locked</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Adebayo Okafor"
                        disabled={isEdit}
                        className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 focus:border-primary/20 outline-none transition-all shadow-sm disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest ml-1">Phone Number</label>
                      <PhoneInput
                        code={formData.phoneCode}
                        value={formData.phone}
                        placeholder="771 234 567"
                        className="shadow-sm"
                        onCodeChange={(code) => setFormData({ ...formData, phoneCode: code })}
                        onValueChange={(local) => setFormData({ ...formData, phone: local })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-widest ml-1">NRC Number</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={formData.nrc}
                        // Digits and slashes only — an NRC is 153013/10/1 and
                        // nothing else, so letters are always a mistake.
                        onChange={(e) => setFormData({ ...formData, nrc: e.target.value.replace(/[^0-9/]/g, "").slice(0, 13) })}
                        placeholder="153013/10/1"
                        className="w-full bg-white border border-neutral-100 rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-900 focus:border-primary/20 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </section>

                {/* Section 2: Professional Details */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 px-1">
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Assignment & Experience</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                      <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1">
                        Experience (Yrs)
                      </label>
                      <input
                        type="number"
                        className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full"
                        value={formData.experience}
                        onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 space-y-1.5">
                    <label className="text-[9px] font-bold text-neutral-400 uppercase mb-1 flex items-center gap-1.5">
                      Assigned Truck
                      {isEdit && <span className="normal-case text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">🔒 Trakzee · locked</span>}
                    </label>
                    <select
                      className="bg-transparent text-[13px] font-semibold text-slate-900 outline-none w-full cursor-pointer disabled:text-neutral-400 disabled:cursor-not-allowed"
                      value={formData.assignedTruck}
                      onChange={(e) => setFormData({ ...formData, assignedTruck: e.target.value })}
                      disabled={isEdit}
                    >
                      <option value="">Select Truck (Optional)</option>
                      {trucks.map((truck) => (
                        <option key={truck._id} value={truck._id}>
                          {truck.truckId} ({truck.vehicleModel})
                        </option>
                      ))}
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
                  {initialData ? "Save Changes" : "Create Driver Profile"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
