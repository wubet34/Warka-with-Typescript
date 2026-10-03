import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthUser } from "../types/index.js";

export interface AuthRequest extends Request {
  user: AuthUser;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
      return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Invalid token format.",
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    (req as AuthRequest).user = decoded;

    next();
  } catch {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

export const authenticateOptional = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    try {
      (req as AuthRequest).user = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
    } catch {
      // Public comment reads remain available when a saved token has expired.
    }
  }
  next();
};
