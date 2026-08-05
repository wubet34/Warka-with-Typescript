import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";

export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = (req as AuthRequest).user;

    const result = await pool.query(
      `SELECT id, username, email, profile_image, cover_image, bio, is_verified, created_at
       FROM users WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }

    res.status(200).json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body as {
      username: string;
      email: string;
      password: string;
    };

    if (!username || !email || !password) {
      res.status(400).json({ success: false, message: "All fields are required." });
      return;
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: "Username or email is already in use.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
      return;
    }

    const result = await pool.query(
      "SELECT id, username, email, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ success: false, message: "Invalid email or password." });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: { id: user.id, username: user.username, email: user.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as AuthRequest).user.id;
    const { username, bio } = req.body as { username: string; bio?: string };

    // Multer puts uploaded files in req.files (fields)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const avatarFile = files?.["avatar"]?.[0];
    const coverFile  = files?.["cover"]?.[0];

    if (!username) {
      res.status(400).json({ success: false, message: "Username is required." });
      return;
    }

    const existingUser = await pool.query(
      "SELECT id FROM users WHERE username = $1 AND id != $2",
      [username, userId]
    );
    if (existingUser.rows.length > 0) {
      res.status(409).json({ success: false, message: "Username is already taken." });
      return;
    }

    // Fetch current values to keep unchanged fields
    const current = await pool.query("SELECT profile_image, cover_image FROM users WHERE id = $1", [userId]);
    const currentProfile = current.rows[0];

    const profileImage = avatarFile ? `/uploads/${avatarFile.filename}` : currentProfile?.profile_image;
    const coverImage   = coverFile  ? `/uploads/${coverFile.filename}`  : currentProfile?.cover_image;

    const result = await pool.query(
      `UPDATE users
       SET username = $1, bio = $2, profile_image = $3, cover_image = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, username, email, bio, profile_image, cover_image, is_verified, created_at, updated_at`,
      [username, bio || null, profileImage || null, coverImage || null, userId]
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: result.rows[0],
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};
