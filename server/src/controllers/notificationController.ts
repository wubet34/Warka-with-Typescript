import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.id;

    const result = await pool.query(
      `SELECT n.id, n.type, n.message, n.is_read, n.created_at,
              n.post_id, n.comment_id,
              u.id AS actor_id, u.username AS actor_username, u.profile_image AS actor_avatar
       FROM notifications n
       LEFT JOIN users u ON n.actor_id = u.id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 30`,
      [userId]
    );

    const unreadCount = result.rows.filter(r => !r.is_read).length;

    res.status(200).json({ success: true, notifications: result.rows, unread_count: unreadCount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const markAllRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.id;
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE user_id = $1", [userId]);
    res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const markOneRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;
    await pool.query(
      "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
      [id, userId]
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { id } = req.params;
    await pool.query("DELETE FROM notifications WHERE id = $1 AND user_id = $2", [id, userId]);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
