import React from "react";
import Link from "next/link";

export default function TrackPage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 pb-12">
      {/* Chat Header */}
      <div className="bg-white border-b border-neutral-200 p-4 flex items-center gap-3 sticky top-0 z-50 shadow-sm">
        <Link href="/dashboard" className="p-2 -ml-2 text-neutral-400 hover:text-neutral-900 transition-colors">
          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
        </Link>
        <div className="w-10 h-10 bg-linear-to-br from-primary to-primary-mid rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
          <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
          </svg>
        </div>
        <div className="flex-1">
          <h4 className="font-display font-bold text-sm text-neutral-900 tracking-tight leading-none">FleetTrack Ops Team</h4>
          <p className="text-[10px] font-bold text-success flex items-center gap-1.5 mt-1 animate-pulse">
            <span className="w-1.5 h-1.5 bg-success rounded-full" /> Online now
          </p>
        </div>
        <div className="w-8 h-8 bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-500 cursor-pointer">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.074 15.074 0 0 1-6.59-6.59l2.2-2.21c.28-.26.36-.65.25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z" />
          </svg>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 bg-neutral-50 p-4 space-y-4 overflow-y-auto">
        <div className="flex flex-col items-end gap-1.5">
          <div className="bg-secondary-light text-secondary p-3 rounded-2xl rounded-br-none text-xs font-bold max-w-[85%] shadow-sm border border-secondary/10">
            Need 2 trucks for 5 ton ceramic tiles. Lagos → Abuja. Urgent!
          </div>
          <span className="text-[10px] text-neutral-400 font-bold">9:32 AM</span>
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <div className="bg-white text-neutral-800 border border-neutral-200 p-3 rounded-2xl rounded-bl-none text-xs font-medium max-w-[85%] shadow-sm">
            Hello Mr. Sharma! We have trucks available. Checking best price for you 🚛
          </div>
          <span className="text-[10px] text-neutral-400 font-bold">9:34 AM</span>
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <div className="bg-white text-neutral-800 border border-neutral-200 p-3 rounded-2xl rounded-bl-none text-xs font-medium max-w-[85%] shadow-sm">
            Best offer for <span className="font-bold text-primary">JOB-004</span>:
            <span className="block font-display font-extrabold text-xl text-primary my-1">₹28,500</span>
            Includes 2 trucks, driver, and GPS tracking. Delivery in 48hrs ✅
          </div>
          <span className="text-[10px] text-neutral-400 font-bold">9:37 AM</span>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="bg-secondary-light text-secondary p-3 rounded-2xl rounded-br-none text-xs font-bold max-w-[85%] shadow-sm border border-secondary/10">
            Can we do ₹27,000? I have a regular arrangement.
          </div>
          <span className="text-[10px] text-neutral-400 font-bold">9:38 AM</span>
        </div>

        <div className="flex flex-col items-start gap-1.5">
          <div className="bg-white text-neutral-800 border border-neutral-200 p-3 rounded-2xl rounded-bl-none text-xs font-medium max-w-[85%] shadow-sm">
            Approved! Final price:
            <span className="block font-display font-extrabold text-xl text-primary my-1">₹27,500 ✓</span>
            Ready to confirm JOB-004
          </div>
          <span className="text-[10px] text-neutral-400 font-bold">9:40 AM</span>
        </div>

        {/* Typing Placeholder */}
        <div className="flex gap-1 bg-white border border-neutral-200 p-2.5 px-4 rounded-full w-fit shadow-sm">
          <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      {/* Confirmation Area */}
      <div className="px-4 py-6 bg-neutral-50">
        <button className="w-full bg-linear-to-r from-success to-[#0D9668] text-white font-display font-extrabold py-4 rounded-2xl shadow-xl shadow-success/20 flex items-center justify-center gap-2 mb-6 transform active:scale-95 transition-transform hover:brightness-110">
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          Accept & Confirm JOB-004
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="flex-1 h-[1px] bg-neutral-200" />
          <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest px-2">Job Detail Below</span>
          <div className="flex-1 h-[1px] bg-neutral-200" />
        </div>

        {/* Job Detail Card */}
        <div className="bg-white rounded-3xl border border-neutral-200 overflow-hidden shadow-fleet mb-4">
          <div className="bg-secondary-light p-4 flex justify-between items-center border-b border-secondary/5">
            <span className="font-display font-extrabold text-secondary text-lg tracking-tight leading-none">JOB-004</span>
            <span className="bg-success/20 text-success border border-success/30 px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest">● Confirmed</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center text-primary">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>
              </div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-tight flex-1">Route</p>
              <p className="text-sm font-display font-bold text-neutral-900 overflow-hidden text-ellipsis whitespace-nowrap">Lagos → Abuja</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-50 flex items-center justify-center text-sky-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 12C14.21 12 16 10.21 16 8S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
              </div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-tight flex-1">Driver</p>
              <p className="text-sm font-display font-bold text-neutral-900">Emeka Okafor</p>
            </div>

            {/* Mini Map Placeholder */}
            <div className="h-20 bg-linear-to-br from-sky-50 to-neutral-50 rounded-2xl relative overflow-hidden border border-neutral-100 mt-2">
              <svg className="w-full h-full p-2" viewBox="0 0 260 60" xmlns="http://www.w3.org/2000/svg">
                <path d="M20,30 Q80,10 130,30 Q170,45 220,20" stroke="#FF8C38" strokeWidth="2" fill="none" strokeDasharray="4,3" opacity="0.6" />
                <circle cx="20" cy="30" r="4" fill="#FF6B00" />
                <circle cx="220" cy="20" r="4" fill="#10B981" />
                <rect x="110" y="18" width="16" height="8" rx="2" fill="#FF6B00" opacity="0.8" />
              </svg>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.5 13H11v-6l5.25 3.15.75-1.23-4.5-2.67V7z" /></svg>
              </div>
              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-tight flex-1">ETA</p>
              <p className="text-sm font-display font-bold text-success">~48 hrs</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <button className="bg-primary text-white font-display font-bold p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-lg shadow-primary/30 active:scale-95 transition-all">
            <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
              <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15.01l1.41 1.41L11 14.84V19h2v-4.16l1.59 1.59L16 15.01 12.01 11 8 15.01z" />
            </svg>
            Invoices
          </button>
          <button className="bg-secondary-light text-secondary border border-secondary/20 font-display font-bold p-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs shadow-md active:scale-95 transition-all">
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M20.94 11c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06z" />
            </svg>
            Live Track
          </button>
        </div>

        {/* Ledger Summary */}
        <div className="bg-neutral-100 rounded-2xl p-4 border border-neutral-200">
          <h5 className="font-display font-bold text-xs text-neutral-900 mb-3 ml-1 tracking-tight">📋 Ledger Summary</h5>
          <div className="space-y-2">
            <div className="flex justify-between text-[11px] font-bold text-neutral-600 tracking-tight">
              <span>Base Freight</span>
              <span className="text-neutral-900">₹25,000</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-neutral-600 tracking-tight">
              <span>Fuel Surcharge</span>
              <span className="text-neutral-900">₹2,000</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-neutral-600 tracking-tight">
              <span>GST (2%)</span>
              <span className="text-neutral-900">₹500</span>
            </div>
            <div className="pt-2 mt-2 border-t border-neutral-200 flex justify-between text-xs font-display font-extrabold">
              <span className="text-neutral-900">Total Payable</span>
              <span className="text-primary tracking-tight">₹27,500</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
