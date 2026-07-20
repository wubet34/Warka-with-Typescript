import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getFeed,
} from "../controllers/postController.js";

const router = Router();

// multer handles multipart/form-data; image field name is "image"
router.post("/", authenticate, upload.single("image"), createPost);
router.get("/", getPosts);
router.get("/feed", getFeed);
router.get("/:id", getPostById);
router.put("/:id", authenticate, upload.single("image"), updatePost);
router.delete("/:id", authenticate, deletePost);

export default router;
