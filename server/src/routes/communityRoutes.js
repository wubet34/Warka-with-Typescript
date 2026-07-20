import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  createCommunity,
  getCommunities,
  getCommunityBySlug,
  joinCommunity,
  leaveCommunity,
  getCommunityPosts
} from "../controllers/communityController.js";

const router = express.Router();

router.post("/", authenticate, createCommunity);
router.get("/", getCommunities);
router.get("/:slug", getCommunityBySlug);
router.post("/:id/join", authenticate, joinCommunity);
router.delete("/:id/leave", authenticate, leaveCommunity);
router.get("/:id/posts", getCommunityPosts);

export default router;