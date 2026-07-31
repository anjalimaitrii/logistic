"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import PinModal from "./PinModal";
import { useNotifications } from "@/context/NotificationContext";
import { getAdminAccountType, type AdminAccountType } from "@/lib/adminRole";

interface AdminTopbarProps {
  onToggleSidebar: () => void;
  onToggleNotif: () => void;
}

export default function AdminTopbar({ onToggleSidebar, onToggleNotif }: AdminTopbarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [adminClicks, setAdminClicks] = useState(0);
  const { unreadCount } = useNotifications();
  const [showPinModal, setShowPinModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isSecretMode = pathname.startsWith("/admin/secret");

  // Logged-in admin name (set at login) — falls back to "Admin"
  const [adminName, setAdminName] = useState("Admin");
  const [accountType, setAccountType] = useState<AdminAccountType>("admin");
  useEffect(() => {
    setAdminName(localStorage.getItem("adminName") || "Admin");
    setAccountType(getAdminAccountType());
  }, []);
  const initials = adminName.split(" ").map((n) => n[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "AD";

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  const handleLogout = () => {
    document.cookie = 'role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminName');
    localStorage.removeItem('adminEmail');
    localStorage.removeItem('adminAccountType');
    setShowProfileMenu(false);
    router.push("/");
  };

  const handleAdminBadgeClick = () => {
    if (isSecretMode) return; // Disable trigger if already in secret mode

    const newClicks = adminClicks + 1;
    setAdminClicks(newClicks);
    if (newClicks >= 5) {
      setShowPinModal(true);
      setAdminClicks(0);
    }
    // Auto-reset clicks after 3 seconds
    const timeout = setTimeout(() => setAdminClicks(0), 3000);
    return () => clearTimeout(timeout);
  };

  return (
  <>
    <header className="h-[64px] bg-white/80 backdrop-blur-md border-b border-neutral-100 sticky top-0 z-100 flex items-center px-5 gap-3.5">
      <button
        className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 lg:hidden"
        onClick={onToggleSidebar}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className="flex-1 max-w-[380px] relative flex items-center group">
        <svg
          className="absolute left-3.5 w-4 h-4 text-neutral-400 group-focus-within:text-primary transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="w-full bg-neutral-50 border border-neutral-100 rounded-xl py-2 pl-10 pr-4 text-sm text-neutral-900 outline-none focus:border-primary/30 focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all shadow-inner"
          placeholder="Search trucks, jobs, routes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="ml-auto flex items-center gap-3">
        <div
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-50 border border-neutral-100 text-neutral-500/80 hover:text-primary cursor-pointer relative group transition-all"
          onClick={onToggleNotif}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-lg shadow-primary/30 animate-bounce">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : (
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-white ring-2 ring-primary/20 animate-pulse" />
          )}
        </div>

        <div className="h-6 w-px bg-neutral-100" />

        <div className="flex items-center gap-2">
          {accountType !== "employee" && (
            <span
              className={`${
                isSecretMode
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-primary/10 text-primary border-primary/20"
              } border text-[10px] font-extrabold px-2.5 py-1 rounded-full tracking-widest uppercase transition-all select-none ${
                !isSecretMode ? "cursor-pointer hover:bg-primary/20 active:scale-95" : ""
              }`}
              onClick={handleAdminBadgeClick}
            >
              {isSecretMode ? "master" : "admin"}
            </span>
          )}

          {/* Profile Avatar + Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <div
              className="w-10 h-10 rounded-full bg-linear-to-br from-primary to-primary-mid flex items-center justify-center font-bold text-xs text-white border-2 border-white shadow-xl shadow-primary/20 cursor-pointer hover:scale-105 transition-transform active:scale-95"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              {initials}
            </div>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white rounded-2xl shadow-2xl shadow-neutral-200/60 border border-neutral-100 overflow-hidden z-[999] animate-in fade-in slide-in-from-top-2 duration-200">
                {/* User info */}
                <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-linear-to-br from-primary to-primary-mid flex items-center justify-center font-bold text-[11px] text-white shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-neutral-900 truncate">{adminName}</div>
                      <div className="text-[11px] text-neutral-400 font-medium">Fleet Admin</div>
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="p-1.5">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium cursor-pointer"
                  >
                    <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
    <PinModal
      isOpen={showPinModal}
      onClose={() => setShowPinModal(false)}
    />
  </>
  );
}
