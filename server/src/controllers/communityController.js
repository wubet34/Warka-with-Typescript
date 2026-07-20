import pool from "../config/db.js";
import { slugify } from "../utils/slugify.js";


export const getCommunities = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        name,
        slug,
        description,
        logo,
        banner,
        member_count,
        post_count,
        is_private,
        created_at
      FROM communities
      ORDER BY created_at DESC
    `);

    return res.status(200).json({
      success: true,
      communities: result.rows,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const getCommunityBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT
        id,
        name,
        slug,
        description,
        logo,
        banner,
        member_count,
        post_count,
        is_private,
        owner_id,
        created_at,
        updated_at
      FROM communities
      WHERE slug = $1`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Community not found.",
      });
    }

    return res.status(200).json({
      success: true,
      community: result.rows[0],
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};




export const createCommunity = async (req, res) => {
  try {
    const { name, description } = req.body;

    const ownerId = req.user.id;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Community name is required.",
      });
    }

    const slug = slugify(name);

    // Check if the slug already exists
    const exists = await pool.query(
      "SELECT id FROM communities WHERE slug = $1",
      [slug]
    );

    if (exists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Community already exists.",
      });
    }

    // Create the community
    const result = await pool.query(
      `INSERT INTO communities (name, slug, description, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, slug, description, ownerId]
    );

    const community = result.rows[0];

    // Add the creator as the first member
    await pool.query(
      `INSERT INTO community_members (user_id, community_id)
       VALUES ($1, $2)`,
      [ownerId, community.id]
    );

    return res.status(201).json({
      success: true,
      message: "Community created successfully.",
      community,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const joinCommunity = async (req, res) => {
  const client = await pool.connect();

  try {
    const communityId = req.params.id;
    const userId = req.user.id;

    await client.query("BEGIN");

    // Check community exists
    const community = await client.query(
      "SELECT id FROM communities WHERE id = $1",
      [communityId]
    );

    if (community.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Community not found.",
      });
    }

    // Check if already a member
    const member = await client.query(
      `
      SELECT id
      FROM community_members
      WHERE user_id = $1
      AND community_id = $2
      `,
      [userId, communityId]
    );

    if (member.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        success: false,
        message: "You are already a member.",
      });
    }

    // Join community
    await client.query(
      `
      INSERT INTO community_members (user_id, community_id)
      VALUES ($1, $2)
      `,
      [userId, communityId]
    );

    // Increase member count
    await client.query(
      `
      UPDATE communities
      SET member_count = member_count + 1
      WHERE id = $1
      `,
      [communityId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Joined community successfully.",
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

export const leaveCommunity = async (req, res) => {
  const client = await pool.connect();

  try {
    const communityId = req.params.id;
    const userId = req.user.id;

    await client.query("BEGIN");

    // Check membership
    const member = await client.query(
      `
      SELECT id
      FROM community_members
      WHERE user_id = $1
      AND community_id = $2
      `,
      [userId, communityId]
    );

    if (member.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "You are not a member of this community.",
      });
    }

    // Remove membership
    await client.query(
      `
      DELETE FROM community_members
      WHERE user_id = $1
      AND community_id = $2
      `,
      [userId, communityId]
    );

    // Decrease member count
    await client.query(
      `
      UPDATE communities
      SET member_count = member_count - 1
      WHERE id = $1
      `,
      [communityId]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      success: true,
      message: "Left community successfully.",
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

export const getCommunityPosts = async (req, res) => {
  try {

    const { id } = req.params;

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
          c.slug,

          COUNT(DISTINCT cm.id) AS comment_count

      FROM posts p

      JOIN users u
          ON p.user_id = u.id

      JOIN communities c
          ON p.community_id = c.id

      LEFT JOIN comments cm
          ON cm.post_id = p.id

      WHERE c.id = $1

      GROUP BY
          p.id,
          u.id,
          c.id

      ORDER BY p.created_at DESC
    `,[id]);

    return res.status(200).json({
      success:true,
      posts:result.rows
    });

  } catch(error){

    console.error(error);

    return res.status(500).json({
      success:false,
      message:"Internal server error."
    });

  }
};