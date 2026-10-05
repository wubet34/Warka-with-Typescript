import { Request, Response } from "express";
import pool from "../config/db.js";
import { slugify } from "../utils/slugify.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const getCommunities = async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query(`
      SELECT id, name, slug, description, rules, tags, wiki, logo, banner,
             member_count, post_count, is_private, created_at
      FROM communities
      ORDER BY created_at DESC
    `);

    res.status(200).json({ success: true, communities: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const getCommunityBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT id, name, slug, description, rules, tags, wiki, logo, banner,
              member_count, post_count, is_private, owner_id, created_at, updated_at
       FROM communities WHERE slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "Community not found." });
      return;
    }

    res.status(200).json({ success: true, community: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const createCommunity = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, rules, tags: rawTags } = req.body as { name: string; description?: string; rules?: string; tags?: string[] };
    const ownerId = (req as AuthRequest).user.id;

    if (!name) {
      res.status(400).json({ success: false, message: "Community name is required." });
      return;
    }

    const slug = slugify(name);

    const exists = await pool.query(
      "SELECT id FROM communities WHERE slug = $1",
      [slug]
    );

    if (exists.rows.length > 0) {
      res.status(409).json({ success: false, message: "Community already exists." });
      return;
    }

    const result = await pool.query(
      `INSERT INTO communities (name, slug, description, rules, tags, owner_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
       [name, slug, description || null, rules?.trim() || null,
       [...new Set((rawTags ?? []).map(tag => tag.trim().replace(/^#/, "").toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "")).filter(Boolean))].slice(0, 12), ownerId]
    );

    const community = result.rows[0];

    await pool.query(
      "INSERT INTO community_members (user_id, community_id) VALUES ($1, $2)",
      [ownerId, community.id]
    );

    res.status(201).json({
      success: true,
      message: "Community created successfully.",
      community,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const joinCommunity = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const communityId = req.params.id;
    const userId = (req as AuthRequest).user.id;

    await client.query("BEGIN");

    const community = await client.query(
      "SELECT id FROM communities WHERE id = $1",
      [communityId]
    );

    if (community.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ success: false, message: "Community not found." });
      return;
    }

    const member = await client.query(
      "SELECT id FROM community_members WHERE user_id = $1 AND community_id = $2",
      [userId, communityId]
    );

    if (member.rows.length > 0) {
      await client.query("ROLLBACK");
      res.status(409).json({ success: false, message: "You are already a member." });
      return;
    }

    await client.query(
      "INSERT INTO community_members (user_id, community_id) VALUES ($1, $2)",
      [userId, communityId]
    );

    await client.query(
      "UPDATE communities SET member_count = member_count + 1 WHERE id = $1",
      [communityId]
    );

    await client.query("COMMIT");

    res.status(200).json({ success: true, message: "Joined community successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    client.release();
  }
};

export const leaveCommunity = async (req: Request, res: Response): Promise<void> => {
  const client = await pool.connect();
  try {
    const communityId = req.params.id;
    const userId = (req as AuthRequest).user.id;

    await client.query("BEGIN");

    const member = await client.query(
      "SELECT id FROM community_members WHERE user_id = $1 AND community_id = $2",
      [userId, communityId]
    );

    if (member.rows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({
        success: false,
        message: "You are not a member of this community.",
      });
      return;
    }

    await client.query(
      "DELETE FROM community_members WHERE user_id = $1 AND community_id = $2",
      [userId, communityId]
    );

    await client.query(
      "UPDATE communities SET member_count = member_count - 1 WHERE id = $1",
      [communityId]
    );

    await client.query("COMMIT");

    res.status(200).json({ success: true, message: "Left community successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  } finally {
    client.release();
  }
};

export const checkMembership = async (req: Request, res: Response): Promise<void> => {
  try {
    const communityId = req.params.id;
    const userId = (req as AuthRequest).user.id;

    const result = await pool.query(
      "SELECT id FROM community_members WHERE user_id = $1 AND community_id = $2",
      [userId, communityId]
    );

    res.status(200).json({ success: true, isMember: result.rows.length > 0 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const checkModerationAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.id;
    const result = await pool.query(
      `SELECT (c.owner_id = $2 OR EXISTS(SELECT 1 FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = $2 AND cm.role = 'moderator')) AS can_moderate
       FROM communities c WHERE c.id = $1`, [req.params.id, userId]
    );
    if (!result.rows.length) { res.status(404).json({ success: false, message: "Community not found." }); return; }
    res.json({ success: true, canModerate: result.rows[0].can_moderate });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: "Could not check moderation access." }); }
};

export const setCommunityModerator = async (req: Request, res: Response): Promise<void> => {
  const communityId = Number(req.params.id);
  const userId = Number((req.body as { user_id?: number }).user_id);
  const actorId = (req as AuthRequest).user.id;
  if (!Number.isSafeInteger(communityId) || !Number.isSafeInteger(userId) || userId < 1) { res.status(400).json({ success: false, message: "Valid community and user are required." }); return; }
  try {
    const owner = await pool.query("SELECT owner_id FROM communities WHERE id = $1", [communityId]);
    if (!owner.rows.length) { res.status(404).json({ success: false, message: "Community not found." }); return; }
    if (Number(owner.rows[0].owner_id) !== Number(actorId)) { res.status(403).json({ success: false, message: "Only the community owner can assign moderators." }); return; }
    const role = req.method === "DELETE" ? "member" : "moderator";
    const result = await pool.query("UPDATE community_members SET role = $1 WHERE community_id = $2 AND user_id = $3 RETURNING user_id", [role, communityId, userId]);
    if (!result.rows.length) { res.status(400).json({ success: false, message: "The user must join the community before becoming a moderator." }); return; }
    res.json({ success: true, role });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: "Could not assign moderator." }); }
};

export const moderatePost = async (req: Request, res: Response): Promise<void> => {
  const communityId = Number(req.params.id);
  const postId = Number(req.params.postId);
  const action = (req.body as { action?: string }).action;
  const userId = (req as AuthRequest).user.id;
  if (!["lock", "unlock", "pin", "unpin", "remove"].includes(action ?? "")) { res.status(400).json({ success: false, message: "Invalid moderation action." }); return; }
  try {
    const access = await pool.query(
      `SELECT c.owner_id, p.community_id FROM communities c JOIN posts p ON p.id = $2 AND p.community_id = c.id
       WHERE c.id = $1 AND (c.owner_id = $3 OR EXISTS(SELECT 1 FROM community_members cm WHERE cm.community_id = c.id AND cm.user_id = $3 AND cm.role = 'moderator'))`,
      [communityId, postId, userId]
    );
    if (!access.rows.length) { res.status(403).json({ success: false, message: "You cannot moderate this post." }); return; }
    if (action === "remove") {
      await pool.query("DELETE FROM posts WHERE id = $1", [postId]);
      await pool.query("UPDATE communities SET post_count = GREATEST(0, post_count - 1) WHERE id = $1", [communityId]);
    } else {
      const field = action === "lock" || action === "unlock" ? "is_locked" : "is_pinned";
      const value = action === "lock" || action === "pin";
      await pool.query(`UPDATE posts SET ${field} = $1 WHERE id = $2`, [value, postId]);
    }
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: "Could not moderate post." }); }
};

export const getCommunityPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT p.id, p.title, p.content, p.image, p.link, p.vote_score, p.post_type, p.tags, p.views, p.is_locked, p.is_pinned, p.created_at,
              u.id AS user_id, u.username,
              c.id AS community_id, c.name AS community_name, c.slug AS community_slug,
              COUNT(DISTINCT cm.id) AS comment_count
       FROM posts p
       JOIN users u ON p.user_id = u.id
       JOIN communities c ON p.community_id = c.id
       LEFT JOIN comments cm ON cm.post_id = p.id
       WHERE c.id = $1
       GROUP BY p.id, u.id, c.id
       ORDER BY p.is_pinned DESC, p.created_at DESC`,
      [id]
    );

    res.status(200).json({ success: true, posts: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
