import fs from "fs";
import path from "path";

// Use the same directory for writing and serving files. On Render this points
// at the persistent disk; locally it defaults to server/uploads.
export const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads"));

fs.mkdirSync(uploadsDir, { recursive: true });
