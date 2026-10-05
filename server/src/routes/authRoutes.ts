import { Router, Request, Response, NextFunction } from "express";
import { register, login, googleLogin, getMe, updateProfile, deleteAccount, changePassword } from "../controllers/authController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { uploadProfile } from "../middleware/uploadProfile.js";

const router = Router();

function runProfileUpload(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    uploadProfile.fields([
      { name: "avatar", maxCount: 1 },
      { name: "cover",  maxCount: 1 },
    ])(req, res, (err) => (err ? reject(err) : resolve()));
  });
}

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", authenticate, getMe);
router.delete("/me", authenticate, deleteAccount);
router.put("/password", authenticate, changePassword);
router.put("/profile", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await runProfileUpload(req, res);
    await updateProfile(req, res);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload failed.";
    res.status(400).json({ success: false, message: msg });
  }
});

export default router;
