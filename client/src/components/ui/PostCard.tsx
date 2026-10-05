import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowBigUp, ArrowBigDown, Bookmark, Eye, Flag, LockKeyhole, MessageCircle, Pin, Share2, MoreHorizontal, X, ZoomIn, ZoomOut, RotateCcw, Pencil, Trash2 } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import Login from "../Login";
import type { Post } from "../../types/index";
import { voteService } from "../../services/voteService";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { formatDate } from "../../utils/formatDate";
import { imgUrl } from "../../utils/imageUrl";
import CommentSection from "./CommentSection";
import { postService } from "../../services/postService";
import { bookmarkService } from "../../services/bookmarkService";
import { reportService } from "../../services/reportService";
import PollWidget from "./PollWidget";

interface Props {
  post: Post;
  onDelete?: (id: number) => void;
  showComments?: boolean;
  showFullContent?: boolean;
  onBookmarkChange?: (id: number, bookmarked: boolean) => void;
}

const PostCard = ({ post, onDelete, onBookmarkChange, showComments: initOpen = false, showFullContent = false }: Props) => {
  const { user, isAuthenticated } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [voteScore, setVoteScore]     = useState(Number(post.vote_score));
  const [userVote, setUserVote]       = useState<1 | -1 | 0>(post.user_vote ?? 0);
  const [voteBusy, setVoteBusy] = useState(false);
  const [bookmarked, setBookmarked] = useState(Boolean(post.user_bookmarked));
  const [bookmarkBusy, setBookmarkBusy] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(initOpen);
  const [commentCount, setCommentCount] = useState(Number(post.comment_count));
  const [imageOpen, setImageOpen] = useState(false);
  const [imageZoom, setImageZoom] = useState(1);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [shareError, setShareError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content ?? "");
  const [displayTitle, setDisplayTitle] = useState(post.title);
  const [displayContent, setDisplayContent] = useState(post.content ?? "");
  const [editError, setEditError] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [loginMessage, setLoginMessage] = useState("");

  useEffect(() => {
    if (!imageOpen && !shareOpen && !deleteOpen && !menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key === "Escape") setImageOpen(false);
      if (event.key === "Escape") setShareOpen(false);
      if (event.key === "Escape" && !deleteBusy) setDeleteOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [imageOpen, shareOpen, deleteOpen, deleteBusy, menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [menuOpen]);

  const openImage = () => {
    setImageZoom(1);
    setImageOpen(true);
  };

  const handleShare = () => {
    setMenuOpen(false);
    setShareError("");
    setShareOpen(true);
  };

  const confirmDelete = () => {
    setMenuOpen(false);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const postUrl = `${window.location.origin}/post/${post.id}`;
  const canNativeShare = typeof navigator !== "undefined" &&
    typeof (navigator as unknown as { share?: (data?: ShareData) => Promise<void> }).share === "function";
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedTitle = encodeURIComponent(displayTitle);
  const socialLinks = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}` },
    { name: "Telegram", href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  const handleDelete = async () => {
    setDeleteBusy(true);
    setDeleteError("");
    try {
      await onDelete?.(post.id);
      setDeleteOpen(false);
    } catch {
      setDeleteError("Couldn't delete this post. Please try again.");
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleNativeShare = async () => {
    try {
      await navigator.share({ title: displayTitle, url: postUrl });
      setShareOpen(false);
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") setShareError("Couldn't open the share sheet.");
    }
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editTitle.trim()) { setEditError("Title is required."); return; }
    setSavingEdit(true);
    setEditError("");
    try {
      await postService.updatePost(post.id, { title: editTitle.trim(), content: editContent.trim() });
      setDisplayTitle(editTitle.trim());
      setDisplayContent(editContent.trim());
      setEditOpen(false);
    } catch (error) {
      setEditError((error as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't update this post.");
    } finally {
      setSavingEdit(false);
    }
  };

  useEffect(() => {
    const h = ({ postId, voteScore: s }: { postId: number; voteScore: number }) => {
      if (postId === post.id) setVoteScore(s);
    };
    socket.on("vote_update", h);
    return () => { socket.off("vote_update", h); };
  }, [post.id, socket]);

  const handleVote = async (v: 1 | -1) => {
    if (voteBusy) return;
    if (!isAuthenticated) {
      setLoginMessage("Sign in or create an account to vote on posts.");
      return;
    }
    const previousVote = userVote;
    const previousScore = voteScore;
    const nextVote = previousVote === v ? 0 : v;
    setVoteBusy(true);
    setUserVote(nextVote);
    setVoteScore(previousScore + nextVote - previousVote);
    try {
      await voteService.vote(post.id, v);
    } catch (err) {
      setUserVote(previousVote);
      setVoteScore(previousScore);
      console.error(err);
    } finally {
      setVoteBusy(false);
    }
  };

  const handleBookmark = async () => {
    if (!isAuthenticated) {
      setLoginMessage("Sign in or create an account to save posts.");
      return;
    }
    if (bookmarkBusy) return;
    const next = !bookmarked;
    setBookmarked(next);
    setBookmarkBusy(true);
    try {
      if (next) await bookmarkService.add(post.id);
      else await bookmarkService.remove(post.id);
      onBookmarkChange?.(post.id, next);
    } catch (error) {
      setBookmarked(!next);
      console.error(error);
    } finally {
      setBookmarkBusy(false);
    }
  };

  const handleReport = async () => {
    if (!isAuthenticated) { setLoginMessage("Sign in to report a post."); return; }
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason?.trim()) return;
    try { await reportService.reportPost(post.id, reason.trim()); window.alert("Thanks. Your report was sent to moderators."); }
    catch { window.alert("Could not submit the report. Please try again."); }
  };

  const upActive   = userVote === 1;
  const downActive = userVote === -1;

  return (
    <div className="rounded-2xl overflow-hidden transition-colors hover:border-(--accent)/30"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      {loginMessage && <Login onClose={() => setLoginMessage("")} message={loginMessage} />}
      <div className="flex">
        {/* Vote column */}
        <div className="flex flex-col items-center px-2 sm:px-3 py-4 gap-1 shrink-0"
          style={{ backgroundColor: "var(--surface2)" }}>
          <button type="button" disabled={voteBusy} onClick={() => handleVote(1)} aria-label="Upvote post" aria-pressed={upActive}
            className="rounded-full p-1 transition-colors hover:bg-[var(--surface)]"
            style={{ color: upActive ? "var(--accent)" : "var(--muted)" }}>
            <ArrowBigUp size={19} fill={upActive ? "currentColor" : "none"} />
          </button>
          <span className="min-w-4 text-center text-xs font-semibold tabular-nums"
            style={{ color: voteScore > 0 ? "var(--accent)" : voteScore < 0 ? "#f85149" : "var(--muted)" }}>
            {voteScore}
          </span>
          <button type="button" disabled={voteBusy} onClick={() => handleVote(-1)} aria-label="Downvote post" aria-pressed={downActive}
            className="rounded-full p-1 transition-colors hover:bg-[var(--surface)]"
            style={{ color: downActive ? "#f85149" : "var(--muted)" }}>
            <ArrowBigDown size={19} fill={downActive ? "currentColor" : "none"} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0 p-3 sm:p-4">
          {/* Meta */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 flex-wrap text-xs" style={{ color: "var(--muted)" }}>
              {post.community_slug
                ? <NavLink to={`/w/${post.community_slug}`} className="font-semibold hover:underline" style={{ color: "var(--text)" }}>w/{post.community_name}</NavLink>
                : <span className="font-semibold" style={{ color: "var(--text)" }}>w/{post.community_name}</span>}
              <span>•</span>
              <span>by</span>
              {post.user_id
                ? <NavLink to={`/user/${post.user_id}`} className="hover:underline" style={{ color: "var(--muted)" }}>u/{post.username}</NavLink>
                : <span>u/{post.username}</span>}
              <span>•</span>
              <span>{formatDate(post.created_at)}</span>
            </div>
            {user?.id === post.user_id && onDelete && (
              <div className="relative shrink-0" ref={menuRef}>
                <button type="button" onClick={() => setMenuOpen(open => !open)} aria-label="Post options" aria-expanded={menuOpen}
                  className="rounded-lg p-1 hover:bg-(--surface2) transition-colors" style={{ color: "var(--muted)" }}>
                  <MoreHorizontal size={18} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-xl py-1 shadow-xl"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
                    <button type="button" onClick={() => { setEditTitle(displayTitle); setEditContent(displayContent); setEditError(""); setEditOpen(true); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-(--surface2)" style={{ color: "var(--text)" }}>
                      <Pencil size={15} /> Edit
                    </button>
                    <button type="button" onClick={handleShare}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-(--surface2)" style={{ color: "var(--text)" }}>
                      <Share2 size={15} /> Share
                    </button>
                    <button type="button" onClick={confirmDelete}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-500 hover:bg-(--surface2)">
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Title */}
          <h3 onClick={() => navigate(`/post/${post.id}`)}
            className="break-words text-sm font-semibold mb-1.5 leading-snug cursor-pointer hover:text-(--accent) transition-colors"
            style={{ color: "var(--text)" }}>
          {post.post_type && post.post_type !== "discussion" && <span className="mb-2 mr-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: "var(--accent)", backgroundColor: "var(--surface2)" }}>{post.post_type}</span>}
          {post.is_pinned && <span className="mb-2 mr-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: "var(--accent)", backgroundColor: "var(--surface2)" }}><Pin size={11} /> Pinned</span>}
          {post.is_locked && <span className="mb-2 mr-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: "var(--muted)", backgroundColor: "var(--surface2)" }}><LockKeyhole size={11} /> Locked</span>}
          {displayTitle}
          </h3>

          {!!post.tags?.length && <div className="mb-2 flex flex-wrap gap-1.5">{post.tags.map(tag => <NavLink key={tag} to={`/search?q=${encodeURIComponent(`#${tag}`)}`} className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: "var(--accent)", backgroundColor: "var(--surface2)" }}>#{tag}</NavLink>)}</div>}

          {displayContent && (
            <p className={`text-sm mb-3${showFullContent ? " whitespace-pre-wrap wrap-break-word" : " line-clamp-3"}`} style={{ color: "var(--muted)" }}>{displayContent}</p>
          )}

          {post.post_type === "poll" && <PollWidget postId={post.id} />}

          {post.image && (
            <button type="button" onClick={openImage} aria-label={`Open image for ${displayTitle}`}
              className="group relative mb-3 block w-full overflow-hidden rounded-xl border text-left"
              style={{ backgroundColor: "var(--surface2)", borderColor: "var(--border)" }}>
              <img src={imgUrl(post.image)} alt={displayTitle}
                className="mx-auto max-h-[min(70vh,34rem)] w-full object-contain transition-transform duration-200 group-hover:scale-[1.01]" />
              <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold opacity-0 shadow transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                style={{ color: "var(--surface)", backgroundColor: "var(--text)" }}>
                <ZoomIn size={14} /> View image
              </span>
            </button>
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
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-(--accent)"
              style={{ color: "var(--muted)" }}>
              <MessageCircle size={15} /> {commentCount} Comments
            </button>
            <button onClick={handleShare} className="flex items-center gap-1.5 text-xs transition-colors hover:text-(--accent)"
              style={{ color: "var(--muted)" }}>
              <Share2 size={15} /> Share
            </button>
            <button type="button" disabled={bookmarkBusy} onClick={handleBookmark} aria-pressed={bookmarked}
              className="flex items-center gap-1.5 text-xs transition-colors hover:text-(--accent)"
              style={{ color: bookmarked ? "var(--accent)" : "var(--muted)" }}>
              <Bookmark size={15} fill={bookmarked ? "currentColor" : "none"} /> {bookmarked ? "Saved" : "Save"}
            </button>
            <button type="button" onClick={handleReport} className="flex items-center gap-1.5 text-xs transition-colors hover:text-(--accent)" style={{ color: "var(--muted)" }}>
              <Flag size={14} /> Report
            </button>
            {!!post.views && <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}><Eye size={14} /> {Number(post.views).toLocaleString()}</span>}
          </div>
        </div>
      </div>

      {commentsOpen && (
        <CommentSection postId={post.id} initialCount={commentCount} onCountChange={setCommentCount} locked={post.is_locked} />
      )}

      {shareOpen && createPortal(
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
          role="presentation" onClick={() => setShareOpen(false)}>
          <section role="dialog" aria-modal="true" aria-labelledby={`share-title-${post.id}`}
            className="w-full max-w-md rounded-2xl p-5 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
            onClick={event => event.stopPropagation()}>
            <header className="mb-4 flex items-center justify-between">
              <h2 id={`share-title-${post.id}`} className="text-lg font-bold">Share post</h2>
              <button type="button" onClick={() => setShareOpen(false)} aria-label="Close share dialog"
                className="rounded-full p-2 hover:bg-(--surface2)"><X size={18} /></button>
            </header>
            <p className="mb-4 truncate text-sm" style={{ color: "var(--muted)" }}>{displayTitle}</p>
            <div className="grid grid-cols-2 gap-2">
              {socialLinks.map(({ name, href }) => (
                <button key={name} type="button" onClick={() => {
                  window.open(href, "_blank", "noopener,noreferrer");
                  setShareOpen(false);
                }}
                  className="rounded-xl border px-4 py-3 text-center text-sm font-semibold transition-colors hover:bg-(--surface2)"
                  style={{ color: "var(--text)", borderColor: "var(--border)" }}>{name}</button>
              ))}
              {canNativeShare && <button type="button" onClick={handleNativeShare}
                className="col-span-2 rounded-xl px-4 py-3 text-sm font-semibold transition-opacity hover:opacity-80"
                style={{ color: "var(--surface)", backgroundColor: "var(--text)" }}>More apps</button>}
            </div>
            {shareError && <p className="mt-3 text-sm text-red-500">{shareError}</p>}
          </section>
        </div>,
        document.body
      )}

      {deleteOpen && createPortal(
        <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[2px]"
          role="presentation" onClick={() => { if (!deleteBusy) setDeleteOpen(false); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby={`delete-title-${post.id}`}
            className="w-full max-w-sm rounded-2xl p-5 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", color: "var(--text)", border: "1px solid var(--border)" }}
            onClick={event => event.stopPropagation()}>
            <h2 id={`delete-title-${post.id}`} className="text-lg font-bold">Delete post?</h2>
            <p className="mt-2 text-sm" style={{ color: "var(--muted)" }}>This action cannot be undone.</p>
            {deleteError && <p className="mt-3 text-sm text-red-500">{deleteError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" disabled={deleteBusy} onClick={() => setDeleteOpen(false)}
                className="rounded-full border px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ color: "var(--text)", borderColor: "var(--border)" }}>Cancel</button>
              <button type="button" disabled={deleteBusy} onClick={handleDelete}
                className="rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-50"
                style={{ color: "var(--surface)", backgroundColor: "var(--text)" }}>{deleteBusy ? "Deleting…" : "Delete"}</button>
            </div>
          </section>
        </div>,
        document.body
      )}

      {imageOpen && post.image && createPortal(
        <div
          className="fixed inset-0 z-100 flex flex-col items-center justify-center bg-black/95 p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          onClick={() => setImageOpen(false)}
        >
          <div className="mb-3 flex w-full max-w-5xl items-center justify-between" onClick={event => event.stopPropagation()}>
            <p className="min-w-0 truncate pr-3 text-sm font-medium text-white">{displayTitle}</p>
            <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={() => setImageZoom(z => Math.max(0.5, z - 0.25))} aria-label="Zoom out"
              className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"><ZoomOut size={20} /></button>
            <span className="min-w-12 text-center text-sm text-white">{Math.round(imageZoom * 100)}%</span>
            <button type="button" onClick={() => setImageZoom(z => Math.min(3, z + 0.25))} aria-label="Zoom in"
              className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"><ZoomIn size={20} /></button>
            <button type="button" onClick={() => setImageZoom(1)} aria-label="Reset zoom"
              className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"><RotateCcw size={20} /></button>
            <button type="button" onClick={() => setImageOpen(false)} aria-label="Close image viewer"
              className="rounded-lg bg-white/10 p-2 text-white hover:bg-white/20"><X size={20} /></button>
            </div>
          </div>
          <div className="flex min-h-0 w-full max-w-5xl flex-1 items-center justify-center overflow-auto rounded-xl bg-black" onClick={event => event.stopPropagation()}>
            <img
              src={imgUrl(post.image)}
              alt={post.title}
              className="max-h-full max-w-full object-contain transition-transform duration-150"
              style={{ transform: `scale(${imageZoom})` }}
            />
          </div>
        </div>,
        document.body
      )}

      {editOpen && createPortal(
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditOpen(false)}>
          <form onSubmit={handleEditSubmit} onClick={event => event.stopPropagation()}
            className="w-full max-w-lg space-y-3 rounded-2xl p-5 shadow-2xl"
            style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>Edit post</h2>
              <button type="button" onClick={() => setEditOpen(false)} aria-label="Close edit form" style={{ color: "var(--muted)" }}><X size={18} /></button>
            </div>
            <input value={editTitle} onChange={event => setEditTitle(event.target.value)} maxLength={300} aria-label="Post title"
              className="w-full rounded-xl px-3 py-2 text-sm outline-none" style={{ color: "var(--text)", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)" }} />
            <textarea value={editContent} onChange={event => setEditContent(event.target.value)} rows={6} aria-label="Post caption or text"
              className="w-full resize-y rounded-xl px-3 py-2 text-sm outline-none" style={{ color: "var(--text)", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)" }} />
            {editError && <p className="text-sm text-red-500">{editError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditOpen(false)} className="rounded-full px-4 py-2 text-sm" style={{ color: "var(--muted)" }}>Cancel</button>
              <button type="submit" disabled={savingEdit} className="rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: "var(--accent)" }}>{savingEdit ? "Saving…" : "Save changes"}</button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
};
export default PostCard;
