import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const getAdminStats = async (req: Request, res: Response): Promise<void> => {
  // Keep the known owner account available when a host has not synced ADMIN_EMAIL yet.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "wubet453@gmail.com";

  if ((req as AuthRequest).user.email?.trim().toLowerCase() !== adminEmail) {
    res.status(403).json({ success: false, message: "Admin access required." });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT COUNT(*)::INTEGER AS total_users,
              COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::INTEGER AS new_users_30_days,
              (SELECT COUNT(*)::INTEGER FROM communities) AS total_communities,
              (SELECT COUNT(*)::INTEGER FROM posts) AS total_posts,
              (SELECT COUNT(*)::INTEGER FROM content_reports WHERE status = 'pending') AS pending_reports
       FROM users`
    );
    res.status(200).json({ success: true, stats: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Unable to load admin statistics." });
  }
};
