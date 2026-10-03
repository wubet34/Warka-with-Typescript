import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";
import { uploadsDir } from "../utils/uploads.js";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname).toLowerCase()}`);
  },
});

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
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
