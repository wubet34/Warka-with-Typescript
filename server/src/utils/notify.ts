import pool from "../config/db.js";
import { getIO } from "../socket.js";

interface NotifyOptions {
  userId: number;       // recipient
  actorId?: number;     // who triggered it
  type: "comment" | "reply" | "vote" | "mention" | "new_post";
  message: string;
  postId?: number;
  commentId?: number;
}

export const notify = async (opts: NotifyOptions): Promise<void> => {
  // Don't notify yourself
  if (opts.actorId && opts.actorId === opts.userId) return;

  try {
    const result = await pool.query(
      `INSERT INTO notifications (user_id, actor_id, type, message, post_id, comment_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [opts.userId, opts.actorId ?? null, opts.type, opts.message, opts.postId ?? null, opts.commentId ?? null]
    );

    const notification = result.rows[0];

    // Emit real-time to the recipient's personal room
    try {
      getIO().to(`user:${opts.userId}`).emit("notification", notification);
    } catch {
      // Socket not ready yet — that's OK
    }
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
};
