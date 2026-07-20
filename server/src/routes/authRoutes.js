import express from "express";
import { register, login, getMe,  updateProfile} from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";


const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authenticate, getMe);
router.put("/profile", authenticate, updateProfile);

export default router;