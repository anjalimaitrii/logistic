"use client";

import React, { useState, useEffect } from "react";

export default function AdminDashboard() {
   const [isSidebarOpen, setSidebarOpen] = useState(false);
   const [isNotifOpen, setNotifOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [isCreateJobOpen, setCreateJobOpen] = useState(false);
   // const [adminRole, setAdminRole] = useState<"Admin" | "Admin 2">("Admin");

   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
   const toggleNotif = () => setNotifOpen(!isNotifOpen);

   const showToast = (msg: string, type: "success" | "danger" | "warning" | "info" = "info") => {
      // In a real app, we'd use a toast library. For now, we'll just log.
      console.log(`[${type.toUpperCase()}] ${msg}`);
      // Simplified toast logic for demo
      alert(`${type.toUpperCase()}: ${msg}`);
   };

   return (
      <div className="flex min-h-screen bg-[#0F172A] text-[#F1F5F9] font-sans overflow-x-hidden admin-dashboard">
         <style jsx global>{`
        :root {
          --primary: #0A2540;
          --accent: #FF6B00;
          --accent-light: rgba(255,107,0,0.12);
          --accent-glow: rgba(255,107,0,0.25);
          --success: #10B981;
          --success-light: rgba(16,185,129,0.12);
          --warning: #F59E0B;
          --warning-light: rgba(245,158,11,0.12);
          --danger: #EF4444;
          --danger-light: rgba(239,68,68,0.12);
          --bg: #0F172A;
          --sidebar: #1E2937;
          --card: #1E2937;
          --border: #334155;
          --border-light: #2D3F55;
          --text: #F1F5F9;
          --text-muted: #94A3B8;
          --text-dim: #64748B;
          --sidebar-w: 240px;
          --topbar-h: 64px;
          --radius: 12px;
          --radius-sm: 8px;
          --shadow: 0 4px 24px rgba(0,0,0,0.35);
          --shadow-lg: 0 8px 40px rgba(0,0,0,0.45);
        }

        .admin-dashboard .nav-item.active::before {
          content: ''; position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 2px; background: var(--accent);
        }

        @keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        .live-dot { animation: pulse 1.5s infinite; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.4s ease both; }
      `}</style>

         {/* Overlay for mobile sidebar */}
         {isSidebarOpen && (
            <div
               className="fixed inset-0 bg-black/50 z-[150] backdrop-blur-sm lg:hidden"
               onClick={() => setSidebarOpen(false)}
            />
         )}

         {/* Sidebar */}
         <aside className={`fixed top-0 left-0 bottom-0 w-[240px] bg-[#1E2937] border-r border-[#334155] flex flex-col z-[200] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="p-5 pb-4 border-b border-[#334155] flex items-center gap-2.5">
               <div className="w-9 h-9 bg-[#FF6B00] rounded-lg flex items-center justify-center text-lg font-extrabold text-white shadow-[0_0_16px_rgba(255,107,0,0.25)]">
                  FT
               </div>
               <div className="font-bold text-lg tracking-tight text-[#F1F5F9]">
                  Fleet<span className="text-[#FF6B00]">Track</span>
               </div>
            </div>

            <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
               <div className="text-[10px] font-bold text-[#64748B] tracking-widest uppercase px-2.5 py-3 mt-1">Main</div>
               <a href="#" className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[rgba(255,107,0,0.12)] text-[#FF6B00] font-semibold relative">
                  <div className="absolute left-0 top-1/5 bottom-1/5 w-0.5 bg-[#FF6B00] rounded-full" />
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  Dashboard
               </a>
               {[
                  { label: "Jobs", icon: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", badge: "12" },
                  { label: "Trucks", icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z", extra: "circle" },
                  { label: "Drivers", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" },
               ].map((item, i) => (
                  <a key={i} href="#" className="flex items-center gap-2.5 p-2.5 rounded-lg text-[#94A3B8] hover:bg-white/5 hover:text-[#F1F5F9] transition-all text-[13.5px]">
                     <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {item.label === 'Jobs' ? <><rect x="2" y="7" width="20" height="14" rx="2" /><path d={item.icon} /></> :
                           item.label === 'Trucks' ? <><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></> :
                              <><path d={item.icon} /><circle cx="12" cy="7" r="4" /></>}
                     </svg>
                     {item.label}
                     {item.badge && <span className="ml-auto bg-[#FF6B00] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge}</span>}
                  </a>
               ))}

               <div className="text-[10px] font-bold text-[#64748B] tracking-widest uppercase px-2.5 py-3 mt-4">Operations</div>
               {[
                  { label: "Finance", icon: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
                  { label: "Reports", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
               ].map((item, i) => (
                  <a key={i} href="#" className="flex items-center gap-2.5 p-2.5 rounded-lg text-[#94A3B8] hover:bg-white/5 hover:text-[#F1F5F9] transition-all text-[13.5px]">
                     <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {item.label === 'Finance' ? <><line x1="12" y1="1" x2="12" y2="23" /><path d={item.icon} /></> :
                           item.label === 'Reports' ? <><path d={item.icon} /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></> :
                              <path d={item.icon} />}
                     </svg>
                     {item.label}
                     {/* {item.badge && <span className={`ml-auto ${item.badgeColor || 'bg-[#FF6B00]'} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center`}>{item.badge}</span>} */}
                  </a>
               ))}
            </nav>

            <div className="p-3 border-t border-[#334155]">
               <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors">
                  <div className="w-8 h-8 rounded-full bg-linear-to-br from-[#FF6B00] to-[#FF9500] flex items-center justify-center font-bold text-xs text-white shrink-0">
                     AO
                  </div>
                  <div className="min-w-0 flex-1">
                     <div className="text-[13px] font-semibold text-[#F1F5F9] truncate">Adebayo Okafor</div>
                     <div className="text-[11px] text-[#64748B]">Administrator</div>
                  </div>
               </div>
            </div>
         </aside>

         {/* Main Content Area */}
         <div className="flex-1 lg:ml-[240px] flex flex-col min-w-0">
            {/* Topbar */}
            <header className="h-[64px] bg-[#1E2937]/80 backdrop-blur-md border-b border-[#334155] sticky top-0 z-[100] flex items-center px-5 gap-3.5">
               <button className="p-1.5 rounded-lg text-[#94A3B8] hover:bg-white/7 lg:hidden" onClick={toggleSidebar}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
               </button>

               <div className="flex-1 max-w-[380px] relative flex items-center">
                  <svg className="absolute left-3 w-4 h-4 text-[#64748B]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  <input
                     type="text"
                     className="w-full bg-white/5 border border-[#334155] rounded-lg py-2 pl-9 pr-3 text-sm text-[#F1F5F9] outline-none focus:border-[#FF6B00] focus:bg-[#FF6B00]/5 transition-all"
                     placeholder="Search trucks, jobs, routes..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>

               <div className="ml-auto flex items-center gap-2.5">
                  <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/5 border border-[#334155] text-[#94A3B8] hover:text-[#F1F5F9] cursor-pointer relative transition-all" onClick={toggleNotif}>
                     <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                     <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#FF6B00] rounded-full border-2 border-[#1E2937]" />
                  </div>

                  <span className="bg-[#FF6B001e] text-[#FF6B00] border border-[#FF6B004c] text-[11px] font-bold px-2 py-0.5 rounded-full tracking-wide hidden sm:block uppercase">admin</span>
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#FF6B00] to-[#FF9500] flex items-center justify-center font-bold text-xs text-white border-2 border-[#FF6B0066] cursor-pointer hover:shadow-[0_0_14px_rgba(255,107,0,0.25)] transition-all">
                     AO
                  </div>
               </div>
            </header>

            {/* Notif Panel */}
            <div className={`fixed top-[64px] right-0 w-[320px] bg-[#1E2937] border-l border-[#334155] h-[calc(100vh-64px)] z-[300] transition-transform duration-300 ${isNotifOpen ? 'translate-x-0' : 'translate-x-full'}`}>
               <div className="p-4 border-b border-[#334155] flex items-center justify-between font-semibold">
                  <span>🔔 Notifications</span>
                  <button className="text-[#64748B] hover:text-white" onClick={toggleNotif}>×</button>
               </div>
               <div className="p-2 overflow-y-auto h-full space-y-1">
                  {[
                     { icon: "⛽", title: "Low Fuel Alert", body: "TRK-018 is at 8% fuel. Refuel needed on Lagos route.", time: "3 min ago", unread: true },
                     { icon: "📋", title: "License Expiring", body: "Driver Kwame Mensah's license expires in 5 days.", time: "18 min ago", unread: true },
                     { icon: "✅", title: "Delivery Completed", body: "Job #FL-2847 delivered successfully. route cleared.", time: "42 min ago" },
                  ].map((notif, i) => (
                     <div key={i} className="p-3 bg-white/3 rounded-lg flex gap-3 border-b border-white/5 hover:bg-white/5 cursor-pointer">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">{notif.icon}</div>
                        <div>
                           <div className="text-[12.5px] font-semibold">{notif.title}</div>
                           <div className="text-[11.5px] text-[#94A3B8] leading-tight mt-0.5">{notif.body}</div>
                           <div className="text-[10.5px] text-[#64748B] mt-1.5">{notif.time}</div>
                        </div>
                        {notif.unread && <div className="w-1.5 h-1.5 bg-[#FF6B00] rounded-full mt-1 shrink-0" />}
                     </div>
                  ))}
               </div>
            </div>

            {/* Dashboard Content */}
            <main className="p-6 pb-20 space-y-6">
               <div>
                  <div className="flex items-center gap-1.5 text-[12px] text-[#64748B] mb-1.5">
                     <span>FleetTrack</span>
                     <span className="text-[#334155]">›</span>
                     <span className="text-[#FF6B00] font-medium">Dashboard</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight">Fleet Overview</h1>
                  <p className="text-[13px] text-[#94A3B8] mt-0.5">April 2026 · Global Logistics Hub · 40 trucks active</p>
               </div>

               {/* KPI Grid */}
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                     { lbl: "Total Trucks", val: "40", icon: "🚛", sub: "32 active · 6 idle", trend: "↑ 100%", color: "text-[#FF6B00]" },
                     { lbl: "Active Jobs", val: "12", icon: "📦", sub: "8 transit · 4 loading", trend: "↑ 4 today", color: "text-[#10B981]", variant: "success" },
                     { lbl: "Fuel Used", val: "2,840L", icon: "⛽", sub: "₦ 3.2M total cost", trend: "↑ 12% vs yest", variant: "warning" },
                     { lbl: "Payments", val: "₦4.8M", icon: "💳", sub: "7 invoices pending", trend: "↓ 2 cleared", variant: "danger" },
                  ].map((kpi, i) => (
                     <div key={i} className="bg-[#1E2937] border border-[#334155] rounded-xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all animate-fade-up">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-[#FF6B00] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex justify-between items-start mb-3">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${kpi.variant === 'success' ? 'bg-[#10B9811e]' : kpi.variant === 'warning' ? 'bg-[#F59E0B1e]' : kpi.variant === 'danger' ? 'bg-[#EF44441e]' : 'bg-[#FF6B001e]'}`}>
                              {kpi.icon}
                           </div>
                           <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${kpi.trend.includes('↑') ? 'text-[#10B981] bg-[#10B9811e]' : 'text-[#EF4444] bg-[#EF44441e]'}`}>
                              {kpi.trend}
                           </div>
                        </div>
                        <div className="text-2xl font-bold tracking-tight">{kpi.val}</div>
                        <div className="text-[12px] font-medium text-[#94A3B8] mt-1">{kpi.lbl}</div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{kpi.sub}</div>
                     </div>
                  ))}
               </div>

               {/* Mid Section */}
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  {/* Map View */}
                  <div className="xl:col-span-2 bg-[#1E2937] border border-[#334155] rounded-xl overflow-hidden animate-fade-up">
                     <div className="p-4 border-b border-[#334155] flex items-center justify-between">
                        <div className="text-sm font-semibold flex items-center gap-2">
                           🗺 Live Fleet Location
                           <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#10B9811e] text-[#10B981] text-[10px] font-bold rounded-full uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full live-dot" />
                              Live
                           </span>
                        </div>
                        <button className="bg-white/5 p-1.5 rounded-lg border border-[#334155] text-[#64748B] hover:text-[#F1F5F9]" onClick={() => alert('Refreshing Map...')}>
                           <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                        </button>
                     </div>
                     <div className="h-[280px] bg-[#0D1F35] relative flex items-center justify-center overflow-hidden">
                        {/* Simulated Map SVG */}
                        <svg className="w-full h-full opacity-30" viewBox="0 0 500 500">
                           <path d="M190 30 L360 80 L385 320 L270 440 L110 160 Z" fill="#1E4060" stroke="#1E4060" strokeWidth="2" />
                           <g stroke="#2D3F55" strokeWidth="1" strokeDasharray="3,3">
                              <line x1="200" y1="50" x2="400" y2="450" />
                              <line x1="50" y1="200" x2="450" y2="200" />
                           </g>
                        </svg>
                        {/* Pointers */}
                        <div className="absolute top-1/2 left-1/3 w-4 h-4 bg-[#FF6B00] rounded-sm rotate-45 border border-white shadow-[0_0_10px_rgba(255,107,0,0.5)]">
                           <div className="absolute -top-6 -left-2 bg-[#0A2540] text-[8px] font-bold px-1.5 py-0.5 border border-[#334155] rounded-md text-[#FF6B00]">T-14</div>
                        </div>
                        <div className="absolute top-1/4 left-1/2 w-4 h-4 bg-[#10B981] rounded-sm rotate-45 border border-white shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                           <div className="absolute -top-6 -left-2 bg-[#0A2540] text-[8px] font-bold px-1.5 py-0.5 border border-[#334155] rounded-md text-[#10B981]">T-22</div>
                        </div>

                        <div className="absolute top-3 left-3 bg-[#0F172Aee] border border-[#334155] rounded-lg p-2.5 backdrop-blur-md">
                           <div className="text-[10px] text-[#10B981] font-bold">🟢 28 In Transit</div>
                           <div className="text-[10px] text-[#F59E0B] font-bold">🟡 8 Idle</div>
                           <div className="text-[10px] text-[#EF4444] font-bold">🔴 4 Alerts</div>
                        </div>
                     </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="bg-[#1E2937] border border-[#334155] rounded-xl animate-fade-up">
                     <div className="p-4 border-b border-[#334155]">
                        <div className="text-sm font-semibold"> 🚛 Fleet Status</div>
                     </div>
                     <div className="p-5 flex items-center gap-5 border-b border-white/5">
                        <div className="w-16 h-16 rounded-full border-8 border-[#334155] border-t-[#10B981] border-r-[#F59E0B] flex flex-col items-center justify-center shrink-0">
                           <span className="text-lg font-bold">40</span>
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="flex justify-between text-[11px]">
                              <span className="text-[#94A3B8]">Active</span>
                              <span className="font-bold">32</span>
                           </div>
                           <div className="h-1 bg-[#334155] rounded-full overflow-hidden">
                              <div className="h-full bg-[#10B981] w-[80%]" />
                           </div>
                           <div className="flex justify-between text-[11px]">
                              <span className="text-[#94A3B8]">Maintenance</span>
                              <span className="font-bold">2</span>
                           </div>
                           <div className="h-1 bg-[#334155] rounded-full overflow-hidden">
                              <div className="h-full bg-[#EF4444] w-[5%]" />
                           </div>
                        </div>
                     </div>
                     <div className="p-2 space-y-1">
                        {[
                           { lbl: "In Transit", sub: "12 routes active", val: "28", color: "text-[#10B981]", icon: "🏃" },
                           { lbl: "Maintenance", sub: "ETA 2 days", val: "2", color: "text-[#EF4444]", icon: "🔧" },
                        ].map((st, i) => (
                           <div key={i} className="flex items-center gap-3 p-3 hover:bg-white/3 rounded-lg transition-colors">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-sm">{st.icon}</div>
                              <div className="flex-1 min-w-0">
                                 <div className="text-[12.5px] font-semibold truncate">{st.lbl}</div>
                                 <div className="text-[11px] text-[#64748B] truncate">{st.sub}</div>
                              </div>
                              <div className={`text-lg font-bold ${st.color}`}>{st.val}</div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="flex flex-wrap gap-3">
                  <button className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-lg font-semibold text-sm shadow-[0_4px_16px_rgba(255,107,0,0.25)] hover:-translate-y-0.5 transition-all" onClick={() => setCreateJobOpen(true)}>＋ Create Job</button>
                  <button className="bg-white/5 border border-[#334155] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-white/10 transition-all" onClick={() => showToast('Dispatching scheduler opened', 'info')}>🚛 Dispatch Truck</button>
                  <button className="bg-white/5 border border-[#334155] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-white/10 transition-all" onClick={() => showToast('Fuel log opened', 'info')}>⛽ Log Fuel</button>
                  <button className="bg-white/5 border border-[#334155] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-white/10 transition-all" onClick={() => showToast('Report generation started', 'info')}>📄 Export Report</button>
               </div>

               {/* Table */}
               <div className="bg-[#1E2937] border border-[#334155] rounded-xl overflow-hidden animate-fade-up">
                  <div className="p-4 border-b border-[#334155] flex items-center justify-between">
                     <div className="text-sm font-semibold">📋 Recent Operations</div>
                     <select className="bg-white/5 border border-[#334155] text-[11px] font-semibold text-[#94A3B8] rounded px-2 py-1 outline-none">
                        <option>All Jobs</option>
                        <option>In Transit</option>
                     </select>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-[#0F172A]/40 text-[10.5px] text-[#64748B] uppercase tracking-wider font-bold">
                           <tr>
                              <th className="px-5 py-3.5">Job ID</th>
                              <th className="px-5 py-3.5">Status</th>
                              <th className="px-5 py-3.5">Driver</th>
                              <th className="px-5 py-3.5">Route</th>
                              <th className="px-5 py-3.5">ETA</th>
                              <th className="px-5 py-3.5">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-[13px]">
                           {[
                              { id: "#FL-2851", status: "In Transit", driver: "Adaeze O.", route: "Lagos → Abuja", eta: "14:30", type: "transit" },
                              { id: "#FL-2847", status: "Delivered", driver: "Kwame M.", route: "Nairobi → Mom.", eta: "Done", type: "success" },
                              { id: "#FL-2843", status: "Delayed", driver: "Fatima O.", route: "Cairo → Alex.", eta: "+2h", type: "danger" },
                           ].map((row, i) => (
                              <tr key={i} className="hover:bg-white/2 cursor-pointer transition-colors" onClick={() => showToast(`Opening details for ${row.id}`, 'info')}>
                                 <td className="px-5 py-4 font-bold text-[#FF6B00] font-display">{row.id}</td>
                                 <td className="px-5 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${row.type === 'transit' ? 'bg-[#FF6B001e] text-[#FF6B00]' : row.type === 'success' ? 'bg-[#10B9811e] text-[#10B981]' : 'bg-[#EF44441e] text-[#EF4444]'}`}>
                                       {row.status}
                                    </span>
                                 </td>
                                 <td className="px-5 py-4 text-[#F1F5F9] font-medium">{row.driver}</td>
                                 <td className="px-5 py-4 text-[#94A3B8]">{row.route}</td>
                                 <td className="px-5 py-4 font-semibold">{row.eta}</td>
                                 <td className="px-5 py-4">
                                    <div className="flex gap-2">
                                       <div className="w-7 h-7 flex items-center justify-center rounded bg-white/5 border border-[#334155] text-xs opacity-60 hover:opacity-100 transition-all">👁</div>
                                       <div className="w-7 h-7 flex items-center justify-center rounded bg-white/5 border border-[#334155] text-xs opacity-60 hover:opacity-100 transition-all">✏️</div>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="p-4 border-t border-white/5 flex items-center justify-between text-[11px] text-[#64748B]">
                     <span>Showing 3 of 12 operations</span>
                     <button className="text-[#FF6B00] font-bold hover:underline">View All Operations →</button>
                  </div>
               </div>

               {/* Activity Feed and Renewals Grid */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4">
                  <div className="bg-[#1E2937] border border-[#334155] rounded-xl p-5">
                     <div className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-4">📅 Upcoming Renewals</div>
                     <div className="space-y-3">
                        {[
                           { title: "TRK-18 · Road Worthy", sub: "Bongani Nkosi", days: "3d", variant: "urgent" },
                           { title: "Kwame M. · License", sub: "Driver Permit", days: "5d", variant: "warn" },
                           { title: "TRK-07 · Insurance", sub: "Third Party Policy", days: "12d", variant: "warn" },
                        ].map((ren, i) => (
                           <div key={i} className="bg-white/3 border border-[#334155] rounded-lg p-3 flex items-center justify-between hover:border-[#FF6B00] transition-colors cursor-pointer group">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">📅</div>
                                 <div>
                                    <div className="text-[13px] font-semibold">{ren.title}</div>
                                    <div className="text-[11px] text-[#94A3B8]">{ren.sub}</div>
                                 </div>
                              </div>
                              <div className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${ren.variant === 'urgent' ? 'bg-[#EF44441e] text-[#EF4444]' : 'bg-[#F59E0B1e] text-[#F59E0B]'}`}>
                                 {ren.days}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-[#1E2937] border border-[#334155] rounded-xl p-5">
                     <div className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider mb-4">📡 Activity Feed</div>
                     <div className="space-y-4">
                        {[
                           { icon: "✅", title: "Job Delivered", body: "FL-2847 delivered in Nairobi", time: "42 min ago" },
                           { icon: "⛽", title: "Low Fuel Alert", body: "TRK-018 needs fuel in Lagos", time: "3 min ago" },
                           { icon: "🚛", title: "New Dispatch", body: "TRK-07 sent to Kumasi", time: "1h ago" },
                        ].map((act, i) => (
                           <div key={i} className="flex gap-4">
                              <div className="text-sm shrink-0 mt-0.5">{act.icon}</div>
                              <div>
                                 <div className="text-[12.5px] font-semibold">{act.title}</div>
                                 <div className="text-[11px] text-[#64748B]">{act.body} • {act.time}</div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </main>
         </div>

         {/* Create Job Modal */}
         {isCreateJobOpen && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreateJobOpen(false)} />
               <div className="relative w-full max-w-2xl bg-[#1E2937] border border-[#334155] rounded-2xl shadow-2xl overflow-hidden animate-fade-up">
                  <div className="p-6 border-b border-[#334155] flex justify-between items-center bg-[#111827]">
                     <div>
                        <h2 className="text-xl font-bold tracking-tight text-white">Create New Job</h2>
                        <p className="text-xs text-[#94A3B8] mt-1">Fill in the details to proceed with job assignment</p>
                     </div>
                     <button className="p-2 text-[#94A3B8] hover:text-white transition-colors" onClick={() => setCreateJobOpen(false)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>

                  <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                     {/* Section 1: Party & Billing */}
                     <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#FF6B00] uppercase tracking-widest px-2">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                           Party Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1">Client / Logistics Company</label>
                              <input type="text" className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] outline-none transition-all" placeholder="Enter company name" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1">Contact Person</label>
                              <input type="text" className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] outline-none transition-all" placeholder="Phone" />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1">Billing Details</label>
                           <textarea className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] outline-none transition-all resize-none" rows={2} placeholder="Address, GST/VAT, etc." />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1">Ledger Reference</label>
                              <select className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] outline-none transition-all">
                                 <option>General Ledger</option>
                                 <option>Logistics A/C</option>
                                 <option>Internal Transfer</option>
                              </select>
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider ml-1">Tax Status</label>
                              <select className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] outline-none transition-all">
                                 <option>Taxable (Standard)</option>
                                 <option>Exempted</option>
                                 <option>GST (18%)</option>
                              </select>
                           </div>
                        </div>
                     </div>



                     {/* Section 3: Job Specs */}
                     <div className="space-y-4 pt-4 border-t border-[#334155]">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-[#FF6B00] uppercase tracking-widest px-2">
                           <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="2" /></svg>
                           Job Specifications
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <input type="text" className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm" placeholder="Pickup (Lagos, Abuja...)" />
                           <input type="text" className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm" placeholder="Dropoff (Lagos, Abuja...)" />
                           <input type="text" className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm" placeholder="Goods (Electronics, Tiles...)" />
                           <input type="text" className="w-full bg-[#0F172A] border border-[#334155] rounded-xl px-4 py-3 text-sm" placeholder="Quantity (1000kg)" />
                        </div>
                     </div>
                  </div>

                  <div className="p-6 border-t border-[#334155] bg-[#111827] flex gap-3">
                     <button className="flex-1 bg-[#FF6B00] text-white py-3.5 rounded-xl font-bold shadow-[0_4px_16px_rgba(255,107,0,0.3)] hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-widest" onClick={() => {
                        showToast(`Job for ${adminRole} created successfully!`, "success");
                        setCreateJobOpen(false);
                     }}>
                        Confirm & Create Job
                     </button>
                     <button className="px-6 bg-white/5 border border-[#334155] text-[#94A3B8] rounded-xl font-bold hover:bg-white/10 hover:text-white transition-all text-sm uppercase tracking-widest" onClick={() => setCreateJobOpen(false)}>
                        Cancel
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Global CSS for minor custom animations */}
         <style jsx global>{`
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out;
        }
      `}</style>
      </div>
   );
}
