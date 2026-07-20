import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { votePost } from "../controllers/voteController.js";

const router = express.Router();

router.post("/", authenticate, votePost);

export default router;