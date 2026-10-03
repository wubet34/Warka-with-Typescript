import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import pool from "../config/db.js";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { storeImage } from "../utils/media.js";

const googleClient = new OAuth2Client();
// Public Web client ID also used as the frontend fallback. Deployments can override it.
const defaultGoogleClientId = "181033328239-fpqurruvqapfc2afnf87iv3b1m378dgi.apps.googleusercontent.com";

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

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || defaultGoogleClientId;
  const { credential } = req.body as { credential?: string };

  if (!credential) {
    res.status(400).json({ success: false, message: "Google credential is required." });
    return;
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: clientId });
    payload = ticket.getPayload();
  } catch {
    res.status(401).json({ success: false, message: "Google sign-in could not be verified." });
    return;
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    res.status(401).json({ success: false, message: "A verified Google email is required." });
    return;
  }

  try {
    const email = payload.email.trim().toLowerCase();
    const existing = await pool.query(
      `SELECT id, username, email, google_id FROM users
       WHERE google_id = $1 OR LOWER(email) = $2 LIMIT 1`,
      [payload.sub, email]
    );

    let user: { id: number; username: string; email: string };
    if (existing.rows.length > 0) {
      const current = existing.rows[0];
      if (current.google_id && current.google_id !== payload.sub) {
        res.status(409).json({ success: false, message: "This email is linked to a different Google account." });
        return;
      }

      const updated = await pool.query(
        `UPDATE users
         SET google_id = $1, email = $2, profile_image = COALESCE(profile_image, $3)
         WHERE id = $4
         RETURNING id, username, email`,
        [payload.sub, email, payload.picture ?? null, current.id]
      );
      user = updated.rows[0];
    } else {
      const base = (payload.given_name || email.split("@")[0])
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "")
        .slice(0, 30) || "warkauser";
      let username = base;
      let suffix = 1;
      while ((await pool.query("SELECT 1 FROM users WHERE LOWER(username) = LOWER($1)", [username])).rows.length > 0) {
        const tail = `_${suffix++}`;
        username = `${base.slice(0, 30 - tail.length)}${tail}`;
      }

      const inserted = await pool.query(
        `INSERT INTO users (username, email, password_hash, google_id, profile_image)
         VALUES ($1, $2, NULL, $3, $4)
         RETURNING id, username, email`,
        [username, email, payload.sub, payload.picture ?? null]
      );
      user = inserted.rows[0];
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
    const isMatch = user.password_hash
      ? await bcrypt.compare(password, user.password_hash)
      : false;

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
    const { username: requestedUsername, bio } = req.body as { username?: string; bio?: string };

    // Multer puts uploaded files in req.files (fields)
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const avatarFile = files?.["avatar"]?.[0];
    const coverFile  = files?.["cover"]?.[0];

    const current = await pool.query(
      "SELECT username, bio, profile_image, cover_image FROM users WHERE id = $1",
      [userId]
    );
    if (current.rows.length === 0) {
      res.status(404).json({ success: false, message: "User not found." });
      return;
    }
    const currentProfile = current.rows[0];
    const username = requestedUsername?.trim() || currentProfile.username;

    if (requestedUsername !== undefined && !requestedUsername.trim()) {
      res.status(400).json({ success: false, message: "Username is required." });
      return;
    }

    if (username !== currentProfile.username) {
      const existingUser = await pool.query(
        "SELECT id FROM users WHERE LOWER(username) = LOWER($1) AND id <> $2",
        [username, userId]
      );
      if (existingUser.rows.length > 0) {
        res.status(409).json({ success: false, message: "Username is already taken." });
        return;
      }
    }

    const profileImage = avatarFile ? await storeImage(avatarFile) : currentProfile?.profile_image;
    const coverImage   = coverFile  ? await storeImage(coverFile)  : currentProfile?.cover_image;

    const result = await pool.query(
      `UPDATE users
       SET username = $1, bio = $2, profile_image = $3, cover_image = $4, updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, username, email, bio, profile_image, cover_image, is_verified, created_at, updated_at`,
      [username, bio === undefined ? currentProfile.bio : bio.trim() || null, profileImage || null, coverImage || null, userId]
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
