"use client";

import { useState } from "react";
import SecretSidebar from "./SecretSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminNotifPanel from "./AdminNotifPanel";

export default function SecretLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);

  // Toggle handlers
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleNotif = () => setNotifOpen(!isNotifOpen);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans overflow-x-hidden">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[150] backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <SecretSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-[240px] flex flex-col min-w-0 bg-white">
        {/* Subtle top indicator */}
        <div className="h-0.5 w-full bg-linear-to-r from-indigo-600 via-indigo-400 to-indigo-600" />
        
        <AdminTopbar 
          onToggleSidebar={toggleSidebar} 
          onToggleNotif={toggleNotif}
        />
        
        <AdminNotifPanel 
          isOpen={isNotifOpen} 
          onClose={() => setNotifOpen(false)} 
        />

        <main className="flex-1 overflow-y-auto bg-[#F8FAFC]">
          {children}
        </main>
      </div>
    </div>
  );
}
