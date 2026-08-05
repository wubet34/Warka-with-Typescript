import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

// NeonDB requires SSL in production.
// Supports both DATABASE_URL (Render/NeonDB style) and individual env vars.
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host:     process.env.DB_HOST,
        port:     Number(process.env.DB_PORT) || 5432,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        // Enable SSL when not localhost
        ssl: process.env.DB_HOST && !process.env.DB_HOST.includes("localhost")
          ? { rejectUnauthorized: false }
          : undefined,
      }
);

pool
  .connect()
  .then(() => console.log("Connected to the database"))
  .catch((err: Error) => console.error("Error connecting to the database", err));

export default pool;
