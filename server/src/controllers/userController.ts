import { Request, Response } from "express";
import pool from "../config/db.js";

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT u.id, u.username, u.bio, u.profile_image, u.cover_image, u.is_verified, u.created_at,
              COUNT(DISTINCT p.id) AS post_count,
              COUNT(DISTINCT c.id) AS comment_count,
              (SELECT COUNT(*) FROM votes v JOIN posts vp ON vp.id = v.post_id WHERE vp.user_id = u.id) AS votes_received,
              (SELECT COALESCE(SUM(vp.vote_score), 0) FROM posts vp WHERE vp.user_id = u.id) AS karma,
              (SELECT COUNT(*) FROM community_members cm WHERE cm.user_id = u.id) AS joined_community_count,
              (SELECT COUNT(*) FROM communities cc WHERE cc.owner_id = u.id) AS created_community_count,
              COALESCE((
                SELECT json_agg(json_build_object('id', jc.id, 'name', jc.name, 'slug', jc.slug) ORDER BY jc.name)
                FROM community_members jcm JOIN communities jc ON jc.id = jcm.community_id
                WHERE jcm.user_id = u.id
              ), '[]'::json) AS joined_communities,
              COALESCE((
                SELECT json_agg(json_build_object('id', cc.id, 'name', cc.name, 'slug', cc.slug) ORDER BY cc.name)
                FROM communities cc WHERE cc.owner_id = u.id
              ), '[]'::json) AS created_communities
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
      `SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.created_at,
              u.id AS user_id, u.username,
              c.id AS community_id, c.name AS community_name, c.slug AS community_slug,
              COUNT(DISTINCT com.id) AS comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN communities c ON p.community_id = c.id
       LEFT JOIN comments com ON com.post_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id, u.id, c.id
       ORDER BY p.created_at DESC`,
      [id]
    );

    res.status(200).json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
