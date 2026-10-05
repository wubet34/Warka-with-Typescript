import api from "../api/client";
import type { Post } from "../types/index";

export const bookmarkService = {
  async getBookmarks(): Promise<Post[]> {
    const { data } = await api.get<{ success: boolean; posts: Post[] }>("/bookmarks");
    return data.posts;
  },
  async add(postId: number): Promise<void> { await api.post(`/bookmarks/${postId}`); },
  async remove(postId: number): Promise<void> { await api.delete(`/bookmarks/${postId}`); },
};
