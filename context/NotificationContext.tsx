"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { getSocket } from "@/lib/socket";
import { notificationService } from "@/services/notificationService";

export interface AppNotification {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: Date;
  unread: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (icon: string, title: string, body: string) => void;
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
          time: new Date(n.createdAt),
          unread: n.unread,
        })));
      })
      .catch(() => {/* silent */});
  }, []);

  // Socket listener for new jobs
  useEffect(() => {
    const socket = getSocket();

    const handleNewJob = (data: { tripId: string; pickup: string; dropoff: string; goods: string; createdAt: string }) => {
      const payload = {
        icon: "📦",
        title: `New Job: ${data.tripId}`,
        body: `${data.goods} · ${data.pickup} → ${data.dropoff}`,
      };
      notificationService.create(payload).then(saved => {
        const notif: AppNotification = {
          id: saved._id,
          ...payload,
          time: new Date(saved.createdAt),
          unread: true,
        };
        setNotifications(prev => [notif, ...prev]);
        playBeep();
      }).catch(() => {});
    };

    socket.on("new_job", handleNewJob);
    return () => { socket.off("new_job", handleNewJob); };
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

  const addNotification = (icon: string, title: string, body: string) => {
    // Save to DB, then add to state
    notificationService.create({ icon, title, body })
      .then(saved => {
        const notif: AppNotification = {
          id: saved._id,
          icon,
          title,
          body,
          time: new Date(saved.createdAt),
          unread: true,
        };
        setNotifications(prev => [notif, ...prev]);
        playBeep();
      })
      .catch(() => {
        // Fallback: add to state only
        const notif: AppNotification = {
          id: `${Date.now()}-${Math.random()}`,
          icon, title, body,
          time: new Date(),
          unread: true,
        };
        setNotifications(prev => [notif, ...prev]);
      });
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
