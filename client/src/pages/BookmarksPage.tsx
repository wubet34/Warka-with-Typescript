import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import PostCard from "../components/ui/PostCard";
import { bookmarkService } from "../services/bookmarkService";
import type { Post } from "../types/index";

const BookmarksPage = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    bookmarkService.getBookmarks().then(setPosts).catch(() => setError("Could not load your saved posts." )).finally(() => setLoading(false));
  }, []);
  return <section className="mx-auto max-w-3xl space-y-4">
    <header className="flex items-center gap-3"><Bookmark style={{ color: "var(--accent)" }} /><div><h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Saved posts</h1><p className="text-sm" style={{ color: "var(--muted)" }}>Posts you bookmarked for later.</p></div></header>
    {loading && <p className="text-sm" style={{ color: "var(--muted)" }}>Loading saved posts…</p>}
    {error && <p role="alert" className="rounded-xl p-4 text-sm text-red-500" style={{ backgroundColor: "var(--surface)" }}>{error}</p>}
    {!loading && !error && posts.length === 0 && <p className="rounded-xl p-5 text-sm" style={{ backgroundColor: "var(--surface)", color: "var(--muted)" }}>You haven't saved any posts yet.</p>}
    {posts.map(post => <PostCard key={post.id} post={post} onBookmarkChange={(id, saved) => { if (!saved) setPosts(current => current.filter(item => item.id !== id)); }} />)}
  </section>;
};
export default BookmarksPage;
