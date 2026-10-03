import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { emitNewPost } from "../socket.js";

export const createPost = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { title, content, community_id, link } = req.body as {
      title: string;
      content: string;
      community_id: number;
      link?: string;
    };
    const user_id = (req as AuthRequest).user.id;

    // Image path comes from multer (if uploaded)
    const imagePath = req.file
      ? `/uploads/${req.file.filename}`
      : undefined;

    if (!title || !community_id) {
      res.status(400).json({
        success: false,
        message: "Title and community are required.",
      });
      return;
    }

    // Must have at least one of: content, image, or link
    if (!content && !imagePath && !link) {
      res.status(400).json({
        success: false,
        message: "Post must have text content, an image, or a link.",
      });
      return;
    }

    await client.query("BEGIN");

    const community = await client.query(
      "SELECT id FROM communities WHERE id = $1",
      [community_id]
    );

    if (community.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Community not found." });
      return;
    }

    const inserted = await client.query(
      `INSERT INTO posts (title, content, image, link, user_id, community_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [title, content || null, imagePath || null, link || null, user_id, community_id]
    );

    await client.query(
      "UPDATE communities SET post_count = post_count + 1 WHERE id = $1",
      [community_id]
    );

    const result = await client.query(
      `SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.created_at,
              u.id AS user_id, u.username,
              c.id AS community_id, c.name AS community_name, c.slug AS community_slug,
              0 AS comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN communities c ON p.community_id = c.id
       WHERE p.id = $1`,
      [inserted.rows[0].id]
    );

    await client.query("COMMIT");

    // Broadcast new post to feed and community rooms
    emitNewPost(result.rows[0] as Record<string, unknown>);

    res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    client.release();
  }
};

export const getPosts = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.created_at,
             u.id AS user_id, u.username,
             c.id AS community_id, c.name AS community_name, c.slug AS community_slug,
             (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN communities c ON p.community_id = c.id
      ORDER BY p.created_at DESC
    `);
    res.status(200).json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score,
              p.created_at, p.updated_at, u.id AS user_id, u.username,
              c.id AS community_id, c.name AS community_name, c.slug AS community_slug,
              (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN communities c ON p.community_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Post not found." });
      return;
    }

    res.status(200).json({ success: true, post: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content, link } = req.body as {
      title: string;
      content: string;
      link?: string;
    };

    const result = await pool.query("SELECT * FROM posts WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Post not found." });
      return;
    }

    const post = result.rows[0];

    if (Number(post.user_id) !== Number((req as AuthRequest).user.id)) {
      res.status(403).json({
        success: false,
        message: "You are not allowed to update this post.",
      });
      return;
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : post.image;
    const updated = await pool.query(
      `UPDATE posts
       SET title = $1, content = $2, image = $3, link = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 RETURNING *`,
      [title ?? post.title, content ?? post.content, imagePath, link ?? post.link, id]
    );

    res.status(200).json({
      success: true,
      message: "Post updated successfully.",
      post: updated.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const deletePost = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const result = await client.query("SELECT * FROM posts WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Post not found." });
      return;
    }

    const post = result.rows[0];

    if (Number(post.user_id) !== Number((req as AuthRequest).user.id)) {
      await client.query("ROLLBACK");
      res.status(403).json({
        success: false,
        message: "You are not allowed to delete this post.",
      });
      return;
    }

    await client.query("DELETE FROM posts WHERE id = $1", [id]);
    await client.query(
      "UPDATE communities SET post_count = post_count - 1 WHERE id = $1",
      [post.community_id]
    );

    await client.query("COMMIT");

    res.status(200).json({ success: true, message: "Post deleted successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    client.release();
  }
};

export const getFeed = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.created_at,
             u.id AS user_id, u.username,
             c.id AS community_id, c.name AS community_name, c.slug AS community_slug,
             COUNT(DISTINCT cm.id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN communities c ON p.community_id = c.id
      LEFT JOIN comments cm ON cm.post_id = p.id
      GROUP BY p.id, u.id, c.id
      ORDER BY p.created_at DESC
      LIMIT 20
    `);
    res.status(200).json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getPopular = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.created_at,
             u.id AS user_id, u.username,
             c.id AS community_id, c.name AS community_name, c.slug AS community_slug,
             COUNT(DISTINCT cm.id) AS comment_count,
             -- popularity score: votes weighted 1x + comments weighted 2x
             (p.vote_score + COUNT(DISTINCT cm.id) * 2) AS popularity_score
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN communities c ON p.community_id = c.id
      LEFT JOIN comments cm ON cm.post_id = p.id
      GROUP BY p.id, u.id, c.id
      ORDER BY popularity_score DESC, p.created_at DESC
      LIMIT 50
    `);
    res.status(200).json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
