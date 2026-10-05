import api from "../api/client";
import type { Post } from "../types/index";

export const postService = {
  async getFeed(): Promise<Post[]> {
    const { data } = await api.get<{ success: boolean; posts: Post[] }>("/posts/feed");
    return data.posts;
  },

  async getPopular(): Promise<Post[]> {
    const { data } = await api.get<{ success: boolean; posts: Post[] }>("/posts/popular");
    return data.posts;
  },

  async getPosts(): Promise<Post[]> {
    const { data } = await api.get<{ success: boolean; posts: Post[] }>("/posts");
    return data.posts;
  },

  async getPostById(id: number): Promise<Post> {
    const { data } = await api.get<{ success: boolean; post: Post }>(`/posts/${id}`);
    return data.post;
  },

  async createPost(payload: {
    title: string;
    content?: string;
    community_id: number;
    image?: File;       // actual file object
    link?: string;
    post_type?: NonNullable<Post["post_type"]>;
    tags?: string[];
    poll_options?: string[];
  }): Promise<Post> {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("community_id", String(payload.community_id));
    if (payload.content !== undefined) form.append("content", payload.content);
    if (payload.image)   form.append("image", payload.image);
    if (payload.link)    form.append("link", payload.link);
    if (payload.post_type) form.append("post_type", payload.post_type);
    if (payload.tags) form.append("tags", JSON.stringify(payload.tags));
    if (payload.poll_options) form.append("poll_options", JSON.stringify(payload.poll_options));

    const { data } = await api.post<{ success: boolean; post: Post }>("/posts", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.post;
  },

  async updatePost(
    id: number,
    payload: { title: string; content?: string; image?: File; link?: string }
  ): Promise<Post> {
    const form = new FormData();
    form.append("title", payload.title);
    if (payload.content !== undefined) form.append("content", payload.content);
    if (payload.image)   form.append("image", payload.image);
    if (payload.link)    form.append("link", payload.link);

    const { data } = await api.put<{ success: boolean; post: Post }>(`/posts/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.post;
  },

  async deletePost(id: number): Promise<void> {
    await api.delete(`/posts/${id}`);
  },
};
