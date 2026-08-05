import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  markAllRead,
  markOneRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = Router();

router.get("/",               authenticate, getNotifications);
router.put("/read-all",       authenticate, markAllRead);
router.put("/:id/read",       authenticate, markOneRead);
router.delete("/:id",         authenticate, deleteNotification);

export default router;
