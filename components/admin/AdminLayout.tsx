"use client";

import { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import AdminNotifPanel from "./AdminNotifPanel";
import PinModal from "./PinModal";
import { motion } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isNotifOpen, setNotifOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  const isDesktop = useMediaQuery("(min-width: 1024px)");

  // Toggle handlers
  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const toggleNotif = () => setNotifOpen(!isNotifOpen);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans overflow-x-hidden transition-colors duration-500">
      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[150] backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="hidden lg:block fixed top-0 left-0 h-screen z-50">
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isExpanded={isSidebarExpanded}
          onHover={setIsSidebarExpanded}
        />
      </div>

      {/* Side effect for mobile which uses old sidebar props */}
      <div className="lg:hidden">
        <AdminSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          isExpanded={true} 
          onHover={() => {}}
        />
      </div>

      <motion.div 
        initial={false}
        animate={{
          paddingLeft: isDesktop ? (isSidebarExpanded ? 240 : 68) : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col min-w-0"
      >
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
      </motion.div>

      <PinModal 
        isOpen={showPinModal} 
        onClose={() => setShowPinModal(false)} 
      />
    </div>
  );
}
