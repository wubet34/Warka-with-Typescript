import api from "../api/client";
import type { Post, User, Community } from "../types/index";

export interface SearchResults {
  posts: Post[];
  users: User[];
  communities: Community[];
  comments: { id: number; content: string; created_at: string; user_id: number; username: string; post_id: number; post_title: string }[];
}

export const searchService = {
  // Unified full-text search
  async searchAll(q: string): Promise<SearchResults> {
    const { data } = await api.get<{ success: boolean; posts: Post[]; users: User[]; communities: Community[]; comments?: SearchResults["comments"] }>(
      `/search?q=${encodeURIComponent(q)}`
    );
    return { posts: data.posts, users: data.users, communities: data.communities, comments: data.comments ?? [] };
  },

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
