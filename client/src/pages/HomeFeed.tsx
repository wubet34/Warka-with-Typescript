import { useState, useEffect, useRef } from "react";
import {
  AlignLeft, Image, Link2, ChevronDown, Loader2, X, UploadCloud,
} from "lucide-react";
import type { Post, Community } from "../types/index";
import { postService } from "../services/postService";
import { communityService } from "../services/communityService";
import { useAuth } from "../context/AuthContext";
import PostCard from "../components/ui/PostCard";

type PostTab = "text" | "image" | "link";

const HomeFeed = () => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<PostTab>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [link, setLink] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCommunity, setSelectedCommunity] = useState<number | "">("");
  const [communities, setCommunities] = useState<Community[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    postService.getFeed()
      .then(setPosts)
      .catch(() => setError("Failed to load posts."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && showForm && communities.length === 0) {
      communityService.getCommunities().then(setCommunities).catch(console.error);
    }
  }, [isAuthenticated, showForm, communities.length]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setLink("");
    clearImage();
    setSelectedCommunity("");
    setFormError("");
    setActiveTab("text");
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim()) { setFormError("Title is required."); return; }
    if (!selectedCommunity) { setFormError("Please select a community."); return; }
    if (activeTab === "text" && !content.trim()) { setFormError("Text content is required."); return; }
    if (activeTab === "image" && !imageFile) { setFormError("Please pick an image."); return; }
    if (activeTab === "link" && !link.trim()) { setFormError("Please enter a link."); return; }

    setSubmitting(true);
    try {
      const newPost = await postService.createPost({
        title: title.trim(),
        content: activeTab === "text" ? content.trim() : undefined,
        community_id: Number(selectedCommunity),
        image: activeTab === "image" ? imageFile! : undefined,
        link: activeTab === "link" ? link.trim() : undefined,
      });
      setPosts((prev) => [newPost as unknown as Post, ...prev]);
      resetForm();
      setShowForm(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to create post.";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      await postService.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const tabs: { key: PostTab; label: string; icon: React.ReactNode }[] = [
    { key: "text",  label: "Text",  icon: <AlignLeft size={15} /> },
    { key: "image", label: "Image", icon: <Image size={15} /> },
    { key: "link",  label: "Link",  icon: <Link2 size={15} /> },
  ];

  return (
    <div className="space-y-4">
      {/* ── Create Post trigger / expanded form ── */}
      {isAuthenticated && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {!showForm ? (
            /* Collapsed trigger row */
            <div className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-full bg-[#1A4329] flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex-1 text-left bg-gray-100 rounded-full px-4 py-2.5 text-sm text-gray-400 hover:bg-gray-200 transition-all"
              >
                Share something...
              </button>
              <button
                onClick={() => { setShowForm(true); setActiveTab("image"); }}
                className="p-2 text-gray-400 hover:text-[#1A4329] transition-colors rounded-lg hover:bg-gray-50"
                title="Add Image"
              >
                <Image size={20} />
              </button>
              <button
                onClick={() => { setShowForm(true); setActiveTab("link"); }}
                className="p-2 text-gray-400 hover:text-[#1A4329] transition-colors rounded-lg hover:bg-gray-50"
                title="Add Link"
              >
                <Link2 size={20} />
              </button>
            </div>
          ) : (
            /* Expanded form */
            <form onSubmit={handleCreatePost}>
              {/* Form header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Create Post</h3>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-4 py-3 space-y-3">
                {/* Community selector */}
                <div className="relative">
                  <select
                    value={selectedCommunity}
                    onChange={(e) =>
                      setSelectedCommunity(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full appearance-none bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A4329] pr-8"
                  >
                    <option value="">Select a community</option>
                    {communities.map((c) => (
                      <option key={c.id} value={c.id}>w/{c.name}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={15}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>

                {/* Title */}
                <input
                  type="text"
                  placeholder="Title *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={300}
                  className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A4329]"
                />

                {/* Tabs */}
                <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition-colors ${
                        activeTab === tab.key
                          ? "bg-[#1A4329] text-white"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {activeTab === "text" && (
                  <textarea
                    placeholder="What's on your mind?"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    className="w-full bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1A4329] resize-none"
                  />
                )}

                {activeTab === "image" && (
                  <div>
                    {imagePreview ? (
                      /* Preview */
                      <div className="relative rounded-xl overflow-hidden border border-gray-200">
                        <img
                          src={imagePreview}
                          alt="preview"
                          className="w-full max-h-64 object-contain bg-gray-50"
                        />
                        <button
                          type="button"
                          onClick={clearImage}
                          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      /* Drop zone */
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center gap-2 text-gray-400 hover:border-[#1A4329] hover:text-[#1A4329] transition-colors"
                      >
                        <UploadCloud size={28} />
                        <span className="text-sm font-medium">Click to upload image</span>
                        <span className="text-xs">JPG, PNG, GIF, WEBP — max 5 MB</span>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImagePick}
                      className="hidden"
                    />
                    {/* Optional caption */}
                    <input
                      type="text"
                      placeholder="Caption (optional)"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="mt-2 w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A4329]"
                    />
                  </div>
                )}

                {activeTab === "link" && (
                  <div className="space-y-2">
                    <div className="flex items-center bg-gray-100 rounded-xl px-4 py-2.5 gap-2 focus-within:ring-2 focus-within:ring-[#1A4329]">
                      <Link2 size={15} className="text-gray-400 shrink-0" />
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="bg-transparent outline-none text-sm w-full"
                      />
                    </div>
                    <textarea
                      placeholder="Description (optional)"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#1A4329] resize-none"
                    />
                  </div>
                )}

                {/* Error */}
                {formError && (
                  <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                    {formError}
                  </p>
                )}

                {/* Submit row */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400">
                    {activeTab === "text" && `${content.length} chars`}
                    {activeTab === "image" && imageFile && imageFile.name}
                    {activeTab === "link" && link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="text-[#1A4329] hover:underline truncate max-w-[200px] block">
                        {link}
                      </a>
                    )}
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-[#1A4329] text-white rounded-full text-sm font-semibold hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {submitting && <Loader2 size={14} className="animate-spin" />}
                    Post
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Feed ── */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-[#1A4329]" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-sm text-red-500">{error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">
          No posts yet. Be the first!
        </div>
      ) : (
        posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
        ))
      )}
    </div>
  );
};

export default HomeFeed;
