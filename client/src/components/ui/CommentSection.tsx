import { useState, useEffect, useCallback, useRef } from "react";
import { Send } from "lucide-react";
import type { Comment } from "../../types/index";
import { commentService } from "../../services/commentService";
import { useAuth } from "../../context/AuthContext";
import Login from "../Login";
import { useSocket } from "../../context/SocketContext";
import CommentItem, { buildTree } from "./CommentItem";
import { RowSkeleton } from "./LoadingSkeleton";

interface Props { postId: number; initialCount: number; onCountChange?: (n: number) => void; locked?: boolean; }

const CommentSection = ({ postId, initialCount, onCountChange, locked = false }: Props) => {
  const { user, isAuthenticated } = useAuth();
  const { socket, joinPost, leavePost } = useSocket();
  const [flat, setFlat]         = useState<Comment[]>([]);
  const [loaded, setLoaded]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [text, setText]         = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");
  const [, setCount]       = useState(initialCount);
  const commentsById = useRef(new Map<number, Comment>());

  const appendComment = useCallback((comment: Comment) => {
    if (commentsById.current.has(comment.id)) return;
    commentsById.current.set(comment.id, comment);
    setFlat([...commentsById.current.values()]);
    setCount(count => {
      const next = count + 1;
      onCountChange?.(next);
      return next;
    });
  }, [onCountChange]);

  useEffect(() => {
    commentsById.current.clear();
    setFlat([]);
    setLoaded(false);
    setLoading(true);
    commentService.getCommentsByPost(postId)
      .then(data => {
        data.forEach(comment => {
          if (!commentsById.current.has(comment.id)) commentsById.current.set(comment.id, comment);
        });
        const allComments = [...commentsById.current.values()];
        setFlat(allComments);
        setCount(allComments.length);
        onCountChange?.(allComments.length);
        setLoaded(true);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [postId, onCountChange]);

  useEffect(() => {
    joinPost(postId);
    const h = (comment: Comment) => appendComment(comment);
    socket.on("new_comment", h);
    return () => { leavePost(postId); socket.off("new_comment", h); };
  }, [postId, socket, joinPost, leavePost, appendComment]);

  const updateCommentVote = useCallback((commentId: number, voteScore: number, userVote?: 1 | -1 | 0) => {
    const comment = commentsById.current.get(commentId);
    if (comment) {
      const updated = { ...comment, vote_score: voteScore, ...(userVote === undefined ? {} : { user_vote: userVote }) };
      commentsById.current.set(commentId, updated);
      setFlat([...commentsById.current.values()]);
    }
  }, []);

  useEffect(() => {
    const handleVoteUpdate = (event: { postId: number; commentId: number; voteScore: number }) => {
      if (event.postId === postId) updateCommentVote(event.commentId, event.voteScore);
    };
    socket.on("comment_vote_update", handleVoteUpdate);
    return () => { socket.off("comment_vote_update", handleVoteUpdate); };
  }, [postId, socket, updateCommentVote]);

  const addCount = (n: number) => setCount(c => { const next = c + n; onCountChange?.(next); return next; });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setLoginMessage("Sign in or create an account to comment.");
      return;
    }
    if (locked || !text.trim()) return;
    setSubmitting(true);
    try {
      const c = await commentService.createComment({ content: text.trim(), post_id: postId });
      appendComment(c);
      setText("");
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleReplyAdded = (comment: Comment) => appendComment(comment);

  const handleDelete = async (id: number) => {
    try {
      await commentService.deleteComment(id);
      const toRemove = new Set<number>();
      const collect = (cid: number) => { toRemove.add(cid); flat.forEach(c => { if (c.parent_comment_id === cid) collect(c.id); }); };
      collect(id);
      toRemove.forEach(commentId => commentsById.current.delete(commentId));
      setFlat(prev => prev.filter(c => !toRemove.has(c.id)));
      addCount(-toRemove.size);
    } catch (err) { console.error(err); }
  };

  const tree = loaded ? buildTree(flat) : [];

  return (
    <div style={{ borderTop: "1px solid var(--border)" }}>
      {loginMessage && <Login onClose={() => setLoginMessage("")} message={loginMessage} />}
      {locked && <p className="px-4 py-3 text-xs" style={{ color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>This post is locked. New comments are disabled.</p>}
      {!locked && isAuthenticated && (
        <div className="px-3 sm:px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ backgroundColor: "var(--accent)" }}>
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 flex items-center rounded-full px-3 py-2 gap-1" style={{ backgroundColor: "var(--input-bg)" }}>
              <input type="text" placeholder="Add a comment..." value={text} onChange={e => setText(e.target.value)}
                className="bg-transparent outline-none text-sm w-full" style={{ color: "var(--text)" }} />
              <button type="submit" disabled={!text.trim() || submitting}
                className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold disabled:opacity-40 hover:bg-[var(--surface2)]"
                style={{ color: "var(--accent)" }}>
                <Send size={19} /> <span>Send</span>
              </button>
            </div>
          </form>
        </div>
      )}
      {!locked && !isAuthenticated && (
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
              <CommentItem key={node.id} comment={node} postId={postId} readOnly={locked}
                depth={0} onDelete={handleDelete} onReplyAdded={handleReplyAdded} onVoteChanged={updateCommentVote} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default CommentSection;
