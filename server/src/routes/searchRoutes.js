import express from "express";
import {
    searchPosts,
    searchUsers,
    searchCommunities
} from "../controllers/searchController.js";

const router = express.Router();

router.get("/posts", searchPosts);
router.get("/users", searchUsers);
router.get("/communities", searchCommunities);

export default router;