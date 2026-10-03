import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedExts = /\.(jpeg|jpg|png|gif|webp)$/i;
  const allowedMimes = /^image\/(jpeg|png|gif|webp)$/;
  const ext = path.extname(file.originalname);

  if (allowedExts.test(ext) && allowedMimes.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpg, png, gif, webp)."));
  }
};

export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
