import api from "../api/client";

export interface FollowedUser { id: number; username: string; profile_image?: string; created_at: string }
export interface FollowedCommunity { id: number; name: string; slug: string; logo?: string; created_at: string }
export interface FollowedTag { tag: string; created_at: string }
export interface UserFollowRelationship { isFollowing: boolean; followsYou: boolean }

export const followService = {
  async getFollowing(): Promise<{ users: FollowedUser[]; communities: FollowedCommunity[]; tags: FollowedTag[] }> {
    const { data } = await api.get("/follows");
    return data;
  },
  async state(type: "users" | "communities", id: number): Promise<boolean> {
    const relationship = await followService.relationship(type, id);
    return relationship.isFollowing;
  },
  async relationship(type: "users" | "communities", id: number): Promise<UserFollowRelationship> {
    const { data } = await api.get<UserFollowRelationship>(`/follows/${type}/${id}`);
    return { isFollowing: data.isFollowing, followsYou: data.followsYou ?? false };
  },
  async set(type: "users" | "communities", id: number, follow: boolean): Promise<void> {
    if (follow) await api.post(`/follows/${type}/${id}`);
    else await api.delete(`/follows/${type}/${id}`);
  },
  async tagState(tag: string): Promise<boolean> { const { data } = await api.get<{ isFollowing: boolean }>(`/follows/tags/${encodeURIComponent(tag)}`); return data.isFollowing; },
  async setTag(tag: string, follow: boolean): Promise<void> {
    if (follow) await api.post(`/follows/tags/${encodeURIComponent(tag)}`);
    else await api.delete(`/follows/tags/${encodeURIComponent(tag)}`);
  },
};
