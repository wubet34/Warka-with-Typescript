import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { blockUser, getConversations, getThread, hideConversation, sendMessage, unblockUser } from "../controllers/messageController.js";
import { upload } from "../middleware/upload.js";

const router = Router();
router.use(authenticate);
router.get("/", getConversations);
router.get("/:userId", getThread);
router.post("/:userId", upload.single("image"), sendMessage);
router.delete("/:userId", hideConversation);
router.post("/:userId/block", blockUser);
router.delete("/:userId/block", unblockUser);
export default router;
