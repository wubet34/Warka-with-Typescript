import pool from "../config/db.js";

export const votePost = async (req, res) => {
  const client = await pool.connect();

  try {
    const { post_id, vote } = req.body;
    const user_id = req.user.id;

    if (!post_id || ![1, -1].includes(vote)) {
      return res.status(400).json({
        success: false,
        message: "Valid post_id and vote are required.",
      });
    }

    await client.query("BEGIN");

    // Check post exists
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

    // Has the user already voted?
    const existingVote = await client.query(
      `
      SELECT *
      FROM votes
      WHERE user_id = $1
      AND post_id = $2
      `,
      [user_id, post_id]
    );

    // First vote
    if (existingVote.rows.length === 0) {
      await client.query(
        `
        INSERT INTO votes (user_id, post_id, vote)
        VALUES ($1, $2, $3)
        `,
        [user_id, post_id, vote]
      );

      await client.query(
        `
        UPDATE posts
        SET vote_score = vote_score + $1
        WHERE id = $2
        `,
        [vote, post_id]
      );

      await client.query("COMMIT");

      return res.status(201).json({
        success: true,
        message: "Vote added.",
      });
    }

    const currentVote = existingVote.rows[0];

    // Same vote -> remove vote
    if (currentVote.vote === vote) {
      await client.query(
        "DELETE FROM votes WHERE id = $1",
        [currentVote.id]
      );

      await client.query(
        `
        UPDATE posts
        SET vote_score = vote_score - $1
        WHERE id = $2
        `,
        [vote, post_id]
      );

      await client.query("COMMIT");

      return res.status(200).json({
        success: true,
        message: "Vote removed.",
      });
    }

    // Change vote
    await client.query(
      `
      UPDATE votes
      SET vote = $1
      WHERE id = $2
      `,
      [vote, currentVote.id]
    );

    const scoreChange = vote - currentVote.vote;

    await client.query(
      `
      UPDATE posts
      SET vote_score = vote_score + $1
      WHERE id = $2
      `,
      [scoreChange, post_id]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Vote updated.",
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