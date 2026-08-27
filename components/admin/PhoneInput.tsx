"use client";

import { Phone } from "lucide-react";
import { DIAL_CODES, cleanLocalNumber, inputMaxLenFor } from "@/lib/dialCodes";

interface PhoneInputProps {
  code: string;
  value: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onCodeChange: (code: string) => void;
  onValueChange: (local: string) => void;
}

/**
 * Country dial code + local number, as one control.
 *
 * Non-digits never reach the value and the length is capped to the chosen
 * country's, so the field cannot hold something that is not a phone number.
 * Splitting the code out is what makes that cap possible — a single free-text
 * box has no way to know how long the number should be.
 */
export default function PhoneInput({
  code, value, placeholder = "Contact Number", disabled, className = "",
  onCodeChange, onValueChange,
}: PhoneInputProps) {
  return (
    <div className={`flex items-center bg-white border border-neutral-100 rounded-xl focus-within:border-neutral-300 transition-colors ${className}`}>
      <Phone className="ml-3 w-3.5 h-3.5 text-neutral-300 shrink-0" />
      <select
        value={code}
        disabled={disabled}
        // Re-clean on a code change: switching to a shorter country must trim a
        // number that was already too long for it.
        onChange={(e) => {
          onCodeChange(e.target.value);
          onValueChange(cleanLocalNumber(value, e.target.value));
        }}
        className="bg-transparent py-2.5 pl-2 pr-1 text-[11px] font-semibold text-neutral-500 outline-none appearance-none cursor-pointer border-r border-neutral-100 shrink-0 disabled:opacity-50"
      >
        {DIAL_CODES.map((d) => (
          <option key={d.code} value={d.code}>{d.label}</option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        maxLength={inputMaxLenFor(code)}
        onChange={(e) => onValueChange(cleanLocalNumber(e.target.value, code))}
        className="flex-1 bg-transparent py-2.5 pl-3 pr-3 text-[13px] font-medium text-slate-900 outline-none min-w-0 disabled:opacity-50"
      />
    </div>
  );
}
