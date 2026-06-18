"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { chatService } from "@/services/chatService";
import { notificationService } from "@/services/notificationService";
import ClientChatPanel from "@/components/client/ClientChatPanel";

export interface ClientNotif {
  id: string;
  senderName: string;
  message: string;
  tripId: string;
  time: Date;
  unread: boolean;
}

interface ClientNotifContextValue {
  notifications: ClientNotif[];
  unreadCount: number;
  unreadTrips: Set<string>;
  markAllRead: () => void;
  clearAll: () => void;
  openChat: (tripId: string) => void;
}

const ClientNotificationContext = createContext<ClientNotifContextValue>({
  notifications: [],
  unreadCount: 0,
  unreadTrips: new Set(),
  markAllRead: () => {},
  clearAll: () => {},
  openChat: () => {},
});

export const useClientNotifications = () => useContext(ClientNotificationContext);

export function ClientNotificationProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<ClientNotif[]>([]);
  const [unreadTrips, setUnreadTrips] = useState<Set<string>>(new Set());
  const [chatTripId, setChatTripId] = useState<string | null>(null);

  const clientId = user?._id || user?.id || "";

  // Load user + persisted notifications
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;
    const parsed = JSON.parse(storedUser);
    setUser(parsed);
    const cid = parsed._id || parsed.id;
    if (cid) {
      notificationService.getForClient(cid).then(data => {
        setNotifications(data.map(n => ({
          id: n._id,
          senderName: "Support",
          message: n.body,
          tripId: n.link || "",
          time: new Date(n.createdAt),
          unread: n.unread,
        })));
        // Mark trips with unread notifications
        setUnreadTrips(new Set(data.filter(n => n.unread && n.link).map(n => n.link)));
      }).catch(() => {});
    }
  }, []);

  // Socket listener — admin replies
  useEffect(() => {
    if (!clientId) return;
    chatService.onClientNotification((data: any) => {
      if (data.clientId && data.clientId !== clientId) return;
      const tripId = data.tripId || "";
      const notifKey = data.notifId || `client-${tripId}-${Date.now()}`;
      setNotifications(prev => {
        if (data.notifId && prev.some(n => n.id === data.notifId)) return prev;
        return [{ id: notifKey, senderName: data.senderName, message: data.message, tripId, time: new Date(), unread: true }, ...prev];
      });
      // Don't mark unread if that chat is currently open
      setChatTripId(prev => {
        if (prev !== tripId && tripId) setUnreadTrips(u => new Set(u).add(tripId));
        return prev;
      });
    });
    return () => chatService.offClientNotification();
  }, [clientId]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    notificationService.markAllRead(clientId).catch(() => {});
  };

  const clearAll = () => {
    setNotifications([]);
    notificationService.clearAll(clientId).catch(() => {});
  };

  const openChat = (tripId: string) => {
    if (!tripId) return;
    setChatTripId(tripId);
    setUnreadTrips(u => { const s = new Set(u); s.delete(tripId); return s; });
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <ClientNotificationContext.Provider value={{ notifications, unreadCount, unreadTrips, markAllRead, clearAll, openChat }}>
      {children}
      <ClientChatPanel
        isOpen={!!chatTripId}
        onClose={() => setChatTripId(null)}
        jobId={chatTripId || ""}
        clientId={clientId}
        clientName={user?.name || "Client"}
      />
    </ClientNotificationContext.Provider>
  );
}
