"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { getSocket } from "@/lib/socket";

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
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  markAllRead: () => {},
  clearAll: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const handleNewJob = (data: { tripId: string; pickup: string; dropoff: string; goods: string; createdAt: string }) => {
      const notif: AppNotification = {
        id: `${Date.now()}-${Math.random()}`,
        icon: "📦",
        title: `New Job: ${data.tripId}`,
        body: `${data.goods} · ${data.pickup} → ${data.dropoff}`,
        time: new Date(data.createdAt || Date.now()),
        unread: true,
      };
      setNotifications(prev => [notif, ...prev]);

      // Play a subtle beep via Web Audio API
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
      } catch {
        // Audio not available — skip silently
      }
    };

    socket.on("new_job", handleNewJob);
    return () => { socket.off("new_job", handleNewJob); };
  }, []);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () =>
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));

  const clearAll = () => setNotifications([]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}
