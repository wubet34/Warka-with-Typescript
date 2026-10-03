import { Request, Response } from "express";
import pool from "../config/db.js";

export const getMedia = async (req: Request, res: Response): Promise<void> => {
  if (!/^[1-9]\d*$/.test(req.params.id)) {
    res.status(400).send("Invalid image id.");
    return;
  }

  try {
    const result = await pool.query(
      "SELECT content_type, data FROM media_assets WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).send("Image not found.");
      return;
    }

    res.setHeader("Content-Type", result.rows[0].content_type);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(result.rows[0].data);
  } catch (error) {
    console.error("Failed to load image:", error);
    res.status(500).send("Failed to load image.");
  }
};
