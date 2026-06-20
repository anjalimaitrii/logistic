"use client";

import { useNotifications } from "@/context/NotificationContext";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

interface AdminNotifPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminNotifPanel({ isOpen, onClose }: AdminNotifPanelProps) {
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const router = useRouter();

  const handleOpen = () => {
    if (unreadCount > 0) markAllRead();
  };

  const handleClick = (link?: string) => {
    if (!link) return;
    onClose();
    router.push(link);
  };

  return (
    <div
      className={`fixed top-[64px] right-0 w-[320px] bg-white border-l border-neutral-100 h-[calc(100vh-64px)] z-300 transition-transform duration-300 shadow-2xl flex flex-col ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      onAnimationEnd={() => { if (isOpen) handleOpen(); }}
      ref={(el) => { if (el && isOpen && unreadCount > 0) setTimeout(markAllRead, 300); }}
    >
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between font-bold text-neutral-900 shrink-0">
        <div className="flex items-center gap-2">
          <span>🔔 Notifications</span>
          {unreadCount > 0 && (
            <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest hover:text-rose-500 transition-colors px-2 py-1 rounded-lg hover:bg-rose-50"
            >
              Clear
            </button>
          )}
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-neutral-50/50">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="text-4xl mb-3">🔕</div>
            <p className="text-[12px] font-bold text-neutral-400">No notifications yet</p>
            <p className="text-[10px] text-neutral-300 mt-1">Messages and job updates appear here</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleClick(notif.link)}
              className={`p-4 rounded-xl flex gap-3 border transition-all ${
                notif.link ? "cursor-pointer hover:shadow-md hover:border-primary/20" : "cursor-default"
              } ${
                notif.unread
                  ? "bg-white border-primary/10 shadow-sm"
                  : "bg-transparent border-transparent hover:bg-white hover:border-neutral-200"
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 text-lg shadow-inner">
                {notif.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-bold text-neutral-900">{notif.title}</div>
                <div className="text-[11.5px] text-neutral-500 leading-tight mt-1 line-clamp-2">{notif.body}</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                    {formatDistanceToNow(new Date(notif.time), { addSuffix: true })}
                  </span>
                </div>
              </div>
              {notif.unread && (
                <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0 shadow-[0_0_8px_rgba(212,23,39,0.5)]" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
