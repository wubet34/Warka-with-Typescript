import { Router } from "express";
import { authenticate, authenticateOptional } from "../middleware/authMiddleware.js";
import {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  voteComment,
} from "../controllers/commentController.js";

const router = Router();

router.post("/", authenticate, createComment);
router.get("/post/:postId", authenticateOptional, getCommentsByPost);
router.post("/:id/vote", authenticate, voteComment);
router.put("/:id", authenticate, updateComment);
router.delete("/:id", authenticate, deleteComment);

export default router;
