import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { notify } from "../utils/notify.js";
import { isDatabaseUnavailable } from "../utils/dbErrors.js";

const routeParam = (req: Request, name: string): string => {
  const value = req.params[name];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
};

export const getFollowing = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.id;
    const [users, communities, tags] = await Promise.all([
      pool.query(`SELECT u.id, u.username, u.profile_image, f.created_at FROM user_follows f JOIN users u ON u.id = f.followed_id WHERE f.follower_id = $1 ORDER BY f.created_at DESC`, [userId]),
      pool.query(`SELECT c.id, c.name, c.slug, c.logo, f.created_at FROM community_follows f JOIN communities c ON c.id = f.community_id WHERE f.user_id = $1 ORDER BY f.created_at DESC`, [userId]),
      pool.query("SELECT tag, created_at FROM tag_follows WHERE user_id = $1 ORDER BY created_at DESC", [userId]),
    ]);
    res.json({ success: true, users: users.rows, communities: communities.rows, tags: tags.rows });
  } catch (error) {
    console.error(error);
    const unavailable = isDatabaseUnavailable(error);
    res.status(unavailable ? 503 : 500).json({ success: false, message: unavailable ? "The database connection timed out. Check the server's database network access and retry." : "Could not load following list." });
  }
};

export const getTagFollowState = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await pool.query("SELECT 1 FROM tag_follows WHERE user_id = $1 AND tag = $2", [(req as AuthRequest).user.id, routeParam(req, "tag").toLowerCase()]);
    res.json({ success: true, isFollowing: result.rows.length > 0 });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: "Could not load tag follow state." }); }
};

export const followTag = async (req: Request, res: Response): Promise<void> => {
  const tag = routeParam(req, "tag").trim().replace(/^#/, "").toLowerCase();
  if (!/^[a-z0-9_-]{1,80}$/.test(tag)) { res.status(400).json({ success: false, message: "Invalid tag." }); return; }
  try { await pool.query("INSERT INTO tag_follows (user_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING", [(req as AuthRequest).user.id, tag]); res.json({ success: true, isFollowing: true }); }
  catch (error) { console.error(error); res.status(500).json({ success: false, message: "Could not follow tag." }); }
};

export const unfollowTag = async (req: Request, res: Response): Promise<void> => {
  const tag = routeParam(req, "tag").trim().replace(/^#/, "").toLowerCase();
  try { await pool.query("DELETE FROM tag_follows WHERE user_id = $1 AND tag = $2", [(req as AuthRequest).user.id, tag]); res.json({ success: true, isFollowing: false }); }
  catch (error) { console.error(error); res.status(500).json({ success: false, message: "Could not unfollow tag." }); }
};

export const getFollowState = async (req: Request, res: Response): Promise<void> => {
  const targetId = Number(routeParam(req, "id"));
  const userId = (req as AuthRequest).user.id;
  if (!Number.isSafeInteger(targetId) || targetId < 1) { res.status(400).json({ success: false, message: "Invalid id." }); return; }
  try {
    const isUser = routeParam(req, "type") === "users";
    const result = isUser
      ? await pool.query(
          `SELECT EXISTS(SELECT 1 FROM user_follows WHERE follower_id = $1 AND followed_id = $2) AS is_following,
                  EXISTS(SELECT 1 FROM user_follows WHERE follower_id = $2 AND followed_id = $1) AS follows_you`,
          [userId, targetId]
        )
      : await pool.query("SELECT EXISTS(SELECT 1 FROM community_follows WHERE user_id = $1 AND community_id = $2) AS is_following, FALSE AS follows_you", [userId, targetId]);
    res.json({ success: true, isFollowing: result.rows[0].is_following, followsYou: result.rows[0].follows_you });
  } catch (error) {
    console.error(error);
    const unavailable = isDatabaseUnavailable(error);
    res.status(unavailable ? 503 : 500).json({ success: false, message: unavailable ? "The database connection timed out. Check the server's database network access and retry." : "Could not load follow state." });
  }
};

export const follow = async (req: Request, res: Response): Promise<void> => {
  const targetId = Number(routeParam(req, "id"));
  const userId = (req as AuthRequest).user.id;
  const type = routeParam(req, "type");
  if (!Number.isSafeInteger(targetId) || targetId < 1 || !["users", "communities"].includes(type)) { res.status(400).json({ success: false, message: "Invalid follow target." }); return; }
  if (type === "users" && targetId === userId) { res.status(400).json({ success: false, message: "You cannot follow yourself." }); return; }
  try {
    const table = type === "users" ? "user_follows" : "community_follows";
    const firstColumn = type === "users" ? "follower_id" : "user_id";
    const secondColumn = type === "users" ? "followed_id" : "community_id";
    const inserted = await pool.query(`INSERT INTO ${table} (${firstColumn}, ${secondColumn}) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING ${firstColumn}`, [userId, targetId]);
    if (type === "users" && inserted.rowCount) {
      const actor = (req as AuthRequest).user;
      await notify({ userId: targetId, actorId: userId, type: "follow", message: `${actor.username} followed you` });
    }
    res.json({ success: true, isFollowing: true });
  } catch (error) {
    console.error(error);
    const unavailable = isDatabaseUnavailable(error);
    res.status(unavailable ? 503 : 404).json({ success: false, message: unavailable ? "The database connection timed out. Check the server's database network access and retry." : "Follow target not found." });
  }
};

export const unfollow = async (req: Request, res: Response): Promise<void> => {
  const targetId = Number(routeParam(req, "id"));
  const type = routeParam(req, "type");
  if (!Number.isSafeInteger(targetId) || targetId < 1 || !["users", "communities"].includes(type)) { res.status(400).json({ success: false, message: "Invalid follow target." }); return; }
  const table = type === "users" ? "user_follows" : "community_follows";
  const firstColumn = type === "users" ? "follower_id" : "user_id";
  const secondColumn = type === "users" ? "followed_id" : "community_id";
  try {
    await pool.query(`DELETE FROM ${table} WHERE ${firstColumn} = $1 AND ${secondColumn} = $2`, [(req as AuthRequest).user.id, targetId]);
    res.json({ success: true, isFollowing: false });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Could not unfollow." });
  }
};
