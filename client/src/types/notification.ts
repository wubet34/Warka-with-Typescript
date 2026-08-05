export interface Notification {
  id: number;
  type: "comment" | "reply" | "vote" | "mention" | "new_post";
  message: string;
  is_read: boolean;
  created_at: string;
  post_id?: number;
  comment_id?: number;
  actor_id?: number;
  actor_username?: string;
  actor_avatar?: string;
}
