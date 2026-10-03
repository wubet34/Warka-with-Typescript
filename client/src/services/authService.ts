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

  async loginWithGoogle(credential: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>("/auth/google", { credential });
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
    username?: string;
    bio?: string;
    avatar?: File;
    cover?: File;
  }): Promise<User> {
    const form = new FormData();
    if (payload.username !== undefined) form.append("username", payload.username);
    if (payload.bio !== undefined) form.append("bio", payload.bio);
    if (payload.avatar) form.append("avatar", payload.avatar);
    if (payload.cover)  form.append("cover", payload.cover);

    const { data } = await api.put<{ success: boolean; user: User }>("/auth/profile", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data.user;
  },
};
