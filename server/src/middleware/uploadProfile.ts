import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
  if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only image files allowed."));
};

export const uploadProfile = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
