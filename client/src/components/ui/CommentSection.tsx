import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import type { Comment } from "../../types/index";
import { commentService } from "../../services/commentService";
import { useAuth } from "../../context/AuthContext";
import Login from "../Login";
import { useSocket } from "../../context/SocketContext";
import CommentItem, { buildTree } from "./CommentItem";
import { RowSkeleton } from "./LoadingSkeleton";

interface Props { postId: number; initialCount: number; onCountChange?: (n: number) => void; }

const CommentSection = ({ postId, initialCount, onCountChange }: Props) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, joinPost, leavePost } = useSocket();
  const [flat, setFlat]         = useState<Comment[]>([]);
  const [loaded, setLoaded]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [text, setText]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [, setCount]       = useState(initialCount);

  useEffect(() => {
    setLoading(true);
    commentService.getCommentsByPost(postId)
      .then(d => { setFlat(d); setLoaded(true); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [postId]);

  useEffect(() => {
    joinPost(postId);
    const h = (c: Comment) => {
      setFlat(prev => prev.find(x => x.id === c.id) ? prev : [...prev, c]);
      setCount(n => { const next = n + 1; onCountChange?.(next); return next; });
    };
    socket.on("new_comment", h);
    return () => { leavePost(postId); socket.off("new_comment", h); };
  }, [postId, socket, joinPost, leavePost, onCountChange]);

  const addCount = (n: number) => setCount(c => { const next = c + n; onCountChange?.(next); return next; });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setLoginMessage("Sign in or create an account to comment.");
      return;
    }
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const c = await commentService.createComment({ content: text.trim(), post_id: postId });
      setFlat(prev => prev.find(x => x.id === c.id) ? prev : [...prev, c]);
      addCount(1); setText("");
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleReplyAdded = (c: Comment) => {
    setFlat(prev => prev.find(x => x.id === c.id) ? prev : [...prev, c]);
    addCount(1);
  };

  const handleDelete = async (id: number) => {
    try {
      await commentService.deleteComment(id);
      const toRemove = new Set<number>();
      const collect = (cid: number) => { toRemove.add(cid); flat.forEach(c => { if (c.parent_comment_id === cid) collect(c.id); }); };
      collect(id);
      setFlat(prev => prev.filter(c => !toRemove.has(c.id)));
      addCount(-toRemove.size);
    } catch (err) { console.error(err); }
  };

  const tree = loaded ? buildTree(flat) : [];

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      {loginMessage && <Login onClose={() => setLoginMessage("")} message={loginMessage} />}
      {isAuthenticated && (
        <div className="px-3 sm:px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: "var(--accent)" }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 flex items-center rounded-full px-3 py-2 gap-1" style={{ backgroundColor: "var(--input-bg)" }}>
              <input type="text" placeholder="Add a comment..." value={text} onChange={e => setText(e.target.value)}
                className="bg-transparent outline-none text-sm w-full" style={{ color: "var(--text)" }} />
              <button type="submit" disabled={!text.trim() || submitting} className="disabled:opacity-40" style={{ color: "var(--accent)" }}>
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
      {!isAuthenticated && (
        <div className="px-3 py-3 sm:px-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <button type="button" onClick={() => setLoginMessage("Sign in or create an account to comment.")}
            className="w-full rounded-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[var(--surface2)]"
            style={{ backgroundColor: "var(--input-bg)", color: "var(--muted)" }}>Log in to comment</button>
        </div>
      )}

      <div className="px-3 sm:px-4 py-3" style={{ backgroundColor: "var(--surface2)" }}>
        {loading ? (
          <RowSkeleton count={3} />
        ) : tree.length === 0 ? (
          <p className="text-xs text-center py-3" style={{ color: "var(--muted)" }}>
            {isAuthenticated ? "No comments yet. Be the first!" : "No comments yet."}
          </p>
        ) : (
          <div className="space-y-1">
            {tree.map(node => (
              <CommentItem key={node.id} comment={node} postId={postId}
                depth={0} onDelete={handleDelete} onReplyAdded={handleReplyAdded} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default CommentSection;
