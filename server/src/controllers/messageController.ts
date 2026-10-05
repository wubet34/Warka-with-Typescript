import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { notify } from "../utils/notify.js";
import { storeImage } from "../utils/media.js";
import { emitDirectMessage } from "../socket.js";
import { isDatabaseUnavailable } from "../utils/dbErrors.js";

const ids = (req: Request) => ({ me: (req as AuthRequest).user.id, other: Number(req.params.userId) });

export const getConversations = async (req: Request, res: Response): Promise<void> => {
  const me = (req as AuthRequest).user.id;
  try {
    const result = await pool.query(
      `WITH partners AS (
         SELECT sender_id AS partner_id FROM direct_messages WHERE recipient_id = $1
         UNION SELECT recipient_id FROM direct_messages WHERE sender_id = $1
       )
       SELECT u.id AS user_id, u.username, u.profile_image,
              last.body AS last_message, last.created_at AS last_message_at,
              (SELECT COUNT(*)::INTEGER FROM direct_messages unread WHERE unread.sender_id = u.id AND unread.recipient_id = $1 AND unread.read_at IS NULL) AS unread_count
       FROM partners p JOIN users u ON u.id = p.partner_id
       JOIN LATERAL (
         SELECT COALESCE(NULLIF(body, ''), CASE WHEN image IS NOT NULL THEN 'Image' ELSE '' END) AS body, created_at FROM direct_messages m
         WHERE (m.sender_id = $1 AND m.recipient_id = u.id) OR (m.sender_id = u.id AND m.recipient_id = $1)
         ORDER BY m.created_at DESC LIMIT 1
       ) last ON true
       WHERE NOT EXISTS (SELECT 1 FROM hidden_conversations h WHERE h.user_id = $1 AND h.other_user_id = u.id AND h.hidden_at >= last.created_at)
       ORDER BY last.created_at DESC`, [me]
    );
    res.json({ success: true, conversations: result.rows });
  } catch (error) { console.error(error); const unavailable = isDatabaseUnavailable(error); res.status(unavailable ? 503 : 500).json({ success: false, message: unavailable ? "The database connection timed out. Check the server's database network access and retry." : "Could not load conversations." }); }
};

export const getThread = async (req: Request, res: Response): Promise<void> => {
  const { me, other } = ids(req);
  if (!Number.isSafeInteger(other) || other < 1 || other === me) { res.status(400).json({ success: false, message: "Invalid conversation." }); return; }
  try {
    await pool.query("UPDATE direct_messages SET read_at = NOW() WHERE sender_id = $1 AND recipient_id = $2 AND read_at IS NULL", [other, me]);
    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.recipient_id, m.body, m.image, m.created_at, m.read_at, u.username AS sender_username
       FROM direct_messages m JOIN users u ON u.id = m.sender_id
       WHERE (m.sender_id = $1 AND m.recipient_id = $2) OR (m.sender_id = $2 AND m.recipient_id = $1)
       ORDER BY m.created_at ASC LIMIT 500`, [me, other]
    );
    const blocked = await pool.query("SELECT 1 FROM blocked_users WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)", [me, other]);
    res.json({ success: true, messages: result.rows, blocked: blocked.rows.length > 0 });
  } catch (error) { console.error(error); const unavailable = isDatabaseUnavailable(error); res.status(unavailable ? 503 : 500).json({ success: false, message: unavailable ? "The database connection timed out. Check the server's database network access and retry." : "Could not load messages." }); }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const { me, other } = ids(req);
  const body = (req.body as { body?: string }).body?.trim() ?? "";
  const file = (req as Request & { file?: Express.Multer.File }).file;
  if (!Number.isSafeInteger(other) || other < 1 || other === me || (!body && !file) || body.length > 4000) { res.status(400).json({ success: false, message: "Enter a message or attach an image. Text can be up to 4,000 characters." }); return; }
  try {
    const blocked = await pool.query("SELECT 1 FROM blocked_users WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)", [me, other]);
    if (blocked.rows.length) { res.status(403).json({ success: false, message: "Messaging is unavailable for this conversation." }); return; }
    const image = file ? await storeImage(file) : null;
    const result = await pool.query(
      `INSERT INTO direct_messages (sender_id, recipient_id, body, image) VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, recipient_id, body, image, created_at, read_at`, [me, other, body, image]
    );
    const message = { ...result.rows[0], sender_username: (req as AuthRequest).user.username };
    await pool.query("DELETE FROM hidden_conversations WHERE (user_id = $1 AND other_user_id = $2) OR (user_id = $2 AND other_user_id = $1)", [me, other]);
    await notify({ userId: other, actorId: me, type: "message", message: `${(req as AuthRequest).user.username} sent you a message` });
    emitDirectMessage([me, other], message);
    res.status(201).json({ success: true, message });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: "Could not send message." }); }
};

export const hideConversation = async (req: Request, res: Response): Promise<void> => {
  const { me, other } = ids(req);
  if (!Number.isSafeInteger(other) || other < 1 || other === me) { res.status(400).json({ success: false, message: "Invalid conversation." }); return; }
  try {
    await pool.query(`INSERT INTO hidden_conversations (user_id, other_user_id) VALUES ($1, $2) ON CONFLICT (user_id, other_user_id) DO UPDATE SET hidden_at = NOW()`, [me, other]);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: "Could not delete conversation." }); }
};

export const blockUser = async (req: Request, res: Response): Promise<void> => {
  const { me, other } = ids(req);
  if (!Number.isSafeInteger(other) || other < 1 || other === me) { res.status(400).json({ success: false, message: "Invalid user." }); return; }
  try {
    await pool.query("INSERT INTO blocked_users (blocker_id, blocked_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [me, other]);
    await pool.query("DELETE FROM user_follows WHERE (follower_id = $1 AND followed_id = $2) OR (follower_id = $2 AND followed_id = $1)", [me, other]);
    res.json({ success: true });
  } catch (error) { console.error(error); res.status(404).json({ success: false, message: "User not found." }); }
};

export const unblockUser = async (req: Request, res: Response): Promise<void> => {
  const { me, other } = ids(req);
  try { await pool.query("DELETE FROM blocked_users WHERE blocker_id = $1 AND blocked_id = $2", [me, other]); res.json({ success: true }); }
  catch (error) { console.error(error); res.status(500).json({ success: false, message: "Could not unblock user." }); }
};
