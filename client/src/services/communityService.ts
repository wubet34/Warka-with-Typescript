import api from "../api/client";
import type { Community, Post } from "../types/index";

export const communityService = {
  async getCommunities(): Promise<Community[]> {
    const { data } = await api.get<{ success: boolean; communities: Community[] }>(
      "/communities"
    );
    return data.communities;
  },

  async getCommunityBySlug(slug: string): Promise<Community> {
    const { data } = await api.get<{ success: boolean; community: Community }>(
      `/communities/${slug}`
    );
    return data.community;
  },

  async getCommunityPosts(id: number): Promise<Post[]> {
    const { data } = await api.get<{ success: boolean; posts: Post[] }>(
      `/communities/${id}/posts`
    );
    return data.posts;
  },

  async createCommunity(payload: {
    name: string;
    description?: string;
    rules?: string;
    tags?: string[];
  }): Promise<Community> {
    const { data } = await api.post<{ success: boolean; community: Community }>(
      "/communities",
      payload
    );
    return data.community;
  },

  async checkMembership(id: number): Promise<boolean> {
    const { data } = await api.get<{ success: boolean; isMember: boolean }>(
      `/communities/${id}/membership`
    );
    return data.isMember;
  },

  async joinCommunity(id: number): Promise<void> {
    await api.post(`/communities/${id}/join`);
  },

  async leaveCommunity(id: number): Promise<void> {
    await api.delete(`/communities/${id}/leave`);
  },

  async canModerate(id: number): Promise<boolean> {
    const { data } = await api.get<{ success: boolean; canModerate: boolean }>(`/communities/${id}/moderation`);
    return data.canModerate;
  },

  async moderatePost(communityId: number, postId: number, action: "lock" | "unlock" | "pin" | "unpin" | "remove"): Promise<void> {
    await api.post(`/communities/${communityId}/posts/${postId}/moderation`, { action });
  },

  async setModerator(communityId: number, userId: number): Promise<void> {
    await api.post(`/communities/${communityId}/moderators`, { user_id: userId });
  },

  async removeModerator(communityId: number, userId: number): Promise<void> {
    await api.delete(`/communities/${communityId}/moderators`, { data: { user_id: userId } });
  },
};
