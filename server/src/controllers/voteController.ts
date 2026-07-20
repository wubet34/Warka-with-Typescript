import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const votePost = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { post_id, vote } = req.body as { post_id: number; vote: 1 | -1 };
    const user_id = (req as AuthRequest).user.id;

    if (!post_id || ![1, -1].includes(vote)) {
      res.status(400).json({
        success: false,
        message: "Valid post_id and vote are required.",
      });
      return;
    }

    await client.query("BEGIN");

    const post = await client.query("SELECT id FROM posts WHERE id = $1", [post_id]);

    if (post.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Post not found." });
      return;
    }

    const existingVote = await client.query(
      "SELECT * FROM votes WHERE user_id = $1 AND post_id = $2",
      [user_id, post_id]
    );

    // First time voting
    if (existingVote.rows.length === 0) {
      await client.query(
        "INSERT INTO votes (user_id, post_id, vote) VALUES ($1, $2, $3)",
        [user_id, post_id, vote]
      );
      await client.query(
        "UPDATE posts SET vote_score = vote_score + $1 WHERE id = $2",
        [vote, post_id]
      );
      await client.query("COMMIT");
      res.status(201).json({ success: true, message: "Vote added." });
      return;
    }

    const currentVote = existingVote.rows[0];

    // Same vote → remove
    if (currentVote.vote === vote) {
      await client.query("DELETE FROM votes WHERE id = $1", [currentVote.id]);
      await client.query(
        "UPDATE posts SET vote_score = vote_score - $1 WHERE id = $2",
        [vote, post_id]
      );
      await client.query("COMMIT");
      res.status(200).json({ success: true, message: "Vote removed." });
      return;
    }

    // Change vote
    await client.query("UPDATE votes SET vote = $1 WHERE id = $2", [vote, currentVote.id]);
    const scoreChange = vote - currentVote.vote;
    await client.query(
      "UPDATE posts SET vote_score = vote_score + $1 WHERE id = $2",
      [scoreChange, post_id]
    );

    await client.query("COMMIT");

    res.status(200).json({ success: true, message: "Vote updated." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    client.release();
  }
};
