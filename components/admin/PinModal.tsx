"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PinModal({ isOpen, onClose }: PinModalProps) {
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const router = useRouter();

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin === "123456") {
      onClose();
      setEnteredPin("");
      setPinError(false);
      router.push("/admin/secret");
    } else {
      setPinError(true);
      setEnteredPin("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex justify-center items-start pt-32 p-4">
      <div
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
        onClick={() => {
          onClose();
          setEnteredPin("");
          setPinError(false);
        }}
      />
      <div className="relative w-full max-w-[360px] bg-white border border-neutral-100 rounded-[32px] shadow-2xl p-8 animate-fade-up text-center">
        <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center text-primary text-2xl mx-auto mb-6 shadow-pill">
          🔐
        </div>
        <h3 className="text-xl font-bold text-neutral-900 mb-2">Secret Access</h3>
        <p className="text-sm text-neutral-400 mb-8 font-medium">Enter your 6-digit administrator PIN to proceed.</p>

        <form onSubmit={handlePinSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              maxLength={6}
              autoFocus
              className={`w-full bg-neutral-50 border ${pinError ? "border-rose-500 ring-4 ring-rose-50" : "border-neutral-100 focus:border-primary/30 focus:ring-4 focus:ring-primary/5"
                } rounded-2xl px-6 py-4 text-center text-2xl font-bold tracking-[0.5em] text-neutral-900 outline-none transition-all placeholder:text-neutral-200`}
              placeholder="••••••"
              value={enteredPin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setEnteredPin(val);
                if (pinError) setPinError(false);
              }}
            />
            {pinError && (
              <p className="text-[11px] font-bold text-rose-500 mt-2 uppercase tracking-widest">
                Invalid Security Pin
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
            >
              Verify Pin
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                setEnteredPin("");
                setPinError(false);
              }}
              className="px-6 bg-white border border-neutral-100 text-neutral-400 font-bold rounded-xl hover:bg-neutral-50 transition-all text-sm uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
