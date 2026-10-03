import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Use the same directory for writing and serving files. Keep the local default
// anchored to the server package so it doesn't change with the launch directory.
const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? path.join(serverDir, "uploads"));

fs.mkdirSync(uploadsDir, { recursive: true });
