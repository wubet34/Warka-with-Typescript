import api from "../api/client";

export const reportService = {
  async reportPost(postId: number, reason: string): Promise<void> { await api.post("/reports", { post_id: postId, reason }); },
  async reportComment(commentId: number, reason: string): Promise<void> { await api.post("/reports", { comment_id: commentId, reason }); },
};
