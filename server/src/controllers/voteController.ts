import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { emitVoteUpdate } from "../socket.js";
import { notify } from "../utils/notify.js";

export const votePost = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { post_id, vote } = req.body as { post_id: number; vote: 1 | -1 };
    const user_id = (req as AuthRequest).user.id;

    if (!post_id || ![1, -1].includes(vote)) {
      res.status(400).json({ success: false, message: "Valid post_id and vote are required." });
      return;
    }

    await client.query("BEGIN");

    const post = await client.query("SELECT id, vote_score FROM posts WHERE id = $1", [post_id]);
    if (post.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Post not found." });
      return;
    }

    const existingVote = await client.query(
      "SELECT * FROM votes WHERE user_id = $1 AND post_id = $2",
      [user_id, post_id]
    );

    let newScore: number;

    if (existingVote.rows.length === 0) {
      // First vote
      await client.query("INSERT INTO votes (user_id, post_id, vote) VALUES ($1, $2, $3)", [user_id, post_id, vote]);
      const updated = await client.query(
        "UPDATE posts SET vote_score = vote_score + $1 WHERE id = $2 RETURNING vote_score, user_id",
        [vote, post_id]
      );
      newScore = updated.rows[0].vote_score;
      await client.query("COMMIT");
      emitVoteUpdate(post_id, newScore);

      // Notify post owner on upvote only
      if (vote === 1) {
        const actorUsername = (req as AuthRequest).user.username;
        await notify({
          userId: Number(updated.rows[0].user_id),
          actorId: Number(user_id),
          type: "vote",
          message: `${actorUsername} upvoted your post`,
          postId: post_id,
        });
      }

      res.status(201).json({ success: true, message: "Vote added.", vote_score: newScore });
      return;
    }

    const currentVote = existingVote.rows[0];

    if (currentVote.vote === vote) {
      // Remove vote
      await client.query("DELETE FROM votes WHERE id = $1", [currentVote.id]);
      const updated = await client.query(
        "UPDATE posts SET vote_score = vote_score - $1 WHERE id = $2 RETURNING vote_score",
        [vote, post_id]
      );
      newScore = updated.rows[0].vote_score;
      await client.query("COMMIT");
      emitVoteUpdate(post_id, newScore);
      res.status(200).json({ success: true, message: "Vote removed.", vote_score: newScore });
      return;
    }

    // Change vote
    await client.query("UPDATE votes SET vote = $1 WHERE id = $2", [vote, currentVote.id]);
    const scoreChange = vote - currentVote.vote;
    const updated = await client.query(
      "UPDATE posts SET vote_score = vote_score + $1 WHERE id = $2 RETURNING vote_score",
      [scoreChange, post_id]
    );
    newScore = updated.rows[0].vote_score;
    await client.query("COMMIT");
    emitVoteUpdate(post_id, newScore);
    res.status(200).json({ success: true, message: "Vote updated.", vote_score: newScore });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    client.release();
  }
};
