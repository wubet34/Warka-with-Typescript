import api from "../api/client";

export interface Conversation { user_id: number; username: string; profile_image?: string; last_message: string; last_message_at: string; unread_count: number }
export interface DirectMessage { id: number; sender_id: number; recipient_id: number; body: string; image?: string | null; created_at: string; read_at?: string; sender_username: string }
export const messageService = {
  async list(): Promise<Conversation[]> { const { data } = await api.get("/messages"); return data.conversations; },
  async thread(userId: number): Promise<{ messages: DirectMessage[]; blocked: boolean }> { const { data } = await api.get(`/messages/${userId}`); return data; },
  async getUser(userId: number): Promise<{ id: number; username: string; profile_image?: string }> { const { data } = await api.get(`/users/${userId}`); return data.user; },
  async send(userId: number, body: string, image?: File): Promise<DirectMessage> {
    const form = new FormData();
    if (body.trim()) form.append("body", body.trim());
    if (image) form.append("image", image);
    const { data } = await api.post(`/messages/${userId}`, form, { headers: { "Content-Type": "multipart/form-data" } });
    return data.message;
  },
  async hide(userId: number): Promise<void> { await api.delete(`/messages/${userId}`); },
  async block(userId: number): Promise<void> { await api.post(`/messages/${userId}/block`); },
  async unblock(userId: number): Promise<void> { await api.delete(`/messages/${userId}/block`); },
};
