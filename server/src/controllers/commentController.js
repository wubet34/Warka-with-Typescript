import pool from "../config/db.js";

export const createComment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { content, post_id, parent_comment_id } = req.body;
    const user_id = req.user.id;

    if (!content || !post_id) {
      return res.status(400).json({
        success: false,
        message: "Content and post_id are required.",
      });
    }

    await client.query("BEGIN");

    // Check that the post exists
    const post = await client.query(
      "SELECT id FROM posts WHERE id = $1",
      [post_id]
    );

    if (post.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Insert comment
    const result = await client.query(
      `
      INSERT INTO comments
      (content, user_id, post_id, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        content,
        user_id,
        post_id,
        parent_comment_id || null,
      ]
    );

    // Increase comment count
    await client.query(
      `
      UPDATE posts
      SET comment_count = comment_count + 1
      WHERE id = $1
      `,
      [post_id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Comment created successfully.",
      comment: result.rows[0],
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error(error);

    return res.status(500).json({
        success: false,
        message: "Internal server error.",
        error: error.message
    });
}finally {

    client.release();

  }
};

export const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      `
      SELECT
        c.id,
        c.content,
        c.parent_comment_id,
        c.created_at,
        c.updated_at,
        u.id AS user_id,
        u.username,
        u.profile_image
      FROM comments c
      JOIN users u
        ON c.user_id = u.id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
      `,
      [postId]
    );

    return res.status(200).json({
      success: true,
      comments: result.rows,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required.",
      });
    }

    const existing = await pool.query(
      "SELECT * FROM comments WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    const comment = existing.rows[0];

    if (Number(comment.user_id) !== Number(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this comment.",
      });
    }

    const updated = await pool.query(
      `
      UPDATE comments
      SET
        content = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
      `,
      [content, id]
    );

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully.",
      comment: updated.rows[0],
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};


export const deleteComment = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    // Find the comment
    const result = await client.query(
      "SELECT * FROM comments WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Comment not found.",
      });
    }

    const comment = result.rows[0];

    // Check ownership
    if (Number(comment.user_id) !== Number(req.user.id)) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this comment.",
      });
    }

    // Delete comment
    await client.query(
      "DELETE FROM comments WHERE id = $1",
      [id]
    );

    // Decrease comment count
    await client.query(
      `
      UPDATE posts
      SET comment_count = comment_count - 1
      WHERE id = $1
      `,
      [comment.post_id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
    });

  } catch (error) {

    await client.query("ROLLBACK");

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });

  } finally {

    client.release();

  }
};