"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminNotifPanel from "./AdminNotifPanel";
import PinModal from "./PinModal";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

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

      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:ml-[240px] flex flex-col min-w-0">
        <AdminTopbar 
          onToggleSidebar={toggleSidebar} 
          onToggleNotif={toggleNotif}
        />
        
        <AdminNotifPanel 
          isOpen={isNotifOpen} 
          onClose={() => setNotifOpen(false)} 
        />

        <main className="flex-1">
          {children}
        </main>
      </div>

      <PinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)} 
      />
    </div>
  );
}
