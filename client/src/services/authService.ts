import api from "../api/client";
import type { User } from "../types/index";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<{ success: boolean; message: string; user: User }> {
    const { data } = await api.post("/auth/register", payload);
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await api.get<{ success: boolean; user: User }>("/auth/me");
    return data.user;
  },

  async updateProfile(payload: {
    username: string;
    bio?: string;
    profile_image?: string;
  }): Promise<User> {
    const { data } = await api.put<{ success: boolean; user: User }>("/auth/profile", payload);
    return data.user;
  },
};
