"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { getSocket } from "@/lib/socket";
import { notificationService } from "@/services/notificationService";

export interface AppNotification {
  id: string;
  icon: string;
  title: string;
  body: string;
  link?: string;
  time: Date;
  unread: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (icon: string, title: string, body: string, link?: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  addNotification: () => {},
  markAllRead: () => {},
  clearAll: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load from DB on mount
  useEffect(() => {
    notificationService.getAll()
      .then(data => {
        setNotifications(data.map(n => ({
          id: n._id,
          icon: n.icon,
          title: n.title,
          body: n.body,
          link: n.link || undefined,
          time: new Date(n.createdAt),
          unread: n.unread,
        })));
      })
      .catch(() => {});
  }, []);

  // Shared helper — saves to DB and adds to state with fallback
  const saveNotif = async (payload: { icon: string; title: string; body: string; link?: string }) => {
    try {
      const saved = await notificationService.create(payload);
      setNotifications(prev => [{
        id: saved._id,
        icon: saved.icon,
        title: saved.title,
        body: saved.body,
        link: saved.link || undefined,
        time: new Date(saved.createdAt),
        unread: true,
      }, ...prev]);
    } catch {
      // DB unavailable — still show in bell
      setNotifications(prev => [{
        id: `${Date.now()}-${Math.random()}`,
        ...payload,
        time: new Date(),
        unread: true,
      }, ...prev]);
    }
    playBeep();
  };

  // Socket listeners
  useEffect(() => {
    const socket = getSocket();

    const handleNewJob = (data: { tripId: string; pickup: string; dropoff: string; goods: string; createdAt: string }) => {
      saveNotif({
        icon: "📦",
        title: `New Job: ${data.tripId}`,
        body: `${Array.isArray(data.goods) ? data.goods.join(", ") : data.goods} · ${data.pickup} → ${data.dropoff}`,
        link: "/admin/requests",
      });
    };

    const handleChatNotif = (data: { roomId: string; senderName: string; message: string }) => {
      saveNotif({
        icon: "💬",
        title: `New Message — ${data.senderName}`,
        body: data.message,
        link: `/admin/requests?openChat=${data.roomId}`,
      });
    };

    socket.on("new_job", handleNewJob);
    socket.on("chat_notification", handleChatNotif);
    return () => {
      socket.off("new_job", handleNewJob);
      socket.off("chat_notification", handleChatNotif);
    };
  }, []);

  const playBeep = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch { /* silent */ }
  };

  const addNotification = (icon: string, title: string, body: string, link?: string) => {
    saveNotif({ icon, title, body, link });
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    notificationService.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const clearAll = () => {
    notificationService.clearAll().catch(() => {});
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}
