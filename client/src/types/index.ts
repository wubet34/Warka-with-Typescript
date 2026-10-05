export interface User {
  id: number;
  username: string;
  email: string;
  bio?: string;
  country?: string;
  city?: string;
  website?: string;
  social_links?: Record<string, string>;
  profile_image?: string;
  cover_image?: string;
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
  user_vote?: 1 | -1 | 0;
  user_bookmarked?: boolean;
  post_type?: "question" | "discussion" | "news" | "tutorial" | "resource" | "poll" | "announcement";
  tags?: string[];
  views?: number;
  is_locked?: boolean;
  is_pinned?: boolean;
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
  vote_score?: number;
  user_vote?: 1 | -1 | 0;
  created_at: string;
  updated_at: string;
}

export interface Community {
  id: number;
  name: string;
  slug: string;
  description?: string;
  rules?: string;
  tags?: string[];
  wiki?: string;
  owner_id?: number;
  logo?: string;
  banner?: string;
  member_count: number;
  post_count: number;
  is_private: boolean;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}
