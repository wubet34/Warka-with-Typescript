import type { SearchResults } from "../../services/searchService";
import { imgUrl } from "../../utils/imageUrl";

interface Props {
  query: string;
  results: SearchResults | null;
  loading: boolean;
  onSelect: (path: string) => void;
}

export default function SearchSuggestions({ query, results, loading, onSelect }: Props) {
  if (!query.trim()) return null;
  const hasResults = !!results && (results.posts.length + results.users.length + results.communities.length > 0);
  return (
    <div className="absolute top-full left-0 mt-2 w-[min(90vw,20rem)] lg:w-80 rounded-xl shadow-2xl z-[60] overflow-hidden"
      style={{ backgroundColor:"var(--surface)", border:"1px solid var(--border)" }}>
      {loading && <p className="px-3 py-3 text-sm" style={{ color:"var(--muted)" }}>Searching…</p>}
      {!loading && results?.communities.length ? <section>
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color:"var(--muted)", borderBottom:"1px solid var(--border)" }}>Communities</p>
        {results.communities.slice(0,3).map(c => <button key={c.id} onClick={() => onSelect(`/w/${c.slug}`)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--surface2)]">
          <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor:"var(--accent)" }}>{c.name[0]?.toUpperCase()}</span>
          <span className="min-w-0"><span className="block text-sm font-medium truncate" style={{ color:"var(--text)" }}>w/{c.name}</span><span className="block text-xs" style={{ color:"var(--muted)" }}>{c.member_count?.toLocaleString()} members</span></span>
        </button>)}
      </section> : null}
      {!loading && results?.users.length ? <section>
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color:"var(--muted)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>People</p>
        {results.users.slice(0,3).map(u => <button key={u.id} onClick={() => onSelect(`/user/${u.id}`)} className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-[var(--surface2)]">
          {u.profile_image ? <img src={imgUrl(u.profile_image)} className="w-7 h-7 rounded-full object-cover" alt="" /> : <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor:"var(--accent)" }}>{u.username[0]?.toUpperCase()}</span>}
          <span className="text-sm font-medium truncate" style={{ color:"var(--text)" }}>{u.username}</span>
        </button>)}
      </section> : null}
      {!loading && results?.posts.length ? <section>
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color:"var(--muted)", borderTop:"1px solid var(--border)", borderBottom:"1px solid var(--border)" }}>Posts</p>
        {results.posts.slice(0,3).map(p => <button key={p.id} onClick={() => onSelect(`/post/${p.id}`)} className="w-full px-3 py-2.5 text-left hover:bg-[var(--surface2)]">
          <span className="block text-sm font-medium truncate" style={{ color:"var(--text)" }}>{p.title}</span><span className="text-xs" style={{ color:"var(--muted)" }}>w/{p.community_name}</span>
        </button>)}
      </section> : null}
      {!loading && results && !hasResults && <p className="px-3 py-4 text-sm text-center" style={{ color:"var(--muted)" }}>No results for “{query}”</p>}
      {!loading && hasResults && <button onClick={() => onSelect(`/search?q=${encodeURIComponent(query.trim())}`)} className="w-full px-3 py-2.5 text-xs font-semibold text-center hover:bg-[var(--surface2)]" style={{ color:"var(--accent)", borderTop:"1px solid var(--border)" }}>See all results for “{query}”</button>}
      {!loading && !results && <p className="px-3 py-3 text-sm" style={{ color:"var(--muted)" }}>Search unavailable. Try again.</p>}
    </div>
  );
}
