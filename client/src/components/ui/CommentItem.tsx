import { useState } from "react";
import { NavLink } from "react-router-dom";
import { CornerDownRight, Trash2, Send, ChevronDown } from "lucide-react";
import type { Comment } from "../../types/index";
import { commentService } from "../../services/commentService";
import { useAuth } from "../../context/AuthContext";
import Login from "../Login";
import { formatDate } from "../../utils/formatDate";

export interface CommentNode extends Comment { children: CommentNode[]; }

export function buildTree(flat: Comment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];
  flat.forEach(c => map.set(c.id, { ...c, children: [] }));
  flat.forEach(c => {
    const node = map.get(c.id)!;
    if (c.parent_comment_id && map.has(c.parent_comment_id)) map.get(c.parent_comment_id)!.children.push(node);
    else roots.push(node);
  });
  return roots;
}

const BORDERS = ["#30363d","#1f6feb","#2ea043","#d29922","#f85149","#8b949e"];

interface Props {
  comment: CommentNode;
  postId: number;
  depth: number;
  onDelete: (id: number) => void;
  onReplyAdded: (c: Comment) => void;
}

const CommentItem = ({ comment, postId, depth, onDelete, onReplyAdded }: Props) => {
  const { user, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed]   = useState(false);
  const [showReply, setShowReply]   = useState(false);
  const [replyText, setReplyText]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setLoginMessage("Sign in or create an account to reply.");
      return;
    }
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const c = await commentService.createComment({ content: replyText.trim(), post_id: postId, parent_comment_id: comment.id });
      onReplyAdded(c);
      setReplyText(""); setShowReply(false);
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const borderColor = BORDERS[Math.min(depth, BORDERS.length - 1)];

  return (
    <div className={depth > 0 ? "ml-4 pl-3" : ""} style={depth > 0 ? { borderLeft: `2px solid ${borderColor}` } : {}}>
      {loginMessage && <Login onClose={() => setLoginMessage("")} message={loginMessage} />}
      <div className="flex items-start gap-2 pt-2">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 mt-0.5"
          style={{ backgroundColor: "var(--accent)" }}>
          {comment.username?.[0]?.toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <NavLink to={`/user/${comment.user_id}`} className="text-xs font-semibold hover:underline" style={{ color: "var(--text)" }}>
              {comment.username}
            </NavLink>
            <span className="text-xs" style={{ color: "var(--muted)" }}>{formatDate(comment.created_at)}</span>
            {comment.children.length > 0 && (
              <button onClick={() => setCollapsed(!collapsed)}
                className="text-xs flex items-center gap-0.5 hover:opacity-80" style={{ color: "var(--muted)" }}>
                <ChevronDown size={11} className={`transition-transform ${collapsed ? "-rotate-90" : ""}`} />
                {collapsed ? `${comment.children.length} repl${comment.children.length === 1 ? "y" : "ies"}` : "collapse"}
              </button>
            )}
          </div>

          {!collapsed && <p className="text-sm mt-0.5" style={{ color: "var(--text)" }}>{comment.content}</p>}

          {!collapsed && (
            <div className="flex items-center gap-3 mt-1">
              <button onClick={() => isAuthenticated
                ? setShowReply(!showReply)
                : setLoginMessage("Sign in or create an account to reply.")}
                className="flex items-center gap-1 text-xs hover:text-[var(--accent)] transition-colors" style={{ color: "var(--muted)" }}>
                <CornerDownRight size={11} /> Reply
              </button>
              {user?.id === comment.user_id && (
                <button onClick={() => onDelete(comment.id)}
                  className="flex items-center gap-1 text-xs hover:text-red-500 transition-colors" style={{ color: "var(--border)" }}>
                  <Trash2 size={11} /> Delete
                </button>
              )}
            </div>
          )}

          {showReply && !collapsed && isAuthenticated && (
            <form onSubmit={handleReply} className="mt-2 flex items-center gap-2">
              <div className="flex-1 flex items-center rounded-full px-3 py-1.5 gap-1" style={{ backgroundColor: "var(--input-bg)" }}>
                <input autoFocus type="text" placeholder={`Reply to ${comment.username}...`}
                  value={replyText} onChange={e => setReplyText(e.target.value)}
                  className="bg-transparent outline-none text-xs w-full" style={{ color: "var(--text)" }} />
                <button type="submit" disabled={!replyText.trim() || submitting}
                  className="disabled:opacity-40" style={{ color: "var(--accent)" }}>
                  <Send size={12} />
                </button>
              </div>
              <button type="button" onClick={() => setShowReply(false)} className="text-xs hover:opacity-80" style={{ color: "var(--muted)" }}>
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>

      {!collapsed && comment.children.map(child => (
        <CommentItem key={child.id} comment={child} postId={postId}
          depth={depth + 1} onDelete={onDelete} onReplyAdded={onReplyAdded} />
      ))}
    </div>
  );
};
export default CommentItem;
