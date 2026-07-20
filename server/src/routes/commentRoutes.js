import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { createComment,getCommentsByPost, updateComment, deleteComment } from "../controllers/commentController.js";

const router = express.Router();

router.post("/", authenticate, createComment);
router.get("/post/:postId", getCommentsByPost);
router.put("/:id", authenticate, updateComment);
router.delete("/:id", authenticate, deleteComment);

export default router;