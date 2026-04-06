"use client";

import { useState, useEffect } from "react";

interface CreateJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export default function CreateJobModal({ isOpen, onClose, onSubmit, initialData }: CreateJobModalProps) {
  const [formData, setFormData] = useState({
    client: initialData?.customer || "",
    contact: "",
    pickup: initialData?.route?.split("→")[0]?.trim() || "",
    dropoff: initialData?.route?.split("→")[1]?.trim() || "",
    goodsType: initialData?.cargo || "",
    weight: initialData?.weight || "",
    price: initialData?.price || "",
  });

  // Sync state when initialData changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        client: initialData.customer || "",
        contact: "",
        pickup: initialData.route?.split("→")[0]?.trim() || "",
        dropoff: initialData.route?.split("→")[1]?.trim() || "",
        goodsType: initialData.cargo || "",
        weight: initialData.weight || "",
        price: initialData.price || "",
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white border border-neutral-100 rounded-[32px] shadow-2xl overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-neutral-900">
              {initialData ? "Convert Request to Job" : "Create New Job"}
            </h2>
            <p className="text-[12px] font-medium text-neutral-400 mt-0.5">Fill in the details to proceed with job assignment</p>
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
          {/* Party Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Party Details
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Client / Logistics Co.
                </label>
                <input
                  type="text"
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900 placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner"
                  placeholder="Enter company name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900 placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner"
                  placeholder="Phone Number"
                />
              </div>
            </div>
          </div>

          {/* Job Specs */}
          <div className="space-y-4 pt-6 border-t border-neutral-100">
            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-900 uppercase tracking-widest px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-900" />
              Job Specifications
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Pickup Location
                </label>
                <input
                  type="text"
                  name="pickup"
                  value={formData.pickup}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900"
                  placeholder="Lagos, Abuja..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Dropoff Location
                </label>
                <input
                  type="text"
                  name="dropoff"
                  value={formData.dropoff}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900"
                  placeholder="Accra, Kumasi..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Goods Type
                </label>
                <input
                  type="text"
                  name="goodsType"
                  value={formData.goodsType}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900"
                  placeholder="Electronics, Tiles..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest ml-1">
                  Weight/Quantity
                </label>
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-3 text-[13px] font-bold text-neutral-900"
                  placeholder="1000kg / 2 Trucks"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-neutral-100 bg-neutral-50/50 flex gap-3">
          <button
            className="flex-1 bg-primary text-white py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all text-[13px] uppercase tracking-widest"
            onClick={() => onSubmit(formData)}
          >
            Confirm & Create Job
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
