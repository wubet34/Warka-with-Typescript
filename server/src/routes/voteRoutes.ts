import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { votePost } from "../controllers/voteController.js";

const router = Router();

router.post("/", authenticate, votePost);

export default router;
