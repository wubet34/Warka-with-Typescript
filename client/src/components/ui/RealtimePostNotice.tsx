import { X, Radio } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Post } from "../../types/index";

interface Props {
  post: Post;
  onClose: () => void;
}

export default function RealtimePostNotice({ post, onClose }: Props) {
  const navigate = useNavigate();

  return (
    <div role="status" className="fixed right-4 top-20 z-[80] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl shadow-2xl"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-start gap-3 p-3">
        <span className="mt-0.5 rounded-full p-2" style={{ color: "var(--accent)", backgroundColor: "var(--surface2)" }}>
          <Radio size={17} />
        </span>
        <button type="button" className="min-w-0 flex-1 text-left" onClick={() => { onClose(); navigate(`/post/${post.id}`); }}>
          <span className="block text-xs font-semibold" style={{ color: "var(--accent)" }}>
            New post{post.community_name ? ` in w/${post.community_name}` : ""}
          </span>
          <span className="mt-0.5 block truncate text-sm font-medium" style={{ color: "var(--text)" }}>{post.title}</span>
          <span className="mt-0.5 block truncate text-xs" style={{ color: "var(--muted)" }}>by u/{post.username} · View post</span>
        </button>
        <button type="button" onClick={onClose} aria-label="Dismiss new post notice"
          className="rounded-lg p-1 hover:bg-[var(--surface2)]" style={{ color: "var(--muted)" }}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
