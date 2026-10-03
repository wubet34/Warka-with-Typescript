import pool from "../config/db.js";

export const storeImage = async (file: Express.Multer.File): Promise<string> => {
  const result = await pool.query<{ id: number }>(
    `INSERT INTO media_assets (content_type, data)
     VALUES ($1, $2)
     RETURNING id`,
    [file.mimetype, file.buffer]
  );

  return `/media/${result.rows[0].id}`;
};
