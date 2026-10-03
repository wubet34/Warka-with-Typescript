import { Router } from "express";
import { getAdminStats } from "../controllers/adminController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/stats", authenticate, getAdminStats);

export default router;
