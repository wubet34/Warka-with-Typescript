import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { follow, followTag, getFollowState, getFollowing, getTagFollowState, unfollow, unfollowTag } from "../controllers/followController.js";

const router = Router();
router.use(authenticate);
router.get("/", getFollowing);
router.get("/tags/:tag", getTagFollowState);
router.post("/tags/:tag", followTag);
router.delete("/tags/:tag", unfollowTag);
router.get("/:type/:id", getFollowState);
router.post("/:type/:id", follow);
router.delete("/:type/:id", unfollow);
export default router;
