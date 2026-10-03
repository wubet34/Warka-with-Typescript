import { useState, useEffect, useRef } from "react";
import { AlignLeft, Image, Link2, ChevronDown, X, UploadCloud, Loader2 } from "lucide-react";
import type { Community, Post } from "../../types/index";
import { postService } from "../../services/postService";
import { communityService } from "../../services/communityService";
import { useAuth } from "../../context/AuthContext";
import { imgUrl } from "../../utils/imageUrl";

type PostTab = "text" | "image" | "link";

const TABS: { key: PostTab; label: string; icon: React.ReactNode }[] = [
  { key: "text",  label: "Text",  icon: <AlignLeft size={14} /> },
  { key: "image", label: "Image", icon: <Image size={14} /> },
  { key: "link",  label: "Link",  icon: <Link2 size={14} /> },
];

interface Props {
  onPostCreated: (post: Post) => void;
  defaultCommunityId?: number;
}

const CreatePostForm = ({ onPostCreated, defaultCommunityId }: Props) => {
  const { user, isAuthenticated } = useAuth();
  const [expanded,      setExpanded]      = useState(false);
  const [tab,           setTab]           = useState<PostTab>("text");
  const [title,         setTitle]         = useState("");
  const [content,       setContent]       = useState("");
  const [link,          setLink]          = useState("");
  const [imageFile,     setImageFile]     = useState<File | null>(null);
  const [imagePreview,  setImagePreview]  = useState<string | null>(null);
  const [communityId,   setCommunityId]   = useState<number | "">(defaultCommunityId ?? "");
  const [communities,   setCommunities]   = useState<Community[]>([]);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (expanded && communities.length === 0)
      communityService.getCommunities().then(setCommunities).catch(console.error);
  }, [expanded, communities.length]);

  const reset = () => {
    setTitle(""); setContent(""); setLink("");
    setImageFile(null); setImagePreview(null);
    setCommunityId(defaultCommunityId ?? "");
    setError(""); setTab("text"); setExpanded(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!title.trim())                      { setError("Title is required."); return; }
    if (!communityId)                       { setError("Select a community."); return; }
    if (tab === "text"  && !content.trim()) { setError("Add some text content."); return; }
    if (tab === "image" && !imageFile)      { setError("Pick an image."); return; }
    if (tab === "link"  && !link.trim())    { setError("Enter a URL."); return; }
    setSubmitting(true);
    try {
      const post = await postService.createPost({
        title: title.trim(),
        community_id: Number(communityId),
        // Keep captions and link descriptions; the content field is shared by all tabs.
        content: content.trim() || undefined,
        image:    tab === "image" ? imageFile!      : undefined,
        link:     tab === "link"  ? link.trim()     : undefined,
      });
      onPostCreated(post as unknown as Post);
      reset();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create post.");
    } finally { setSubmitting(false); }
  };

  if (!isAuthenticated) return null;

  const avatarSrc = imgUrl(user?.profile_image);

  /* ── shared input style ── */
  const inp = { backgroundColor: "var(--input-bg)", color: "var(--text)", border: "1px solid var(--border)" };

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      {!expanded ? (
        /* Collapsed */
        <div className="flex items-center gap-3 p-3 sm:p-4">
          {/* Avatar */}
          {avatarSrc
            ? <img src={avatarSrc} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
            : <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: "var(--accent)" }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>}
          <button onClick={() => setExpanded(true)}
            className="flex-1 text-left rounded-full px-4 py-2.5 text-sm transition-all"
            style={{ backgroundColor: "var(--input-bg)", color: "var(--muted)" }}>
            Share something...
          </button>
          <button onClick={() => { setExpanded(true); setTab("image"); }}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--surface2)]"
            style={{ color: "var(--muted)" }} title="Upload image">
            <Image size={18} />
          </button>
          <button onClick={() => { setExpanded(true); setTab("link"); }}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--surface2)]"
            style={{ color: "var(--muted)" }} title="Share a link">
            <Link2 size={18} />
          </button>
        </div>
      ) : (
        /* Expanded */
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3"
            style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Create Post</h3>
            <button type="button" onClick={reset}
              className="p-1 rounded-lg transition-colors hover:bg-[var(--surface2)]"
              style={{ color: "var(--muted)" }}>
              <X size={16} />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* Community selector */}
            {!defaultCommunityId && (
              <div className="relative">
                <select value={communityId}
                  onChange={e => setCommunityId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full appearance-none rounded-xl px-4 py-2.5 text-sm outline-none pr-8"
                  style={{ ...inp }}>
                  <option value="">Select a community</option>
                  {communities.map(c => <option key={c.id} value={c.id}>w/{c.name}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted)" }} />
              </div>
            )}

            {/* Title */}
            <input placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} maxLength={300}
              className="w-full rounded-xl px-4 py-2.5 text-sm outline-none"
              style={{ ...inp }} />

            {/* Tabs */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {TABS.map(t => (
                <button key={t.key} type="button" onClick={() => setTab(t.key)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors"
                  style={tab === t.key
                    ? { backgroundColor: "var(--accent)", color: "#fff" }
                    : { backgroundColor: "var(--surface)", color: "var(--muted)" }}>
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Text */}
            {tab === "text" && (
              <textarea placeholder="What's on your mind?" value={content} onChange={e => setContent(e.target.value)} rows={5}
                className="w-full rounded-xl px-4 py-3 text-sm outline-none resize-none"
                style={{ ...inp }} />
            )}

            {/* Image */}
            {tab === "image" && (
              <div className="space-y-2">
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    <img src={imagePreview} alt="preview" className="w-full max-h-64 object-contain"
                      style={{ backgroundColor: "var(--surface2)" }} />
                    <button type="button"
                      onClick={() => { setImageFile(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80">
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full rounded-xl py-10 flex flex-col items-center gap-2 transition-colors hover:opacity-80"
                    style={{ border: "2px dashed var(--border)", color: "var(--muted)" }}>
                    <UploadCloud size={26} />
                    <span className="text-sm font-medium">Click to upload image</span>
                    <span className="text-xs">JPG, PNG, GIF, WEBP — max 5 MB</span>
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleImagePick} className="hidden" />
                <input placeholder="Caption (optional)" value={content} onChange={e => setContent(e.target.value)}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={{ ...inp }} />
              </div>
            )}

            {/* Link */}
            {tab === "link" && (
              <div className="space-y-2">
                <div className="flex items-center rounded-xl px-4 py-2.5 gap-2" style={{ ...inp }}>
                  <Link2 size={14} style={{ color: "var(--muted)" }} className="shrink-0" />
                  <input type="url" placeholder="https://example.com" value={link}
                    onChange={e => setLink(e.target.value)}
                    className="bg-transparent outline-none text-sm w-full" style={{ color: "var(--text)" }} />
                </div>
                <textarea placeholder="Description (optional)" value={content}
                  onChange={e => setContent(e.target.value)} rows={3}
                  className="w-full rounded-xl px-4 py-2.5 text-sm outline-none resize-none" style={{ ...inp }} />
              </div>
            )}

            {error && (
              <p className="text-xs px-3 py-2 rounded-lg"
                style={{ backgroundColor: "rgba(248,81,73,0.1)", color: "#f85149" }}>
                {error}
              </p>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs truncate max-w-[60%]" style={{ color: "var(--muted)" }}>
                {tab === "text"  && `${content.length} chars`}
                {tab === "image" && imageFile?.name}
                {tab === "link"  && link}
              </span>
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-all"
                style={{ backgroundColor: "var(--accent)" }}>
                {submitting && <Loader2 size={14} className="animate-spin" />}
                Post
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
export default CreatePostForm;
