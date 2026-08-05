import { Router } from "express";
import {
  searchAll,
  searchPosts,
  searchUsers,
  searchCommunities,
} from "../controllers/searchController.js";

const router = Router();

router.get("/",            searchAll);        // unified: /api/search?q=...
router.get("/posts",       searchPosts);
router.get("/users",       searchUsers);
router.get("/communities", searchCommunities);

export default router;
