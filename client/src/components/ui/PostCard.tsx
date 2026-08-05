import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import type { Post } from "../../types/index";
import { voteService } from "../../services/voteService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { formatDate } from "../../utils/formatDate";
import { imgUrl } from "../../utils/imageUrl";
import CommentSection from "./CommentSection";

interface Props {
  post: Post;
  onDelete?: (id: number) => void;
  showComments?: boolean;
}

const PostCard = ({ post, onDelete, showComments: initOpen = false }: Props) => {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [voteScore, setVoteScore]     = useState(post.vote_score);
  const [userVote, setUserVote]       = useState<1 | -1 | 0>(0);
  const [commentsOpen, setCommentsOpen] = useState(initOpen);
  const [commentCount, setCommentCount] = useState(Number(post.comment_count));

  useEffect(() => {
    const h = ({ postId, voteScore: s }: { postId: number; voteScore: number }) => {
      if (postId === post.id) setVoteScore(s);
    };
    socket.on("vote_update", h);
    return () => { socket.off("vote_update", h); };
  }, [post.id, socket]);

  const handleVote = async (v: 1 | -1) => {
    if (!isAuthenticated) return;
    try {
      await voteService.vote(post.id, v);
      if (userVote === v) { setVoteScore(s => s - v); setUserVote(0); }
      else { setVoteScore(s => s + v - userVote); setUserVote(v); }
    } catch (err) { console.error(err); }
  };

  const upActive   = userVote === 1;
  const downActive = userVote === -1;

  return (
    <div className="rounded-2xl overflow-hidden transition-colors hover:border-[var(--accent)]/30"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex">
        {/* Vote column */}
        <div className="flex flex-col items-center px-2 sm:px-3 py-4 gap-1 shrink-0"
          style={{ backgroundColor: "var(--surface2)" }}>
          <button onClick={() => handleVote(1)} className="p-1 rounded transition-colors"
            style={{ color: upActive ? "var(--accent)" : "var(--muted)" }}>
            <ChevronUp size={18} />
          </button>
          <span className="text-xs font-bold"
            style={{ color: voteScore > 0 ? "var(--accent)" : voteScore < 0 ? "#f85149" : "var(--muted)" }}>
            {voteScore}
          </span>
          <button onClick={() => handleVote(-1)} className="p-1 rounded transition-colors"
            style={{ color: downActive ? "#f85149" : "var(--muted)" }}>
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 p-3 sm:p-4">
          {/* Meta */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap text-xs" style={{ color: "var(--muted)" }}>
              <NavLink to={`/w/${post.community_slug}`} className="font-semibold hover:underline" style={{ color: "var(--text)" }}>
                w/{post.community_name}
              </NavLink>
              <span>•</span>
              <span>by</span>
              <NavLink to={`/user/${post.user_id}`} className="hover:underline" style={{ color: "var(--muted)" }}>
                u/{post.username}
              </NavLink>
              <span>•</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
            {user?.id === post.user_id && onDelete && (
              <button onClick={() => onDelete(post.id)} className="shrink-0 hover:text-red-500 transition-colors"
                style={{ color: "var(--border)" }}>
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>

          {/* Title */}
          <h3 onClick={() => navigate(`/post/${post.id}`)}
            className="text-sm font-semibold mb-1.5 leading-snug cursor-pointer hover:text-[var(--accent)] transition-colors"
            style={{ color: "var(--text)" }}>
            {post.title}
          </h3>

          {post.content && (
            <p className="text-sm line-clamp-3 mb-3" style={{ color: "var(--muted)" }}>{post.content}</p>
          )}

          {post.image && (
            <div className="mb-3 rounded-xl overflow-hidden cursor-pointer" onClick={() => navigate(`/post/${post.id}`)}>
              <img src={imgUrl(post.image)} alt="" className="w-full object-cover max-h-72" />
            </div>
          )}

          {post.link && (
            <a href={post.link} target="_blank" rel="noopener noreferrer"
              className="mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl transition-colors hover:opacity-80"
              style={{ backgroundColor: "var(--surface2)", border: "1px solid var(--border)" }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: "var(--accent)" }}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <span className="text-xs truncate" style={{ color: "var(--accent)" }}>{post.link}</span>
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button onClick={() => setCommentsOpen(v => !v)}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--accent)]"
              style={{ color: "var(--muted)" }}>
              <MessageCircle size={15} /> {commentCount} Comments
            </button>
            <button className="flex items-center gap-1.5 text-xs transition-colors hover:text-[var(--accent)]"
              style={{ color: "var(--muted)" }}>
              <Share size={15} /> Share
            </button>
          </div>
        </div>
      </div>

      {commentsOpen && (
        <CommentSection postId={post.id} initialCount={commentCount} onCountChange={setCommentCount} />
      )}
    </div>
  );
};
export default PostCard;
