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
  }): Promise<Community> {
    const { data } = await api.post<{ success: boolean; community: Community }>(
      "/communities",
      payload
    );
    return data.community;
  },

  async joinCommunity(id: number): Promise<void> {
    await api.post(`/communities/${id}/join`);
  },

  async leaveCommunity(id: number): Promise<void> {
    await api.delete(`/communities/${id}/leave`);
  },
};
