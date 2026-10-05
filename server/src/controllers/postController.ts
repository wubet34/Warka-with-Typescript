import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { emitNewPost } from "../socket.js";
import { notify } from "../utils/notify.js";
import { storeImage } from "../utils/media.js";

export const createPost = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const { title, content, community_id, link, post_type, tags: rawTags, poll_options: rawPollOptions } = req.body as {
      title: string;
      content: string;
      community_id: number;
      link?: string;
      post_type?: string;
      tags?: string;
      poll_options?: string;
    };
    const user_id = (req as AuthRequest).user.id;

    if (!title || !community_id) {
      res.status(400).json({
        success: false,
        message: "Title and community are required.",
      });
      return;
    }

    const allowedTypes = ["question", "discussion", "news", "tutorial", "resource", "poll", "announcement"];
    const normalizedType = post_type || "discussion";
    let tags: string[] = [];
    let pollOptions: string[] = [];
    try {
      tags = rawTags ? JSON.parse(rawTags) as string[] : [];
      pollOptions = rawPollOptions ? JSON.parse(rawPollOptions) as string[] : [];
    } catch {
      res.status(400).json({ success: false, message: "Invalid tags or poll options." });
      return;
    }
    tags = [...new Set(tags.map(tag => tag.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "")).filter(Boolean))].slice(0, 8);
    pollOptions = [...new Set(pollOptions.map(option => option.trim()).filter(Boolean))].slice(0, 6);
    if (!allowedTypes.includes(normalizedType)) {
      res.status(400).json({ success: false, message: "Invalid post type." });
      return;
    }
    if (normalizedType === "poll" && pollOptions.length < 2) {
      res.status(400).json({ success: false, message: "Polls need at least two different options." });
      return;
    }
    // Must have at least one of: content, image, link, or poll choices.
    if (normalizedType !== "poll" && !content && !req.file && !link) {
      res.status(400).json({
        success: false,
        message: "Post must have text content, an image, or a link.",
      });
      return;
    }

    await client.query("BEGIN");

    let imagePath: string | null = null;
    if (req.file) {
      const storedImage = await client.query(
        `INSERT INTO media_assets (content_type, data)
         VALUES ($1, $2) RETURNING id`,
        [req.file.mimetype, req.file.buffer]
      );
      imagePath = `/media/${storedImage.rows[0].id}`;
    }

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
      `INSERT INTO posts (title, content, image, link, user_id, community_id, post_type, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, content || null, imagePath, link || null, user_id, community_id, normalizedType, tags]
    );

    if (normalizedType === "poll") {
      await Promise.all(pollOptions.map((option, position) => client.query(
        "INSERT INTO poll_options (post_id, option_text, position) VALUES ($1, $2, $3)",
        [inserted.rows[0].id, option, position]
      )));
    }

    await client.query(
      "UPDATE communities SET post_count = post_count + 1 WHERE id = $1",
      [community_id]
    );

    const result = await client.query(
      `SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.post_type, p.tags, p.views, p.is_locked, p.is_pinned, p.created_at,
              COALESCE((SELECT json_agg(json_build_object('id', po.id, 'text', po.option_text, 'votes', (SELECT COUNT(*) FROM poll_votes pv WHERE pv.option_id = po.id)) ORDER BY po.position) FROM poll_options po WHERE po.post_id = p.id), '[]'::json) AS poll_options,
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

    // Notify members and users who follow the community.
    try {
      const members = await pool.query(
        `SELECT user_id FROM community_members WHERE community_id = $1
         UNION
         SELECT user_id FROM community_follows WHERE community_id = $1
         EXCEPT SELECT $2::BIGINT`,
        [community_id, user_id]
      );
      const actorUsername = (req as AuthRequest).user.username;
      await Promise.all(members.rows.map(member => notify({
        userId: Number(member.user_id),
        actorId: Number(user_id),
        type: "new_post",
        message: `${actorUsername} posted in w/${result.rows[0].community_name}`,
        postId: Number(result.rows[0].id),
      })));
    } catch (notificationError) {
      console.error("Failed to notify community members about a new post:", notificationError);
    }

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
      SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.post_type, p.tags, p.views, p.is_locked, p.is_pinned, p.created_at,
             COALESCE((SELECT v.vote FROM votes v WHERE v.post_id = p.id AND v.user_id = $1), 0)::SMALLINT AS user_vote,
             EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = $1) AS user_bookmarked,
             u.id AS user_id, u.username,
             c.id AS community_id, c.name AS community_name, c.slug AS community_slug,
             (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN communities c ON p.community_id = c.id
      ORDER BY p.is_pinned DESC, p.created_at DESC
    `, [(_req as AuthRequest).user?.id ?? null]);
    res.status(200).json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getPostById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE posts SET views = views + 1 WHERE id = $1", [id]);

    const result = await pool.query(
      `SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.post_type, p.tags, p.views, p.is_locked, p.is_pinned,
              COALESCE((SELECT v.vote FROM votes v WHERE v.post_id = p.id AND v.user_id = $2), 0)::SMALLINT AS user_vote,
              EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = $2) AS user_bookmarked,
              p.created_at, p.updated_at, u.id AS user_id, u.username,
              c.id AS community_id, c.name AS community_name, c.slug AS community_slug,
              (SELECT COUNT(*) FROM comments cm WHERE cm.post_id = p.id) AS comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN communities c ON p.community_id = c.id
       WHERE p.id = $1`,
      [id, (req as AuthRequest).user?.id ?? null]
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

export const getPostPoll = async (req: Request, res: Response): Promise<void> => {
  try {
    const postId = Number(req.params.id);
    const userId = (req as AuthRequest).user?.id ?? null;
    const result = await pool.query(
      `SELECT po.id, po.option_text AS text,
              COUNT(pv.user_id)::INTEGER AS votes,
              BOOL_OR(pv.user_id = $2) AS selected
       FROM poll_options po LEFT JOIN poll_votes pv ON pv.option_id = po.id
       WHERE po.post_id = $1 GROUP BY po.id ORDER BY po.position`, [postId, userId]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: "Poll not found." }); return; }
    res.json({ success: true, options: result.rows, total_votes: result.rows.reduce((sum, option) => sum + Number(option.votes), 0) });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: "Could not load poll." }); }
};

export const votePoll = async (req: Request, res: Response): Promise<void> => {
  const postId = Number(req.params.id);
  const optionId = Number((req.body as { option_id?: number }).option_id);
  if (!Number.isSafeInteger(postId) || !Number.isSafeInteger(optionId)) { res.status(400).json({ success: false, message: "Invalid poll option." }); return; }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT id FROM posts WHERE id = $1 FOR UPDATE", [postId]);
    const option = await client.query("SELECT id FROM poll_options WHERE id = $1 AND post_id = $2", [optionId, postId]);
    if (!option.rows.length) { await client.query("ROLLBACK"); res.status(404).json({ success: false, message: "Poll option not found." }); return; }
    await client.query(
      `INSERT INTO poll_votes (user_id, post_id, option_id) VALUES ($1, $2, $3)
       ON CONFLICT (user_id, post_id) DO UPDATE SET option_id = EXCLUDED.option_id, created_at = NOW()`,
      [(req as AuthRequest).user.id, postId, optionId]
    );
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (error) { await client.query("ROLLBACK"); console.error(error); res.status(500).json({ success: false, message: "Could not save poll vote." }); }
  finally { client.release(); }
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

    const imagePath = req.file ? await storeImage(req.file) : post.image;
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
      SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.post_type, p.tags, p.views, p.is_locked, p.is_pinned, p.created_at,
             COALESCE((SELECT v.vote FROM votes v WHERE v.post_id = p.id AND v.user_id = $1), 0)::SMALLINT AS user_vote,
             EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = $1) AS user_bookmarked,
             u.id AS user_id, u.username,
             c.id AS community_id, c.name AS community_name, c.slug AS community_slug,
             COUNT(DISTINCT cm.id) AS comment_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      JOIN communities c ON p.community_id = c.id
      LEFT JOIN comments cm ON cm.post_id = p.id
      GROUP BY p.id, u.id, c.id
      ORDER BY p.is_pinned DESC, p.created_at DESC
      LIMIT 20
    `, [(_req as AuthRequest).user?.id ?? null]);
    res.status(200).json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getPopular = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.post_type, p.tags, p.views, p.is_locked, p.is_pinned, p.created_at,
             COALESCE((SELECT v.vote FROM votes v WHERE v.post_id = p.id AND v.user_id = $1), 0)::SMALLINT AS user_vote,
             EXISTS(SELECT 1 FROM bookmarks b WHERE b.post_id = p.id AND b.user_id = $1) AS user_bookmarked,
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
      ORDER BY p.is_pinned DESC, popularity_score DESC, p.created_at DESC
      LIMIT 50
    `, [(_req as AuthRequest).user?.id ?? null]);
    res.status(200).json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
