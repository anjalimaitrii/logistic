"use client";

interface Notif {
  icon: string;
  title: string;
  body: string;
  time: string;
  unread?: boolean;
}

interface AdminNotifPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminNotifPanel({ isOpen, onClose }: AdminNotifPanelProps) {
  const notifications: Notif[] = [
    {
      icon: "⛽",
      title: "Low Fuel Alert",
      body: "TRK-018 is at 8% fuel. Refuel needed on Lagos route.",
      time: "3 min ago",
      unread: true,
    },
    {
      icon: "📋",
      title: "License Expiring",
      body: "Driver Kwame Mensah's license expires in 5 days.",
      time: "18 min ago",
      unread: true,
    },
    {
      icon: "✅",
      title: "Delivery Completed",
      body: "Job #FL-2847 delivered successfully. route cleared.",
      time: "42 min ago",
    },
  ];

  return (
    <div
      className={`fixed top-[64px] right-0 w-[320px] bg-white border-l border-neutral-100 h-[calc(100vh-64px)] z-300 transition-transform duration-300 shadow-2xl ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between font-bold text-neutral-900">
        <span>🔔 Notifications</span>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-900 transition-colors"
          onClick={onClose}
        >
          ×
        </button>
      </div>
      <div className="p-2 overflow-y-auto h-full space-y-2 bg-neutral-50/50">
        {notifications.map((notif, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl flex gap-3 border transition-all cursor-pointer ${
              notif.unread
                ? "bg-white border-primary/10 shadow-sm"
                : "bg-transparent border-transparent hover:bg-white hover:border-neutral-200"
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 text-lg shadow-inner">
              {notif.icon}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-neutral-900">{notif.title}</div>
              <div className="text-[11.5px] text-neutral-500 leading-tight mt-1">{notif.body}</div>
              <div className="text-[10px] font-bold text-neutral-400 mt-2 uppercase tracking-wider">{notif.time}</div>
            </div>
            {notif.unread && (
              <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0 shadow-[0_0_8px_rgba(255,107,0,0.5)]" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
