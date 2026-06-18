import { fetchApi } from "./api";

export interface DBNotification {
  _id: string;
  icon: string;
  title: string;
  body: string;
  link: string;
  unread: boolean;
  createdAt: string;
}

export const notificationService = {
  getAll: (): Promise<DBNotification[]> => fetchApi("/api/notifications"),
  getForClient: (clientId: string): Promise<DBNotification[]> => fetchApi(`/api/notifications?clientId=${clientId}`),

  create: (data: { icon: string; title: string; body: string; link?: string; recipientId?: string }): Promise<DBNotification> =>
    fetchApi("/api/notifications", { method: "POST", body: JSON.stringify(data) }),

  markAllRead: (clientId?: string): Promise<void> =>
    fetchApi(`/api/notifications/read${clientId ? `?clientId=${clientId}` : ""}`, { method: "PATCH" }),

  clearAll: (clientId?: string): Promise<void> =>
    fetchApi(`/api/notifications${clientId ? `?clientId=${clientId}` : ""}`, { method: "DELETE" }),
};
