import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { emitCommentVoteUpdate, emitNewComment } from "../socket.js";
import { notify } from "../utils/notify.js";

export const createComment = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { content, post_id, parent_comment_id } = req.body as {
      content: string;
      post_id: number;
      parent_comment_id?: number;
    };
    const user_id = (req as AuthRequest).user.id;

    if (!content || !post_id) {
      res.status(400).json({
        success: false,
        message: "Content and post_id are required.",
      });
      return;
    }

    await client.query("BEGIN");

    const post = await client.query("SELECT id, is_locked FROM posts WHERE id = $1", [post_id]);

    if (post.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Post not found." });
      return;
    }
    if (post.rows[0].is_locked) {
      await client.query("ROLLBACK");
      res.status(423).json({ success: false, message: "Comments are locked for this post." });
      return;
    }

    const inserted = await client.query(
      `INSERT INTO comments (content, user_id, post_id, parent_comment_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [content, user_id, post_id, parent_comment_id ?? null]
    );

    const result = await client.query(
      `SELECT c.id, c.content, c.post_id, c.parent_comment_id, c.created_at, c.updated_at,
              u.id AS user_id, u.username, u.profile_image
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.id = $1`,
      [inserted.rows[0].id]
    );

    await client.query(
      "UPDATE posts SET comment_count = comment_count + 1 WHERE id = $1",
      [post_id]
    );

    await client.query("COMMIT");

    // Broadcast new comment to anyone viewing this post
    emitNewComment(post_id, result.rows[0] as Record<string, unknown>);

    // Notify post owner
    const postOwner = await pool.query("SELECT user_id FROM posts WHERE id = $1", [post_id]);
    if (postOwner.rows.length > 0) {
      const actorUsername = (req as AuthRequest).user.username;
      if (parent_comment_id) {
        // Reply — notify parent comment owner
        const parentOwner = await pool.query("SELECT user_id FROM comments WHERE id = $1", [parent_comment_id]);
        if (parentOwner.rows.length > 0) {
          await notify({
            userId: Number(parentOwner.rows[0].user_id),
            actorId: Number(user_id),
            type: "reply",
            message: `${actorUsername} replied to your comment`,
            postId: post_id,
            commentId: result.rows[0].id,
          });
        }
      } else {
        await notify({
          userId: Number(postOwner.rows[0].user_id),
          actorId: Number(user_id),
          type: "comment",
          message: `${actorUsername} commented on your post`,
          postId: post_id,
          commentId: result.rows[0].id,
        });
      }
    }

    // Notify each mentioned user once, excluding the author.
    try {
      const mentioned = [...new Set(Array.from(content.matchAll(/@([a-zA-Z0-9_]{1,30})/g), match => match[1].toLowerCase()))]
        .filter(username => username !== (req as AuthRequest).user.username.toLowerCase());
      if (mentioned.length) {
        const mentionedUsers = await pool.query("SELECT id, username FROM users WHERE LOWER(username) = ANY($1::text[])", [mentioned]);
        const actorUsername = (req as AuthRequest).user.username;
        await Promise.all(mentionedUsers.rows.map(mentionedUser => notify({
          userId: Number(mentionedUser.id), actorId: Number(user_id), type: "mention",
          message: `${actorUsername} mentioned you in a comment`, postId: post_id, commentId: result.rows[0].id,
        })));
      }
    } catch (mentionError) { console.error("Failed to send mention notifications:", mentionError); }

    res.status(201).json({
      success: true,
      message: "Comment created successfully.",
      comment: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    client.release();
  }
};

export const getCommentsByPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `SELECT c.id, c.content, c.parent_comment_id, c.created_at, c.updated_at,
              u.id AS user_id, u.username, u.profile_image,
              COALESCE((SELECT SUM(cv.vote)::INTEGER FROM comment_votes cv WHERE cv.comment_id = c.id), 0) AS vote_score,
              COALESCE((SELECT cv.vote FROM comment_votes cv WHERE cv.comment_id = c.id AND cv.user_id = $2), 0)::SMALLINT AS user_vote
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId, (req as AuthRequest).user?.id ?? null]
    );

    res.status(200).json({ success: true, comments: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const voteComment = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  let transactionOpen = false;
  try {
    const commentId = Number(req.params.id);
    const { vote } = req.body as { vote: 1 | -1 };
    const userId = (req as AuthRequest).user.id;

    const user = await client.query("SELECT id FROM users WHERE id = $1", [userId]);
    if (user.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: "Your session is no longer valid. Please sign in again.",
      });
      return;
    }

    if (!Number.isInteger(commentId) || commentId < 1 || ![1, -1].includes(vote)) {
      res.status(400).json({ success: false, message: "A valid comment id and vote are required." });
      return;
    }

    await client.query("BEGIN");
    transactionOpen = true;
    const comment = await client.query(
      "SELECT id, post_id, user_id FROM comments WHERE id = $1 FOR UPDATE",
      [commentId]
    );
    if (comment.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionOpen = false;
      res.status(404).json({ success: false, message: "Comment not found." });
      return;
    }

    const existing = await client.query(
      "SELECT vote FROM comment_votes WHERE user_id = $1 AND comment_id = $2",
      [userId, commentId]
    );
    const currentVote = existing.rows[0]?.vote as number | undefined;
    if (currentVote === vote) {
      await client.query("DELETE FROM comment_votes WHERE user_id = $1 AND comment_id = $2", [userId, commentId]);
    } else if (currentVote === undefined) {
      await client.query("INSERT INTO comment_votes (user_id, comment_id, vote) VALUES ($1, $2, $3)", [userId, commentId, vote]);
    } else {
      await client.query("UPDATE comment_votes SET vote = $1 WHERE user_id = $2 AND comment_id = $3", [vote, userId, commentId]);
    }

    const scoreResult = await client.query(
      "SELECT COALESCE(SUM(vote), 0)::INTEGER AS vote_score FROM comment_votes WHERE comment_id = $1",
      [commentId]
    );
    const voteScore = Number(scoreResult.rows[0].vote_score);
    const userVote = currentVote === vote ? 0 : vote;
    await client.query("COMMIT");
    transactionOpen = false;
    try {
      emitCommentVoteUpdate(Number(comment.rows[0].post_id), commentId, voteScore);
    } catch (socketError) {
      console.error("Comment vote saved, but live update could not be sent:", socketError);
    }
    if (userVote === 1) {
      const actorUsername = (req as AuthRequest).user.username;
      await notify({
        userId: Number(comment.rows[0].user_id),
        actorId: Number(userId),
        type: "vote",
        message: `${actorUsername} upvoted your comment`,
        postId: Number(comment.rows[0].post_id),
        commentId,
      });
    }
    res.status(200).json({ success: true, vote_score: voteScore, user_vote: userVote });
  } catch (error) {
    if (transactionOpen) await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    client.release();
  }
};

