"use client";

import { useState, useEffect } from "react";
import { X, UserCheck, Mail, Lock } from "lucide-react";
import { driverService } from "@/services/driverService";

interface RegisterDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  drivers: any[];
  onRegistered: () => void;
}

const inputClass =
  "w-full bg-neutral-50 border border-neutral-100 rounded-xl py-2.5 px-4 text-[13px] font-medium text-slate-900 outline-none focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all";

export default function RegisterDriverModal({ isOpen, onClose, drivers, onRegistered }: RegisterDriverModalProps) {
  const [driverId, setDriverId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const unregisteredDrivers = drivers.filter((d) => !d.email);

  useEffect(() => {
    if (isOpen) {
      setDriverId("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!driverId || !email || !password) {
      setError("Select a driver and fill in email and password");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await driverService.registerCredentials(driverId, { email, password });
      onRegistered();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to register driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex justify-end bg-slate-900/30 backdrop-blur-[2px]">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-screen shadow-2xl flex flex-col" style={{ animation: "slideInRight 0.3s ease-out" }}>
        {/* Header */}
        <div className="px-7 pt-8 pb-5 border-b border-neutral-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[17px] font-semibold text-slate-900 tracking-tight">Register Driver</h2>
            <p className="text-[11px] text-neutral-400 mt-0.5">Set login credentials for an existing driver.</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-slate-900 hover:bg-neutral-100 transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-[12px] font-bold text-slate-900">Driver Login</h4>
              <p className="text-[10px] text-neutral-500 mt-0.5">Only drivers without existing credentials are listed.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Driver</label>
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className={inputClass}>
              <option value="">Select a driver</option>
              {unregisteredDrivers.map((d) => (
                <option key={d._id} value={d._id}>{d.name} — {d.phone}</option>
              ))}
            </select>
            {unregisteredDrivers.length === 0 && (
              <p className="text-[10px] text-neutral-400 mt-1">All drivers already have credentials.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Email</label>
            <div className="relative">
              <input type="email" placeholder="e.g. driver@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-10`} />
              <Mail className="w-3.5 h-3.5 text-neutral-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest">Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pl-10 pr-12`} />
              <Lock className="w-3.5 h-3.5 text-neutral-300 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-slate-900 transition-colors cursor-pointer">
                {showPassword ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-neutral-100 flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl bg-neutral-100 text-slate-500 text-[11px] font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all cursor-pointer">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !driverId || !email || !password}
            className={`flex-1 py-3 rounded-xl text-white text-[11px] font-bold uppercase tracking-widest transition-all shadow-lg shadow-slate-200 cursor-pointer ${isSubmitting ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:brightness-110"} disabled:bg-slate-300 disabled:cursor-not-allowed`}
          >
            {isSubmitting ? "Registering..." : "Register Driver"}
          </button>
        </div>
      </div>
    </div>
  );
}
