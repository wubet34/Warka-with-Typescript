import { Request, Response } from "express";
import pool from "../config/db.js";

// Unified full-text search across posts, users, communities
export const searchAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q?: string };
    if (!q || !q.trim()) {
      res.json({ success: true, posts: [], users: [], communities: [] });
      return;
    }

    const term = q.trim();
    const [postsResult, usersResult, communitiesResult] = await Promise.all([
      pool.query(
        `SELECT
           p.id, p.title, p.content, p.image, p.link,
           p.vote_score, p.comment_count, p.created_at,
           u.id   AS user_id,   u.username,
           c.id   AS community_id, c.name AS community_name, c.slug AS community_slug,
           ts_rank(
             to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.content,'')),
             plainto_tsquery('english', $2)
           ) AS rank
         FROM posts p
         JOIN users       u ON p.user_id       = u.id
         JOIN communities c ON p.community_id  = c.id
         WHERE
           to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.content,''))
             @@ plainto_tsquery('english', $2)
           OR p.title   ILIKE $1
           OR p.content ILIKE $1
         ORDER BY rank DESC, p.created_at DESC
         LIMIT 20`,
        [`%${term}%`, term]
      ),
      pool.query(
        `SELECT id, username, bio, profile_image, cover_image
         FROM users
         WHERE username ILIKE $1 OR bio ILIKE $1
         LIMIT 10`,
        [`%${term}%`]
      ),
      pool.query(
        `SELECT id, name, slug, description, logo, member_count, post_count
         FROM communities
         WHERE name ILIKE $1 OR description ILIKE $1
         LIMIT 10`,
        [`%${term}%`]
      ),
    ]);

    res.json({
      success: true,
      posts:       postsResult.rows,
      users:       usersResult.rows,
      communities: communitiesResult.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const searchPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q?: string };
    if (!q?.trim()) { res.json({ success: true, posts: [] }); return; }
    const term = q.trim();
    const result = await pool.query(
      `SELECT p.*, u.username,
              c.name AS community_name, c.slug AS community_slug
       FROM posts p
       JOIN users       u ON p.user_id      = u.id
       JOIN communities c ON p.community_id = c.id
       WHERE
         to_tsvector('english', coalesce(p.title,'') || ' ' || coalesce(p.content,''))
           @@ plainto_tsquery('english', $2)
         OR p.title   ILIKE $1
         OR p.content ILIKE $1
       ORDER BY p.created_at DESC LIMIT 20`,
      [`%${term}%`, term]
    );
    res.json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const searchUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q?: string };
    if (!q?.trim()) { res.json({ success: true, users: [] }); return; }
    const result = await pool.query(
      `SELECT id, username, bio, profile_image FROM users WHERE username ILIKE $1 LIMIT 10`,
      [`%${q.trim()}%`]
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const searchCommunities = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q } = req.query as { q?: string };
    if (!q?.trim()) { res.json({ success: true, communities: [] }); return; }
    const result = await pool.query(
      `SELECT id, name, slug, description, member_count FROM communities WHERE name ILIKE $1 LIMIT 10`,
      [`%${q.trim()}%`]
    );
    res.json({ success: true, communities: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
