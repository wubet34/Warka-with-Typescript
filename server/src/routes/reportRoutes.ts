import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { createReport, getReports, reviewReport } from "../controllers/reportController.js";

const router = Router();
router.post("/", authenticate, createReport);
router.get("/", authenticate, getReports);
router.patch("/:id", authenticate, reviewReport);
export default router;
