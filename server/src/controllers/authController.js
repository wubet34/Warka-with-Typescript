import bcrypt from "bcrypt";
import pool from "../config/db.js";
import jwt from "jsonwebtoken";

export const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        username,
        email,
        profile_image,
        bio,
        is_verified,
        created_at
      FROM users
      WHERE id = $1`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username or email is already in use.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash],
    );

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }
    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE email = $1",
      [email],
    );
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { username, bio, profile_image } = req.body;

    // Validation
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
      });
    }

    // Check if another user already uses this username
    const existingUser = await pool.query(
      `SELECT id
       FROM users
       WHERE username = $1
       AND id != $2`,
      [username, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username is already taken.",
      });
    }

    // Update profile
    const result = await pool.query(
      `UPDATE users
       SET
         username = $1,
         bio = $2,
         profile_image = $3,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING
         id,
         username,
         email,
         bio,
         profile_image,
         is_verified,
         created_at,
         updated_at`,
      [username, bio, profile_image, userId]
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: result.rows[0],
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};