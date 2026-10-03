import api from "../api/client";
import type { Comment } from "../types/index";

export const commentService = {
  async voteComment(id: number, vote: 1 | -1): Promise<{ vote_score: number; user_vote: 1 | -1 | 0 }> {
    const { data } = await api.post<{ success: boolean; vote_score: number; user_vote: 1 | -1 | 0 }>(
      `/comments/${id}/vote`,
      { vote }
    );
    return data;
  },

  async getCommentsByPost(postId: number): Promise<Comment[]> {
    const { data } = await api.get<{ success: boolean; comments: Comment[] }>(
      `/comments/post/${postId}`
    );
    return data.comments;
  },

  async createComment(payload: {
    content: string;
    post_id: number;
    parent_comment_id?: number;
  }): Promise<Comment> {
    const { data } = await api.post<{ success: boolean; comment: Comment }>(
      "/comments",
      payload
    );
    return data.comment;
  },

  async updateComment(id: number, content: string): Promise<Comment> {
    const { data } = await api.put<{ success: boolean; comment: Comment }>(
      `/comments/${id}`,
      { content }
    );
    return data.comment;
  },

  async deleteComment(id: number): Promise<void> {
    await api.delete(`/comments/${id}`);
  },
};
