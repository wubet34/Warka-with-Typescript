import { Request, Response } from "express";
import pool from "../config/db.js";

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.username, u.bio, u.profile_image, u.is_verified, u.created_at,
              COUNT(DISTINCT p.id) AS post_count,
              COUNT(DISTINCT c.id) AS comment_count
       FROM users u
       LEFT JOIN posts p ON u.id = p.user_id
       LEFT JOIN comments c ON u.id = c.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    res.status(200).json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getUserPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.id, p.title, p.content, p.image, p.vote_score, p.created_at,
              c.name AS community_name, c.slug AS community_slug,
              COUNT(com.id) AS comment_count
       FROM posts p
       JOIN communities c ON p.community_id = c.id
       LEFT JOIN comments com ON com.post_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id, c.name, c.slug
       ORDER BY p.created_at DESC`,
      [id]
    );

    res.status(200).json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
