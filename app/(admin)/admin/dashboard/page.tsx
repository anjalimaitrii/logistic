"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
   const [isSidebarOpen, setSidebarOpen] = useState(false);
   const [isNotifOpen, setNotifOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState("");
   const [isCreateJobOpen, setCreateJobOpen] = useState(false);

   // Secret Admin Access States
   const [adminClicks, setAdminClicks] = useState(0);
   const [showPinModal, setShowPinModal] = useState(false);
   const [enteredPin, setEnteredPin] = useState("");
   const [pinError, setPinError] = useState(false);
   const router = useRouter();

   const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
   const toggleNotif = () => setNotifOpen(!isNotifOpen);

   const handleAdminBadgeClick = () => {
      const newClicks = adminClicks + 1;
      setAdminClicks(newClicks);
      if (newClicks >= 5) {
         setShowPinModal(true);
         setAdminClicks(0);
      }
      // Reset clicks after 2 seconds of inactivity
      setTimeout(() => setAdminClicks(0), 3000);
   };

   const handlePinSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (enteredPin === "123456") {
         setShowPinModal(false);
         setEnteredPin("");
         setPinError(false);
         router.push("/admin/secret");
      } else {
         setPinError(true);
         setEnteredPin("");
         // Shake effect or vibration could be added here
      }
   };

   const showToast = (msg: string, type: "success" | "danger" | "warning" | "info" = "info") => {
      console.log(`[${type.toUpperCase()}] ${msg}`);
      alert(`${type.toUpperCase()}: ${msg}`);
   };

   return (
      <div className="flex min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans overflow-x-hidden admin-dashboard">
         <style jsx global>{`
        :root {
          --primary: #4F46E5;
          --accent: #FF6B00;
          --accent-light: rgba(255,107,0,0.1);
          --accent-glow: rgba(255,107,0,0.2);
          --success: #10B981;
          --success-light: #ECFDF5;
          --warning: #F59E0B;
          --warning-light: #FFFBEB;
          --danger: #EF4444;
          --danger-light: #FEF2F2;
          --bg: #F8FAFC;
          --sidebar: #FFFFFF;
          --card: #FFFFFF;
          --border: #E2E8F0;
          --border-light: #F1F5F9;
          --text: #1E293B;
          --text-muted: #64748B;
          --text-dim: #94A3B8;
          --sidebar-w: 240px;
          --topbar-h: 64px;
          --radius: 12px;
          --radius-sm: 8px;
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
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
         <aside className={`fixed top-0 left-0 bottom-0 w-[240px] bg-white border-r border-(--border) flex flex-col z-[200] transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="p-5 pb-4 border-b border-(--border-light) flex items-center gap-2.5">
               <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-lg font-extrabold text-white shadow-[0_4px_12px_rgba(255,107,0,0.2)]">
                  FT
               </div>
               <div className="font-bold text-lg tracking-tight text-secondary">
                  Fleet<span className="text-primary">Track</span>
               </div>
            </div>

            <nav className="flex-1 p-3 overflow-y-auto space-y-0.5">
               <div className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase px-2.5 py-3 mt-1">Main</div>
               <a href="#" className="flex items-center gap-2.5 p-2.5 rounded-lg bg-primary-light text-primary font-bold relative transition-all">
                  <div className="absolute left-0 top-1/5 bottom-1/5 w-1 bg-primary rounded-full" />
                  <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                  Dashboard
               </a>
               {[
                  { label: "Jobs", icon: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16", badge: "12" },
                  { label: "Trucks", icon: "M1 3h15v13H1z M16 8h4l3 3v5h-7V8z", extra: "circle" },
                  { label: "Drivers", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" },
               ].map((item, i) => (
                  <a key={i} href="#" className="flex items-center gap-2.5 p-2.5 rounded-lg text-secondary/60 hover:bg-secondary-light hover:text-secondary transition-all text-[13.5px] font-bold">
                     <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {item.label === 'Jobs' ? <><rect x="2" y="7" width="20" height="14" rx="2" /><path d={item.icon} /></> :
                           item.label === 'Trucks' ? <><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></> :
                              <><path d={item.icon} /><circle cx="12" cy="7" r="4" /></>}
                     </svg>
                     {item.label}
                     {item.badge && <span className="ml-auto bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">{item.badge}</span>}
                  </a>
               ))}

               <div className="text-[10px] font-bold text-neutral-400 tracking-widest uppercase px-2.5 py-3 mt-4">Operations</div>
               {[
                  { label: "Finance", icon: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
                  { label: "Reports", icon: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" },
               ].map((item, i) => (
                  <a key={i} href="#" className="flex items-center gap-2.5 p-2.5 rounded-lg text-secondary/60 hover:bg-secondary-light hover:text-secondary transition-all text-[13.5px] font-bold">
                     <svg className="w-4.5 h-4.5 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        {item.label === 'Finance' ? <><line x1="12" y1="1" x2="12" y2="23" /><path d={item.icon} /></> :
                           item.label === 'Reports' ? <><path d={item.icon} /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></> :
                              <path d={item.icon} />}
                     </svg>
                     {item.label}
                  </a>
               ))}
            </nav>

            <div className="p-3 border-t border-(--border-light)">
               <div className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-neutral-50 cursor-pointer group transition-colors border border-transparent hover:border-(--border-light)">
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-primary-mid flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-lg shadow-primary/20">
                     AO
                  </div>
                  <div className="min-w-0 flex-1">
                     <div className="text-[13px] font-display font-bold text-secondary truncate">Adebayo Okafor</div>
                     <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">Administrator</div>
                  </div>
               </div>
            </div>
         </aside>

         {/* Main Content Area */}
         <div className="flex-1 lg:ml-[240px] flex flex-col min-w-0">
            {/* Topbar */}
            <header className="h-[64px] bg-white/80 backdrop-blur-md border-b border-(--border-light) sticky top-0 z-[100] flex items-center px-5 gap-3.5">
               <button className="p-1.5 rounded-lg text-(--text-muted) hover:bg-neutral-100 lg:hidden" onClick={toggleSidebar}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
               </button>

               <div className="flex-1 max-w-[380px] relative flex items-center group">
                  <svg className="absolute left-3.5 w-4 h-4 text-neutral-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  <input
                     type="text"
                     className="w-full bg-neutral-50 border border-(--border-light) rounded-xl py-2 pl-10 pr-4 text-sm text-secondary outline-none focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
                     placeholder="Search trucks, jobs, routes..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>

               <div className="ml-auto flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-50 border border-(--border-light) text-secondary/60 hover:text-primary cursor-pointer relative group transition-all" onClick={toggleNotif}>
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                     <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white ring-2 ring-primary/20 animate-pulse" />
                  </div>

                  <div className="h-6 w-[1px] bg-(--border-light)" />

                  <div className="flex items-center gap-2">
                     <span
                        onClick={handleAdminBadgeClick}
                        className="bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2.5 py-1 rounded-full tracking-widest  uppercase cursor-pointer hover:bg-primary/20 transition-all active:scale-95 select-none"
                     >
                        admin
                     </span>
                     <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-mid flex items-center justify-center font-bold text-xs text-white border-2 border-white shadow-xl shadow-primary/20 cursor-pointer hover:scale-105 transition-transform active:scale-95">
                        AO
                     </div>
                  </div>
               </div>
            </header>

            {/* Notif Panel */}
            <div className={`fixed top-[64px] right-0 w-[320px] bg-white border-l border-(--border-light) h-[calc(100vh-64px)] z-[300] transition-transform duration-300 shadow-2xl ${isNotifOpen ? 'translate-x-0' : 'translate-x-full'}`}>
               <div className="p-4 border-b border-(--border-light) flex items-center justify-between font-display font-bold text-secondary">
                  <span>🔔 Notifications</span>
                  <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-secondary transition-colors" onClick={toggleNotif}>×</button>
               </div>
               <div className="p-2 overflow-y-auto h-full space-y-2 bg-neutral-50/50">
                  {[
                     { icon: "⛽", title: "Low Fuel Alert", body: "TRK-018 is at 8% fuel. Refuel needed on Lagos route.", time: "3 min ago", unread: true },
                     { icon: "📋", title: "License Expiring", body: "Driver Kwame Mensah's license expires in 5 days.", time: "18 min ago", unread: true },
                     { icon: "✅", title: "Delivery Completed", body: "Job #FL-2847 delivered successfully. route cleared.", time: "42 min ago" },
                  ].map((notif, i) => (
                     <div key={i} className={`p-4 rounded-xl flex gap-3 border transition-all cursor-pointer ${notif.unread ? 'bg-white border-primary/10 shadow-sm' : 'bg-transparent border-transparent hover:bg-white hover:border-neutral-200'}`}>
                        <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 text-lg shadow-inner">{notif.icon}</div>
                        <div className="flex-1">
                           <div className="text-[13px] font-bold text-secondary">{notif.title}</div>
                           <div className="text-[11.5px] text-neutral-500 leading-tight mt-1">{notif.body}</div>
                           <div className="text-[10px] font-bold text-neutral-400 mt-2 uppercase tracking-wider">{notif.time}</div>
                        </div>
                        {notif.unread && <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0 shadow-[0_0_8px_rgba(255,107,0,0.5)]" />}
                     </div>
                  ))}
               </div>
            </div>

            {/* Dashboard Content */}
            <main className="p-6 pb-20 space-y-6">
               <div>
                  <div className="flex items-center gap-1.5 text-[12px] text-(--text-muted) mb-1.5 font-bold uppercase tracking-wider">
                     <span>FleetTrack</span>
                     <span className="text-(--border)">›</span>
                     <span className="text-[#FF6B00] font-bold">Dashboard</span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-(--text)">Fleet Overview</h1>
                  <p className="text-[13px] text-(--text-dim) mt-0.5">April 2026 · Global Logistics Hub · 40 trucks active</p>
                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                     {[
                        { lbl: "Total Trucks", val: "40", icon: "🚛", sub: "32 active · 6 idle", trend: "↑ 100%", color: "text-primary" },
                        { lbl: "Active Jobs", val: "12", icon: "📦", sub: "8 transit · 4 loading", trend: "↑ 4 today", color: "text-success", variant: "success" },
                        { lbl: "Fuel Used", val: "2,840L", icon: "⛽", sub: "₦ 3.2M total cost", trend: "↑ 12% vs yest", variant: "warning" },
                        { lbl: "Payments", val: "₦4.8M", icon: "💳", sub: "7 invoices pending", trend: "↓ 2 cleared", variant: "danger" },
                     ].map((kpi, i) => (
                        <div key={i} className="bg-white border border-(--border-light) rounded-2xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all animate-fade-up shadow-sm hover:shadow-xl hover:shadow-secondary/5">
                           <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                           <div className="flex justify-between items-start mb-4">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-inner ${kpi.variant === 'success' ? 'bg-success-light' : kpi.variant === 'warning' ? 'bg-amber-50' : kpi.variant === 'danger' ? 'bg-rose-50' : 'bg-primary-light'}`}>
                                 {kpi.icon}
                              </div>
                              <div className={`text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-widest ${kpi.trend.includes('↑') ? 'text-success bg-success/10' : 'text-rose-500 bg-rose-50'}`}>
                                 {kpi.trend}
                              </div>
                           </div>
                           <div className="text-3xl font-display font-extrabold tracking-tight text-secondary">{kpi.val}</div>
                           <div className="text-[12px] font-bold text-neutral-400 mt-1 uppercase tracking-wider">{kpi.lbl}</div>
                           <div className="text-[11px] font-medium text-neutral-500 mt-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-neutral-200" />
                              {kpi.sub}
                           </div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Mid Section */}
               <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  {/* Map View */}
                  <div className="xl:col-span-2 bg-white border border-(--border-light) rounded-2xl overflow-hidden animate-fade-up shadow-sm">
                     <div className="p-5 border-b border-(--border-light) flex items-center justify-between">
                        <div className="text-sm font-display font-bold flex items-center gap-2.5 text-secondary">
                           <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">🗺</span>
                           Live Fleet Location
                           <span className="flex items-center gap-1.5 px-2.5 py-1 bg-success/10 text-success text-[10px] font-extrabold rounded-full uppercase tracking-widest border border-success/20">
                              <span className="w-1.5 h-1.5 bg-success rounded-full live-dot" />
                              Live
                           </span>
                        </div>
                        <button className="bg-neutral-50 p-2 rounded-xl border border-(--border-light) text-neutral-400 hover:text-primary hover:bg-primary-light transition-all shadow-sm" onClick={() => alert('Refreshing Map...')}>
                           <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                        </button>
                     </div>
                     <div className="h-[300px] bg-secondary-light relative flex items-center justify-center overflow-hidden">
                        {/* Actual Static Map Image */}
                        <img
                           src="/static-map.png"
                           alt="Live Fleet Map"
                           className="w-full h-full object-cover opacity-80"
                        />

                        {/* Overlay to darken slightly for better pointer visibility */}
                        <div className="absolute inset-0 bg-secondary/5 pointer-events-none" />

                        {/* Pointers */}
                        <div className="absolute top-[40%] left-[30%] w-6 h-6 bg-primary rounded-xl rotate-45 border-2 border-white shadow-xl shadow-primary/40 flex items-center justify-center group cursor-pointer transition-transform hover:scale-125 z-10">
                           <div className="absolute -top-10 -left-6 bg-white text-[10px] font-extrabold px-2 py-1 border border-neutral-100 rounded-lg text-secondary shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Truck T-14</div>
                        </div>
                        <div className="absolute top-[25%] left-[60%] w-6 h-6 bg-success rounded-xl rotate-45 border-2 border-white shadow-xl shadow-success/40 flex items-center justify-center group cursor-pointer transition-transform hover:scale-125 z-10">
                           <div className="absolute -top-10 -left-6 bg-white text-[10px] font-extrabold px-2 py-1 border border-neutral-100 rounded-lg text-secondary shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">Truck T-22</div>
                        </div>

                        <div className="absolute top-4 left-4 bg-white/90 border border-neutral-200 rounded-2xl p-4 backdrop-blur-md shadow-xl space-y-2 z-20">
                           <div className="text-[10px] text-success font-extrabold uppercase tracking-widest flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-success" /> 28 In Transit
                           </div>
                           <div className="text-[10px] text-amber-500 font-extrabold uppercase tracking-widest flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-amber-500" /> 8 Idle
                           </div>
                           <div className="text-[10px] text-rose-500 font-extrabold uppercase tracking-widest flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-rose-500" /> 4 Alerts
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="bg-white border border-(--border-light) rounded-2xl animate-fade-up shadow-sm">
                     <div className="p-5 border-b border-(--border-light)">
                        <div className="text-sm font-display font-bold text-secondary flex items-center gap-2">
                           <span className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center text-success text-xs">🚛</span>
                           Fleet Status
                        </div>
                     </div>
                     <div className="p-5 flex items-center gap-6 border-b border-neutral-50">
                        <div className="w-20 h-20 rounded-full border-[10px] border-neutral-100 border-t-success border-r-amber-400 flex flex-col items-center justify-center shrink-0 shadow-inner">
                           <span className="text-xl font-display font-extrabold text-secondary">40</span>
                        </div>
                        <div className="flex-1 space-y-3">
                           <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                              <span>Active</span>
                              <span className="text-secondary">32</span>
                           </div>
                           <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-success w-[80%] rounded-full" />
                           </div>
                           <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                              <span>Maint.</span>
                              <span className="text-secondary">2</span>
                           </div>
                           <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                              <div className="h-full bg-rose-500 w-[5%] rounded-full" />
                           </div>
                        </div>
                     </div>
                     <div className="p-3 space-y-1">
                        {[
                           { lbl: "In Transit", sub: "12 routes active", val: "28", color: "text-success", icon: "🏃", bg: "bg-success/5" },
                           { lbl: "Maintenance", sub: "ETA 2 days", val: "2", color: "text-rose-500", icon: "🔧", bg: "bg-rose-50" },
                        ].map((st, i) => (
                           <div key={i} className="flex items-center gap-3 p-3 hover:bg-neutral-50 rounded-xl transition-all cursor-pointer group">
                              <div className={`w-10 h-10 rounded-xl ${st.bg} flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform`}>{st.icon}</div>
                              <div className="flex-1 min-w-0">
                                 <div className="text-[13px] font-bold text-secondary truncate">{st.lbl}</div>
                                 <div className="text-[11px] font-medium text-neutral-400 truncate">{st.sub}</div>
                              </div>
                              <div className={`text-lg font-display font-extrabold ${st.color}`}>{st.val}</div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="flex flex-wrap gap-3">
                  <button className="bg-[#FF6B00] text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest shadow-[0_4px_16px_rgba(255,107,0,0.25)] hover:-translate-y-0.5 active:scale-95 transition-all" onClick={() => setCreateJobOpen(true)}>＋ Create Job</button>
                  <button className="bg-white border border-(--border) text-(--text-muted) px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-neutral-50 hover:text-(--text) shadow-sm transition-all" onClick={() => showToast('Dispatching scheduler opened', 'info')}>🚛 Dispatch Truck</button>
                  <button className="bg-white border border-(--border) text-(--text-muted) px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-neutral-50 hover:text-(--text) shadow-sm transition-all" onClick={() => showToast('Fuel log opened', 'info')}>⛽ Log Fuel</button>
                  <button className="bg-white border border-(--border) text-(--text-muted) px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-neutral-50 hover:text-(--text) shadow-sm transition-all" onClick={() => showToast('Report generation started', 'info')}>📄 Export Report</button>
               </div>

               {/* Table */}
               <div className="bg-white border border-(--border-light) rounded-2xl overflow-hidden animate-fade-up shadow-sm">
                  <div className="p-5 border-b border-(--border-light) flex items-center justify-between bg-neutral-50/30">
                     <div className="text-sm font-display font-bold text-secondary flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs">📋</span>
                        Recent Operations
                     </div>
                     <select className="bg-white border border-(--border-light) text-[11px] font-extrabold text-neutral-400 rounded-lg px-3 py-1.5 outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all uppercase tracking-widest cursor-pointer">
                        <option>All Jobs</option>
                        <option>In Transit</option>
                     </select>
                  </div>
                  <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead className="bg-neutral-50 text-[10px] text-neutral-400 uppercase tracking-[0.1em] font-extrabold">
                           <tr>
                              <th className="px-6 py-4">Job ID</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Driver</th>
                              <th className="px-6 py-4">Route</th>
                              <th className="px-6 py-4">ETA</th>
                              <th className="px-6 py-4 text-center">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 text-[13px]">
                           {[
                              { id: "#FL-2851", status: "In Transit", driver: "Adaeze O.", route: "Lagos → Abuja", eta: "14:30", type: "transit" },
                              { id: "#FL-2847", status: "Delivered", driver: "Kwame M.", route: "Nairobi → Mom.", eta: "Done", type: "success" },
                              { id: "#FL-2843", status: "Delayed", driver: "Fatima O.", route: "Cairo → Alex.", eta: "+2h", type: "danger" },
                           ].map((row, i) => (
                              <tr key={i} className="hover:bg-neutral-50/50 cursor-pointer transition-colors group" onClick={() => showToast(`Opening details for ${row.id}`, 'info')}>
                                 <td className="px-6 py-5 font-display font-extrabold text-primary">{row.id}</td>
                                 <td className="px-6 py-5">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${row.type === 'transit' ? 'bg-primary/10 text-primary' : row.type === 'success' ? 'bg-success/10 text-success' : 'bg-rose-50 text-rose-500'}`}>
                                       <span className={`w-1.5 h-1.5 rounded-full ${row.type === 'transit' ? 'bg-primary animate-pulse' : row.type === 'success' ? 'bg-success' : 'bg-rose-500'}`} />
                                       {row.status}
                                    </span>
                                 </td>
                                 <td className="px-6 py-5 text-secondary font-bold">{row.driver}</td>
                                 <td className="px-6 py-5 text-neutral-500 font-medium">{row.route}</td>
                                 <td className="px-6 py-5 font-display font-bold text-secondary">{row.eta}</td>
                                 <td className="px-6 py-5">
                                    <div className="flex gap-2 justify-center">
                                       <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 group-hover:text-primary group-hover:bg-primary-light transition-all shadow-sm">👁</div>
                                       <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-400 group-hover:text-primary group-hover:bg-primary-light transition-all shadow-sm">✏️</div>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
                  <div className="p-5 border-t border-(--border-light) flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50/30">
                     <span>Showing 3 of 12 operations</span>
                     <button className="text-primary font-extrabold hover:underline transition-all">View All Operations →</button>
                  </div>
               </div>

               {/* Activity Feed and Renewals Grid */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4">
                  <div className="bg-white border border-(--border-light) rounded-2xl p-5 shadow-sm">
                     <div className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-primary rounded-full" />
                        Upcoming Renewals
                     </div>
                     <div className="space-y-3">
                        {[
                           { title: "TRK-18 · Road Worthy", sub: "Bongani Nkosi", days: "3d", variant: "urgent" },
                           { title: "Kwame M. · License", sub: "Driver Permit", days: "5d", variant: "warn" },
                           { title: "TRK-07 · Insurance", sub: "Third Party Policy", days: "12d", variant: "warn" },
                        ].map((ren, i) => (
                           <div key={i} className="bg-neutral-50/50 border border-neutral-100 rounded-xl p-4 flex items-center justify-between hover:border-primary/20 transition-all cursor-pointer group shadow-sm hover:shadow-md">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-xl bg-white border border-(--border-light) flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">📅</div>
                                 <div>
                                    <div className="text-[13.5px] font-bold text-secondary">{ren.title}</div>
                                    <div className="text-[11.5px] font-medium text-neutral-400">{ren.sub}</div>
                                 </div>
                              </div>
                              <div className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest ${ren.variant === 'urgent' ? 'bg-rose-50 text-rose-500' : 'bg-amber-50 text-amber-500'}`}>
                                 {ren.days}
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-white border border-(--border-light) rounded-2xl p-5 shadow-sm">
                     <div className="text-[11px] font-extrabold text-neutral-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-secondary rounded-full" />
                        Activity Feed
                     </div>
                     <div className="space-y-5">
                        {[
                           { icon: "✅", title: "Job Delivered", body: "FL-2847 delivered in Nairobi", time: "42 min ago", color: "bg-success/10 text-success" },
                           { icon: "⛽", title: "Low Fuel Alert", body: "TRK-018 needs fuel in Lagos", time: "3 min ago", color: "bg-rose-50 text-rose-500" },
                           { icon: "🚛", title: "New Dispatch", body: "TRK-07 sent to Kumasi", time: "1h ago", color: "bg-secondary-light text-secondary" },
                        ].map((act, i) => (
                           <div key={i} className="flex gap-4 group cursor-pointer">
                              <div className={`w-10 h-10 rounded-xl ${act.color} flex items-center justify-center text-sm shrink-0 shadow-inner group-hover:scale-110 transition-transform`}>{act.icon}</div>
                              <div>
                                 <div className="text-[13.5px] font-bold text-secondary group-hover:text-primary transition-colors">{act.title}</div>
                                 <div className="text-[11.5px] font-medium text-neutral-400 mt-0.5">{act.body} • <span className="font-bold text-neutral-300">{act.time}</span></div>
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
               <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={() => setCreateJobOpen(false)} />
               <div className="relative w-full max-w-2xl bg-white border border-(--border-light) rounded-[32px] shadow-2xl overflow-hidden animate-fade-up">
                  <div className="p-8 border-b border-(--border-light) flex justify-between items-center bg-neutral-50/50">
                     <div>
                        <h2 className="text-2xl font-display font-extrabold tracking-tight text-secondary">Create New Job</h2>
                        <p className="text-[13px] font-medium text-neutral-400 mt-1">Fill in the details to proceed with job assignment</p>
                     </div>
                     <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-(--border-light) text-neutral-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm" onClick={() => setCreateJobOpen(false)}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" /></svg>
                     </button>
                  </div>

                  <div className="p-8 overflow-y-auto max-h-[70vh] space-y-8 custom-scrollbar">
                     {/* Section: Party & Billing */}
                     <div className="space-y-5">
                        <div className="flex items-center gap-2.5 text-[11px] font-extrabold text-primary uppercase tracking-[0.2em] px-1">
                           <span className="w-2 h-2 rounded-full bg-primary" />
                           Party Details
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Client / Logistics Company</label>
                              <input type="text" className="w-full bg-neutral-50 border border-(--border-light) rounded-2xl px-5 py-4 text-sm font-bold text-secondary placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner" placeholder="Enter company name" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Contact Person</label>
                              <input type="text" className="w-full bg-neutral-50 border border-(--border-light) rounded-2xl px-5 py-4 text-sm font-bold text-secondary placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner" placeholder="Phone Number" />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Billing Details</label>
                           <textarea className="w-full bg-neutral-50 border border-(--border-light) rounded-2xl px-5 py-4 text-sm font-bold text-secondary placeholder:text-neutral-300 focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner resize-none" rows={2} placeholder="Address, GST/VAT, etc." />
                        </div>
                     </div>

                     {/* Section: Job Specs */}
                     <div className="space-y-5 pt-8 border-t border-(--border-light)">
                        <div className="flex items-center gap-2.5 text-[11px] font-extrabold text-secondary uppercase tracking-[0.2em] px-1">
                           <span className="w-2 h-2 rounded-full bg-secondary" />
                           Job Specifications
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Pickup Location</label>
                              <input type="text" className="w-full bg-neutral-50 border border-(--border-light) rounded-2xl px-5 py-4 text-sm font-bold text-secondary" placeholder="Lagos, Abuja..." />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Dropoff Location</label>
                              <input type="text" className="w-full bg-neutral-50 border border-(--border-light) rounded-2xl px-5 py-4 text-sm font-bold text-secondary" placeholder="Accra, Kumasi..." />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Goods Type</label>
                              <input type="text" className="w-full bg-neutral-50 border border-(--border-light) rounded-2xl px-5 py-4 text-sm font-bold text-secondary" placeholder="Electronics, Tiles..." />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest ml-1">Quantity/Weight</label>
                              <input type="text" className="w-full bg-neutral-50 border border-(--border-light) rounded-2xl px-5 py-4 text-sm font-bold text-secondary" placeholder="1000kg / 2 Trucks" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="p-8 border-t border-(--border-light) bg-neutral-50/50 flex gap-4">
                     <button className="flex-1 bg-primary text-white py-4 rounded-2xl font-display font-extrabold shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-widest" onClick={() => {
                        showToast(`Job for admin created successfully!`, "success");
                        setCreateJobOpen(false);
                     }}>
                        Confirm & Create Job
                     </button>
                     <button className="px-8 bg-white border border-(--border-light) text-neutral-400 font-bold rounded-2xl hover:bg-neutral-100 hover:text-secondary transition-all text-sm uppercase tracking-widest" onClick={() => setCreateJobOpen(false)}>
                        Cancel
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* PIN Entry Modal */}
         {showPinModal && (
            <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-secondary/60 backdrop-blur-md" onClick={() => { setShowPinModal(false); setEnteredPin(""); setPinError(false); }} />
               <div className="relative w-full max-w-sm bg-white border border-(--border-light) rounded-[32px] shadow-2xl p-8 animate-fade-up text-center">
                  <div className="w-16 h-16 bg-primary-light rounded-2xl flex items-center justify-center text-primary text-2xl mx-auto mb-6 shadow-pill">
                     🔐
                  </div>
                  <h3 className="text-xl font-display font-extrabold text-secondary mb-2">Secret Access</h3>
                  <p className="text-sm text-neutral-400 mb-8 font-medium">Enter your 6-digit administrator PIN to proceed.</p>

                  <form onSubmit={handlePinSubmit} className="space-y-6">
                     <div className="relative">
                        <input
                           type="password"
                           maxLength={6}
                           autoFocus
                           className={`w-full bg-neutral-50 border ${pinError ? 'border-rose-500 ring-4 ring-rose-50' : 'border-(--border-light) focus:border-primary/30 focus:ring-4 focus:ring-primary/5'} rounded-2xl px-6 py-4 text-center text-2xl font-bold tracking-[0.5em] text-secondary outline-none transition-all placeholder:text-neutral-200`}
                           placeholder="••••••"
                           value={enteredPin}
                           onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setEnteredPin(val);
                              if (pinError) setPinError(false);
                           }}
                        />
                        {pinError && (
                           <p className="text-[11px] font-bold text-rose-500 mt-2 uppercase tracking-widest">Invalid Security Pin</p>
                        )}
                     </div>

                     <div className="flex gap-3">
                        <button
                           type="submit"
                           className="flex-1 bg-primary text-white py-4 rounded-xl font-display font-extrabold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-widest"
                        >
                           Verify Pin
                        </button>
                        <button
                           type="button"
                           onClick={() => { setShowPinModal(false); setEnteredPin(""); setPinError(false); }}
                           className="px-6 bg-white border border-(--border-light) text-neutral-400 font-bold rounded-xl hover:bg-neutral-50 transition-all text-sm uppercase tracking-widest"
                        >
                           Cancel
                        </button>
                     </div>
                  </form>
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
