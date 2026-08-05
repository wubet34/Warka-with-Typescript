import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  createCommunity,
  getCommunities,
  getCommunityBySlug,
  joinCommunity,
  leaveCommunity,
  getCommunityPosts,
  checkMembership,
} from "../controllers/communityController.js";

const router = Router();

router.post("/", authenticate, createCommunity);
router.get("/", getCommunities);

// Specific sub-routes BEFORE the generic /:slug to avoid conflicts
router.get("/:id/membership", authenticate, checkMembership);
router.post("/:id/join", authenticate, joinCommunity);
router.delete("/:id/leave", authenticate, leaveCommunity);
router.get("/:id/posts", getCommunityPosts);

// Generic slug route LAST
router.get("/:slug", getCommunityBySlug);

export default router;
