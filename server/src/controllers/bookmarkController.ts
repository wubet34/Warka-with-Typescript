import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const getBookmarks = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.id;
    const result = await pool.query(
      `SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, 1::SMALLINT AS user_bookmarked,
              COALESCE(v.vote, 0)::SMALLINT AS user_vote, p.created_at,
              u.id AS user_id, u.username, c.id AS community_id,
              c.name AS community_name, c.slug AS community_slug,
              (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id)::INTEGER AS comment_count
       FROM bookmarks b JOIN posts p ON p.id = b.post_id
       JOIN users u ON u.id = p.user_id JOIN communities c ON c.id = p.community_id
       LEFT JOIN votes v ON v.post_id = p.id AND v.user_id = $1
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
      [userId]
    );
    res.json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Could not load bookmarks." });
  }
};

export const addBookmark = async (req: Request, res: Response): Promise<void> => {
  const postId = Number(req.params.postId);
  if (!Number.isSafeInteger(postId) || postId < 1) {
    res.status(400).json({ success: false, message: "Invalid post id." });
    return;
  }
  try {
    const result = await pool.query("INSERT INTO bookmarks (user_id, post_id) VALUES ($1, $2) ON CONFLICT (user_id, post_id) DO NOTHING", [(req as AuthRequest).user.id, postId]);
    if (result.rowCount === 0) {
      const post = await pool.query("SELECT id FROM posts WHERE id = $1", [postId]);
      if (!post.rows.length) {
        res.status(404).json({ success: false, message: "Post not found." });
        return;
      }
    }
    res.json({ success: true, bookmarked: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Could not bookmark post." });
  }
};

export const removeBookmark = async (req: Request, res: Response): Promise<void> => {
  const postId = Number(req.params.postId);
  if (!Number.isSafeInteger(postId) || postId < 1) {
    res.status(400).json({ success: false, message: "Invalid post id." });
    return;
  }
  try {
    await pool.query("DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2", [(req as AuthRequest).user.id, postId]);
    res.json({ success: true, bookmarked: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Could not remove bookmark." });
  }
};
