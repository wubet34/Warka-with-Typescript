import { useState } from "react";
import {
  ChevronUp, ChevronDown, MessageCircle, Share,
  MoreHorizontal, Send, Trash2, CornerDownRight,
  ChevronDown as CollapseIcon,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import type { Post, Comment } from "../../types/index";
import { commentService } from "../../services/commentService";
import { voteService } from "../../services/voteService";
import { useAuth } from "../../context/AuthContext";
import { formatDate } from "../../utils/formatDate";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CommentNode extends Comment {
  children: CommentNode[];
}

// Build tree from flat list
function buildTree(flat: Comment[]): CommentNode[] {
  const map = new Map<number, CommentNode>();
  const roots: CommentNode[] = [];

  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));

  flat.forEach((c) => {
    const node = map.get(c.id)!;
    if (c.parent_comment_id && map.has(c.parent_comment_id)) {
      map.get(c.parent_comment_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

// ─── Single Comment Node ─────────────────────────────────────────────────────

interface CommentItemProps {
  comment: CommentNode;
  postId: number;
  depth: number;
  onDelete: (id: number, parentId?: number) => void;
  onReplyAdded: (comment: Comment) => void;
}

const CommentItem = ({
  comment,
  postId,
  depth,
  onDelete,
  onReplyAdded,
}: CommentItemProps) => {
  const { user, isAuthenticated } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const newComment = await commentService.createComment({
        content: replyText.trim(),
        post_id: postId,
        parent_comment_id: comment.id,
      });
      onReplyAdded(newComment);
      setReplyText("");
      setShowReplyBox(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Left border color by depth
  const depthColors = [
    "border-gray-200",
    "border-blue-200",
    "border-green-200",
    "border-yellow-200",
    "border-pink-200",
    "border-purple-200",
  ];
  const borderColor = depthColors[Math.min(depth, depthColors.length - 1)];

  return (
    <div className={`${depth > 0 ? `ml-3 sm:ml-5 pl-3 border-l-2 ${borderColor}` : ""}`}>
      <div className="group">
        {/* Comment header */}
        <div className="flex items-start gap-2 pt-2">
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0 flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">
            {comment.username?.[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            {/* Meta row */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <NavLink
                to={`/user/${comment.user_id}`}
                className="text-xs font-semibold text-gray-800 hover:underline"
              >
                {comment.username}
              </NavLink>
              <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>

              {/* Collapse toggle when has children */}
              {comment.children.length > 0 && (
                <button
                  onClick={() => setCollapsed(!collapsed)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5 ml-1"
                >
                  <CollapseIcon
                    size={12}
                    className={`transition-transform ${collapsed ? "-rotate-90" : ""}`}
                  />
                  {collapsed ? `${comment.children.length} repl${comment.children.length === 1 ? "y" : "ies"}` : ""}
                </button>
              )}
            </div>

            {/* Content */}
            {!collapsed && (
              <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{comment.content}</p>
            )}

            {/* Actions */}
            {!collapsed && (
              <div className="flex items-center gap-3 mt-1">
                {isAuthenticated && (
                  <button
                    onClick={() => setShowReplyBox(!showReplyBox)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1A4329] transition-colors"
                  >
                    <CornerDownRight size={12} />
                    Reply
                  </button>
                )}
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => onDelete(comment.id, comment.parent_comment_id ?? undefined)}
                    className="flex items-center gap-1 text-xs text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                )}
              </div>
            )}

            {/* Reply input */}
            {showReplyBox && !collapsed && (
              <form onSubmit={handleReply} className="mt-2 flex items-center gap-2">
                <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-1.5">
                  <input
                    autoFocus
                    type="text"
                    placeholder={`Reply to ${comment.username}...`}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="bg-transparent outline-none text-xs w-full"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || submitting}
                    className="text-[#1A4329] disabled:opacity-40 ml-1"
                  >
                    <Send size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReplyBox(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {!collapsed && comment.children.length > 0 && (
        <div className="mt-1">
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              postId={postId}
              depth={depth + 1}
              onDelete={onDelete}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PostCard ─────────────────────────────────────────────────────────────────

interface Props {
  post: Post;
  onDelete?: (id: number) => void;
}

const PostCard = ({ post, onDelete }: Props) => {
  const { user, isAuthenticated } = useAuth();
  const [voteScore, setVoteScore] = useState(post.vote_score);
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0);
  const [showComments, setShowComments] = useState(false);
  const [flatComments, setFlatComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [commentCount, setCommentCount] = useState(Number(post.comment_count));
  const [submitting, setSubmitting] = useState(false);

  const handleVote = async (v: 1 | -1) => {
    if (!isAuthenticated) return;
    try {
      await voteService.vote(post.id, v);
      if (userVote === v) {
        setVoteScore((s) => s - v);
        setUserVote(0);
      } else {
        setVoteScore((s) => s + v - userVote);
        setUserVote(v);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleComments = async () => {
    if (!showComments && !commentsLoaded) {
      try {
        const data = await commentService.getCommentsByPost(post.id);
        setFlatComments(data);
        setCommentsLoaded(true);
      } catch (err) {
        console.error(err);
      }
    }
    setShowComments((v) => !v);
  };

  // Top-level comment submit
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;
    setSubmitting(true);
    try {
      const newComment = await commentService.createComment({
        content: commentText.trim(),
        post_id: post.id,
      });
      setFlatComments((prev) => [...prev, newComment]);
      setCommentCount((c) => c + 1);
      setCommentText("");
      setShowComments(true);
      setCommentsLoaded(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Called when a reply is added from any depth
  const handleReplyAdded = (newComment: Comment) => {
    setFlatComments((prev) => [...prev, newComment]);
    setCommentCount((c) => c + 1);
    setShowComments(true);
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await commentService.deleteComment(commentId);
      // Remove the comment and all its descendants
      const idsToRemove = new Set<number>();
      const collect = (id: number) => {
        idsToRemove.add(id);
        flatComments.forEach((c) => {
          if (c.parent_comment_id === id) collect(c.id);
        });
      };
      collect(commentId);
      setFlatComments((prev) => prev.filter((c) => !idsToRemove.has(c.id)));
      setCommentCount((c) => Math.max(0, c - idsToRemove.size));
    } catch (err) {
      console.error(err);
    }
  };

  const commentTree = buildTree(flatComments);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Vote sidebar + Post body */}
      <div className="flex">
        {/* Vote column */}
        <div className="flex flex-col items-center px-2 sm:px-3 py-4 gap-1 bg-gray-50 shrink-0">
          <button
            onClick={() => handleVote(1)}
            className={`p-1 rounded transition-colors ${
              userVote === 1 ? "text-[#1A4329]" : "text-gray-400 hover:text-[#1A4329]"
            }`}
          >
            <ChevronUp size={18} />
          </button>
          <span
            className={`text-xs font-bold ${
              voteScore > 0 ? "text-[#1A4329]" : voteScore < 0 ? "text-red-500" : "text-gray-500"
            }`}
          >
            {voteScore}
          </span>
          <button
            onClick={() => handleVote(-1)}
            className={`p-1 rounded transition-colors ${
              userVote === -1 ? "text-red-500" : "text-gray-400 hover:text-red-500"
            }`}
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {/* Post body */}
        <div className="flex-1 min-w-0 p-3 sm:p-4">
          {/* Meta */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500">
              <NavLink
                to={`/w/${post.community_slug}`}
                className="font-semibold text-gray-800 hover:underline"
              >
                w/{post.community_name}
              </NavLink>
              <span>•</span>
              <span>by</span>
              <NavLink to={`/user/${post.user_id}`} className="hover:underline">
                u/{post.username}
              </NavLink>
              <span>•</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
            {user?.id === post.user_id && onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 mb-1.5 leading-snug">
            {post.title}
          </h3>

          {/* Content */}
          {post.content && (
            <p className="text-sm text-gray-600 line-clamp-3 mb-3">{post.content}</p>
          )}

          {/* Image */}
          {post.image && (
            <div className="mb-3 rounded-xl overflow-hidden">
              <img
                src={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${post.image}`}
                alt=""
                className="w-full object-cover max-h-72"
              />
            </div>
          )}

          {/* Link card */}
          {post.link && (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-3 flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1A4329]/10 flex items-center justify-center shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#1A4329]">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
              </div>
              <span className="text-xs text-[#1A4329] font-medium truncate group-hover:underline">
                {post.link}
              </span>
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleToggleComments}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1A4329] transition-colors"
            >
              <MessageCircle size={15} />
              <span>{commentCount} Comments</span>
            </button>
            <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1A4329] transition-colors">
              <Share size={15} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top-level comment input */}
      {isAuthenticated && (
        <div className="px-3 sm:px-4 pb-3 pt-2 border-t border-gray-50">
          <form onSubmit={handleAddComment} className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#1A4329] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="bg-transparent outline-none text-sm w-full"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || submitting}
                className="text-[#1A4329] disabled:opacity-40 ml-1"
              >
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comments tree */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50 px-3 sm:px-4 py-3">
          {flatComments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">
              No comments yet. Be the first!
            </p>
          ) : (
            <div className="space-y-1">
              {commentTree.map((node) => (
                <CommentItem
                  key={node.id}
                  comment={node}
                  postId={post.id}
                  depth={0}
                  onDelete={handleDeleteComment}
                  onReplyAdded={handleReplyAdded}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostCard;
