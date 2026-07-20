import api from "../api/client";
import type { Post, User, Community } from "../types/index";

export const searchService = {
  async searchPosts(q: string): Promise<Post[]> {
    const { data } = await api.get<{ success: boolean; posts: Post[] }>(
      `/search/posts?q=${encodeURIComponent(q)}`
    );
    return data.posts;
  },

  async searchUsers(q: string): Promise<User[]> {
    const { data } = await api.get<{ success: boolean; users: User[] }>(
      `/search/users?q=${encodeURIComponent(q)}`
    );
    return data.users;
  },

  async searchCommunities(q: string): Promise<Community[]> {
    const { data } = await api.get<{ success: boolean; communities: Community[] }>(
      `/search/communities?q=${encodeURIComponent(q)}`
    );
    return data.communities;
  },
};
