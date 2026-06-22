"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";
import { useClientNotifications } from "@/context/ClientNotificationContext";
import { formatTime } from "@/lib/datetime";

export default function ClientNotificationBell() {
  const { notifications, unreadCount, markAllRead, clearAll, openChat, routeForTrip } = useClientNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(o => !o); markAllRead(); }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-white shadow-lg animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[999] overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest">Messages from Support</span>
            {notifications.length > 0 && (
              <button onClick={clearAll} className="text-[10px] text-slate-400 hover:text-red-400 font-semibold transition-colors">Clear</button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-center text-[11px] text-slate-300 font-bold py-6 uppercase tracking-widest">No messages yet</p>
            ) : (
              notifications.map(n => (
                <button
                  key={n.id}
                  onClick={() => { openChat(n.tripId); setOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-50 transition-colors flex gap-3 items-start"
                >
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[11px] font-bold shrink-0 mt-0.5">S</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                      Support
                      {routeForTrip(n.tripId) && <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded tracking-wide">{routeForTrip(n.tripId)}</span>}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-slate-300">{formatTime(n.time)}</span>
                      {n.tripId && (
                        <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Tap to open →</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
