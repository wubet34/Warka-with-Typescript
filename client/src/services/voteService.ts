import api from "../api/client";

export const voteService = {
  async vote(post_id: number, vote: 1 | -1): Promise<void> {
    await api.post("/votes", { post_id, vote });
  },
};
