import React from "react";
import Link from "next/link";

export default function NewBookingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-50 pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-secondary to-secondary-mid p-6 pb-8 text-white">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-white/70 text-sm font-medium mb-4 hover:text-white transition-colors">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
          Dashboard
        </Link>
        <h3 className="font-display font-extrabold text-2xl tracking-tight">New Booking Request</h3>
        <p className="text-white/60 text-xs mt-1">Fill in job details below to get a quick quote</p>
      </div>

      {/* Route Preview SVG */}
      <div className="mx-4 mt-6 mb-8 rounded-2xl bg-secondary h-28 relative overflow-hidden flex items-center justify-center border border-primary/20 shadow-fleet-lg">
        {/* Abstract Grid Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <svg className="w-full h-full p-4" viewBox="0 0 280 80" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill="#FF8C38" />
            </marker>
          </defs>
          <path d="M40,40 Q100,15 160,40 Q200,55 240,35" stroke="#FF8C38" strokeWidth="2.5" fill="none" strokeDasharray="6,4" markerEnd="url(#arrow)" />
          <circle cx="40" cy="40" r="6" fill="#FF6B00" />
          <circle cx="40" cy="40" r="12" fill="#FF6B00" opacity="0.2" />
          <circle cx="240" cy="35" r="6" fill="#10B981" />
          <circle cx="240" cy="35" r="12" fill="#10B981" opacity="0.2" />
          <text x="140" y="30" fontSize="16" textAnchor="middle" opacity="0.6">🚛</text>
        </svg>
        <span className="absolute bottom-3 bg-primary text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Route Preview</span>
      </div>

      {/* Form Fields */}
      <div className="px-5 space-y-5">
        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest ml-1">Pickup Location</label>
          <div className="flex items-center gap-3 bg-primary-light border-2 border-primary/20 p-4 rounded-2xl">
            <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span className="text-sm font-bold text-neutral-900 flex-1 uppercase tracking-tight">Lagos, Nigeria</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest ml-1">Drop Location</label>
          <div className="flex items-center gap-3 bg-neutral-100 border-2 border-neutral-200 p-4 rounded-2xl group focus-within:border-primary transition-colors">
            <svg className="w-5 h-5 text-neutral-400 group-focus-within:text-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <input type="text" placeholder="Enter destination..." className="bg-transparent border-none outline-none text-sm font-medium text-neutral-900 w-full placeholder:text-neutral-400" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest ml-1">Goods Type</label>
          <div className="flex items-center gap-3 bg-neutral-100 border-2 border-neutral-200 p-4 rounded-2xl">
            <svg className="w-5 h-5 text-neutral-400 font-bold" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-2.18c.07-.44.18-.87.18-1.32C18 2.55 16.45 1 14.55 1c-1.26 0-2.36.64-3.07 1.6L11 3.29l-.48-.69C9.81 1.64 8.71 1 7.45 1 5.55 1 4 2.55 4 4.68c0 .45.11.88.18 1.32H2L1 19h22L22 6h-2z" />
            </svg>
            <span className="text-sm font-bold text-neutral-900 flex-1 uppercase tracking-tight">Ceramic Tiles</span>
            <svg className="w-5 h-5 text-neutral-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest ml-1">Quantity</label>
            <div className="flex items-center gap-3 bg-neutral-100 border-2 border-neutral-200 p-4 rounded-2xl">
              <span className="text-sm font-bold text-neutral-900 uppercase">2 Trucks</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest ml-1">Weight</label>
            <div className="flex items-center gap-3 bg-neutral-100 border-2 border-neutral-200 p-4 rounded-2xl">
              <span className="text-sm font-bold text-neutral-900 uppercase">5 Tons</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-extrabold text-neutral-500 uppercase tracking-widest ml-1">Instructions <span className="lowercase font-medium text-neutral-400">(optional)</span></label>
          <div className="flex items-start gap-3 bg-neutral-100 border-2 border-neutral-200 p-4 rounded-2xl min-h-[80px]">
            <svg className="w-5 h-5 text-neutral-400 mt-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" />
            </svg>
            <textarea placeholder="Handle with care, fragile top..." className="bg-transparent border-none outline-none text-sm font-medium text-neutral-900 w-full placeholder:text-neutral-400 resize-none" rows={2}></textarea>
          </div>
        </div>
      </div>

      <div className="mt-8 px-5">
        <button className="w-full bg-gradient-to-r from-primary to-primary-mid text-white font-display font-extrabold py-5 rounded-2xl shadow-xl shadow-primary/40 flex items-center justify-center gap-3 hover:scale-[1.01] transition-transform active:scale-[0.99]">
          <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
          Submit Booking Request
        </button>
      </div>
    </div>
  );
}
