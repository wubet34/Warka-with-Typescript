import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import pool from "./config/db.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js"
import voteRoutes from "./routes/voteRoutes.js";
import userRoutes from "./routes/userRoutes.js";    
import searchRoutes from "./routes/searchRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/posts", postRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/communities", communityRoutes);

app.use("/api/comments", commentRoutes);
app.use("/api/votes", voteRoutes);

app.use("/api/users", userRoutes);

app.use("/api/search", searchRoutes);

export default app;