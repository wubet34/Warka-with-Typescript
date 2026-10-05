import { Request, Response } from "express";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

const adminEmail = () => (process.env.ADMIN_EMAIL?.trim().toLowerCase() || "wubet453@gmail.com");
const isAdmin = (req: Request) => (req as AuthRequest).user.email?.trim().toLowerCase() === adminEmail();

export const createReport = async (req: Request, res: Response): Promise<void> => {
  const { post_id, comment_id, reason, details } = req.body as { post_id?: number; comment_id?: number; reason?: string; details?: string };
  if ((Boolean(post_id) === Boolean(comment_id)) || !reason?.trim()) {
    res.status(400).json({ success: false, message: "Choose one post or comment and provide a reason." });
    return;
  }
  try {
    const result = await pool.query(
      `INSERT INTO content_reports (reporter_id, post_id, comment_id, reason, details)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [(req as AuthRequest).user.id, post_id ?? null, comment_id ?? null, reason.trim().slice(0, 60), details?.trim().slice(0, 1000) || null]
    );
    res.status(201).json({ success: true, report_id: result.rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Could not submit report." });
  }
};

export const getReports = async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ success: false, message: "Admin access required." }); return; }
  try {
    const result = await pool.query(
      `SELECT r.id, r.reason, r.details, r.status, r.created_at,
              reporter.id AS reporter_id, reporter.username AS reporter_username,
              p.id AS post_id, p.title AS post_title, p.content AS post_content,
              c.id AS comment_id, c.content AS comment_content
       FROM content_reports r
       JOIN users reporter ON reporter.id = r.reporter_id
       LEFT JOIN posts p ON p.id = r.post_id
       LEFT JOIN comments c ON c.id = r.comment_id
       WHERE r.status = 'pending' ORDER BY r.created_at ASC LIMIT 100`
    );
    res.json({ success: true, reports: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Could not load reports." });
  }
};

export const reviewReport = async (req: Request, res: Response): Promise<void> => {
  if (!isAdmin(req)) { res.status(403).json({ success: false, message: "Admin access required." }); return; }
  const reportId = Number(req.params.id);
  const { action } = req.body as { action?: string };
  if (!Number.isSafeInteger(reportId) || reportId < 1 || !["resolve", "dismiss", "remove"].includes(action ?? "")) {
    res.status(400).json({ success: false, message: "Invalid report action." });
    return;
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const report = await client.query("SELECT id, post_id, comment_id FROM content_reports WHERE id = $1 AND status = 'pending' FOR UPDATE", [reportId]);
    if (!report.rows.length) { await client.query("ROLLBACK"); res.status(404).json({ success: false, message: "Pending report not found." }); return; }
    const row = report.rows[0];
    if (action === "remove") {
      if (row.post_id) await client.query("DELETE FROM posts WHERE id = $1", [row.post_id]);
      else await client.query("DELETE FROM comments WHERE id = $1", [row.comment_id]);
    } else {
      await client.query("UPDATE content_reports SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3", [action === "resolve" ? "resolved" : "dismissed", (req as AuthRequest).user.id, reportId]);
    }
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ success: false, message: "Could not review report." });
  } finally { client.release(); }
};
