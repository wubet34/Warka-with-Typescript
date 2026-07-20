import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    getFeed
} from "../controllers/postController.js";

const router = express.Router();

router.post("/", authenticate, createPost);
router.get("/", getPosts);
router.get("/feed", getFeed);
router.get("/:id", getPostById);
router.put("/:id", authenticate, updatePost);
router.delete("/:id", authenticate, deletePost);


export default router;