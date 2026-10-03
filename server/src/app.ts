import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import authRoutes from "./routes/authRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import voteRoutes from "./routes/voteRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { uploadsDir } from "./utils/uploads.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without origin (Postman, Bruno, mobile apps, server-to-server)
      if (!origin) {
        return callback(null, true);
      }

      const allowedOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://warka-app.vercel.app",
      ];

      // Allow exact allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow Vercel preview deployments
      if (origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }

      console.log("CORS blocked origin:", origin);
      return callback(null, false);
    },

    credentials: true,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve files from the same configured directory used by both upload handlers.
app.use("/uploads", express.static(uploadsDir));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/votes", voteRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/admin", adminRoutes);

// Multer error handler — converts multer errors to clean 400 responses
// instead of unhandled 500s
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ success: false, message: "File too large. Maximum size is 5 MB." });
      return;
    }
    res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    return;
  }
  if (err.message?.includes("Only image files")) {
    res.status(400).json({ success: false, message: err.message });
    return;
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ success: false, message: "Internal server error." });
});


export default app;
