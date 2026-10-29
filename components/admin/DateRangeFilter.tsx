"use client";

import { CalendarDays, X } from "lucide-react";

interface DateRangeFilterProps {
  from: string; // YYYY-MM-DD, "" for open
  to: string;
  onChange: (from: string, to: string) => void;
}

// From–to day filter for the admin tables, sized to sit beside their selects.
// Either end may be left empty: only "from" shows that day onwards, only "to"
// everything up to it.
export default function DateRangeFilter({ from, to, onChange }: DateRangeFilterProps) {
  const inputClass = "bg-transparent text-[11px] font-bold text-slate-600 outline-none cursor-pointer";
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
      <CalendarDays className="w-3.5 h-3.5 text-slate-300 shrink-0" />
      <input
        type="date"
        value={from}
        max={to || undefined}
        onChange={(e) => onChange(e.target.value, to)}
        aria-label="From date"
        title="From"
        className={inputClass}
      />
      <span className="text-[10px] font-bold text-slate-300">→</span>
      <input
        type="date"
        value={to}
        min={from || undefined}
        onChange={(e) => onChange(from, e.target.value)}
        aria-label="To date"
        title="To"
        className={inputClass}
      />
      {(from || to) && (
        <button
          type="button"
          onClick={() => onChange("", "")}
          title="Clear dates"
          className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
