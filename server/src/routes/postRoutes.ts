import { Router, Request, Response, NextFunction } from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  getFeed,
  getPopular,
} from "../controllers/postController.js";

const router = Router();

// Wrap multer in a promise so errors surface cleanly in Express 5
function runMulter(req: Request, res: Response): Promise<void> {
  return new Promise((resolve, reject) => {
    upload.single("image")(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function withUpload(
  req: Request,
  res: Response,
  next: NextFunction,
  handler: (req: Request, res: Response) => Promise<void>
) {
  try {
    await runMulter(req, res);
    await handler(req, res);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Upload failed.";
    const isFileSizeError =
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "LIMIT_FILE_SIZE";

    res.status(400).json({
      success: false,
      message: isFileSizeError
        ? "File too large. Maximum size is 5 MB."
        : message,
    });
  }
}

router.post("/", authenticate, (req, res, next) =>
  withUpload(req, res, next, createPost)
);
router.get("/", getPosts);
router.get("/feed", getFeed);
router.get("/popular", getPopular);
router.get("/:id", getPostById);
router.put("/:id", authenticate, (req, res, next) =>
  withUpload(req, res, next, updatePost)
);
router.delete("/:id", authenticate, deletePost);

export default router;
