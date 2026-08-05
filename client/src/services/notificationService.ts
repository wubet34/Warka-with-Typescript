import api from "../api/client";
import type { Notification } from "../types/notification";

export const notificationService = {
  async getAll(): Promise<{ notifications: Notification[]; unread_count: number }> {
    const { data } = await api.get<{ success: boolean; notifications: Notification[]; unread_count: number }>(
      "/notifications"
    );
    return { notifications: data.notifications, unread_count: data.unread_count };
  },

  async markAllRead(): Promise<void> {
    await api.put("/notifications/read-all");
  },

  async markOneRead(id: number): Promise<void> {
    await api.put(`/notifications/${id}/read`);
  },

  async deleteOne(id: number): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
