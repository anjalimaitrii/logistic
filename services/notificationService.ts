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

  create: (data: { icon: string; title: string; body: string; link?: string }): Promise<DBNotification> =>
    fetchApi("/api/notifications", { method: "POST", body: JSON.stringify(data) }),

  markAllRead: (): Promise<void> =>
    fetchApi("/api/notifications/read", { method: "PATCH" }),

  clearAll: (): Promise<void> =>
    fetchApi("/api/notifications", { method: "DELETE" }),
};
