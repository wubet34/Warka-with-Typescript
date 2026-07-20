import pool from "../config/db.js";

export const createPost = async (req, res) => {
  const client = await pool.connect();

  try {
    const { title, content, community_id } = req.body;
    const user_id = req.user.id;

    if (!title || !content || !community_id) {
      return res.status(400).json({
        success: false,
        message: "Title, content and community are required.",
      });
    }

    await client.query("BEGIN");

    // Check community exists
    const community = await client.query(
      "SELECT id FROM communities WHERE id = $1",
      [community_id]
    );

    if (community.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Community not found.",
      });
    }

    // Create post
    const result = await client.query(
      `INSERT INTO posts
      (title, content, user_id, community_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *`,
      [title, content, user_id, community_id]
    );

    // Increase post count
    await client.query(
      `UPDATE communities
       SET post_count = post_count + 1
       WHERE id = $1`,
      [community_id]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post: result.rows[0],
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

export const getPosts = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
          p.id,
          p.title,
          p.content,
          p.image,
          p.created_at,

          u.id AS author_id,
          u.username,

          c.id AS community_id,
          c.name AS community_name,
          c.slug

      FROM posts p

      JOIN users u
      ON p.user_id = u.id

      JOIN communities c
      ON p.community_id = c.id

      ORDER BY p.created_at DESC
    `);

    return res.status(200).json({
      success: true,
      posts: result.rows,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });

  }
};

export const getPostById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
          p.id,
          p.title,
          p.content,
          p.image,
          p.created_at,
          p.updated_at,

          u.id AS author_id,
          u.username,

          c.id AS community_id,
          c.name AS community_name,
          c.slug

      FROM posts p

      JOIN users u
      ON p.user_id = u.id

      JOIN communities c
      ON p.community_id = c.id

      WHERE p.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    return res.status(200).json({
      success: true,
      post: result.rows[0],
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });

  }
};

export const updatePost = async (req, res) => {
  
  try {
    const { id } = req.params;
    const { title, content, image } = req.body;

    // Find the post
    const result = await pool.query(
      "SELECT * FROM posts WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    const post = result.rows[0];
console.log("Post owner:", post.user_id, typeof post.user_id);
console.log("Logged in user:", req.user.id, typeof req.user.id);
console.log("Number(req.user.id):", Number(req.user.id));
    // Authorization
    if (Number(post.user_id) !== Number(req.user.id)) {
  return res.status(403).json({
    success: false,
    message: "You are not allowed to update this post.",
  });
}

    // Update
    const updated = await pool.query(
      `
      UPDATE posts
      SET
        title = $1,
        content = $2,
        image = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
      `,
      [title, content, image, id]
    );

    return res.status(200).json({
      success: true,
      message: "Post updated successfully.",
      post: updated.rows[0],
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });

  }
};

export const deletePost = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const result = await client.query(
      "SELECT * FROM posts WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    const post = result.rows[0];

    // Authorization
    if (Number(post.user_id) !== Number(req.user.id)) {
      await client.query("ROLLBACK");

      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this post.",
      });
    }

    await client.query(
      "DELETE FROM posts WHERE id = $1",
      [id]
    );

    await client.query(
      `
      UPDATE communities
      SET post_count = post_count - 1
      WHERE id = $1
      `,
      [post.community_id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
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


export const getFeed = async (req, res) => {
  try {

    const result = await pool.query(`
      SELECT
          p.id,
          p.title,
          p.content,
          p.image,
          p.vote_score,
          p.created_at,

          u.id AS user_id,
          u.username,

          c.id AS community_id,
          c.name AS community_name,
          c.slug AS community_slug,

          COUNT(DISTINCT cm.id) AS comment_count

      FROM posts p

      JOIN users u
          ON p.user_id = u.id

      JOIN communities c
          ON p.community_id = c.id

      LEFT JOIN comments cm
          ON cm.post_id = p.id

      GROUP BY
          p.id,
          u.id,
          c.id

      ORDER BY p.created_at DESC
      LIMIT 20
    `);

    return res.status(200).json({
      success: true,
      posts: result.rows,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });

  }
};