export const updateComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body as { content: string };

    if (!content) {
      res.status(400).json({ success: false, message: "Content is required." });
      return;
    }

    const existing = await pool.query("SELECT * FROM comments WHERE id = $1", [id]);

    if (existing.rows.length === 0) {
      res.status(404).json({ success: false, message: "Comment not found." });
      return;
    }

    const comment = existing.rows[0];

    if (Number(comment.user_id) !== Number((req as AuthRequest).user.id)) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to update this comment.",
      });
      return;
    }

    const updated = await pool.query(
      `UPDATE comments SET content = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [content, id]
    );

    res.status(200).json({
      success: true,
      message: "Comment updated successfully.",
      comment: updated.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const result = await client.query("SELECT * FROM comments WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Comment not found." });
      return;
    }

    const comment = result.rows[0];

    if (Number(comment.user_id) !== Number((req as AuthRequest).user.id)) {
      await client.query("ROLLBACK");
      res.status(403).json({
        success: false,
        message: "You are not allowed to delete this comment.",
      });
      return;
    }

    await client.query("DELETE FROM comments WHERE id = $1", [id]);
    await client.query(
      "UPDATE posts SET comment_count = comment_count - 1 WHERE id = $1",
      [comment.post_id]
    );

    await client.query("COMMIT");

    res.status(200).json({ success: true, message: "Comment deleted successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    client.release();
  }
};
