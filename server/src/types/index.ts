import { Request } from "express";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface AuthRequest extends Request {
  user: AuthUser;
}
