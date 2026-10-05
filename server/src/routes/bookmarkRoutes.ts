import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { addBookmark, getBookmarks, removeBookmark } from "../controllers/bookmarkController.js";

const router = Router();
router.use(authenticate);
router.get("/", getBookmarks);
router.post("/:postId", addBookmark);
router.delete("/:postId", removeBookmark);
export default router;
