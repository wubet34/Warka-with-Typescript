export interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  profile_image?: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  image?: string;
  link?: string;
  vote_score: number;
  created_at: string;
  user_id: number;
  username: string;
  community_id: number;
  community_name: string;
  community_slug: string;
  comment_count: number;
}

export interface Comment {
  id: number;
  content: string;
  user_id: number;
  username: string;
  profile_image?: string;
  parent_comment_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  banner?: string;
  member_count: number;
  post_count: number;
  is_private: boolean;
  owner_id?: number;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
