import { useState } from "react";
import { X, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { communityService } from "../../services/communityService";

interface Props { onClose: () => void; }

const CreateCommunityModal = ({ onClose }: Props) => {
  const navigate = useNavigate();
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Name is required."); return; }
    if (name.trim().length < 3) { setError("At least 3 characters."); return; }
    setLoading(true); setError("");
    try {
      const c = await communityService.createCommunity({ name: name.trim(), description: desc.trim() || undefined });
      onClose(); navigate(`/w/${c.slug}`);
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to create community.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor:"rgba(0,0,0,0.6)" }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md" style={{ backgroundColor:"var(--surface)", border:"1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:"1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Users size={17} style={{ color:"var(--accent)" }} />
            <h2 className="text-base font-bold" style={{ color:"var(--text)" }}>Create a Community</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--muted)" }}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color:"var(--text)" }}>Community Name *</label>
            <input value={name} onChange={e => { setName(e.target.value); setError(""); }} maxLength={50} placeholder="e.g. programming, photography"
              className="w-full px-4 py-2.5 rounded-xl outline-none text-sm" style={{ backgroundColor:"var(--input-bg)", color:"var(--text)", border:"1px solid var(--border)" }} />
            <p className="mt-1 text-xs" style={{ color:"var(--muted)" }}>Name cannot be changed later.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color:"var(--text)" }}>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} maxLength={300} placeholder="What is this community about?"
              className="w-full px-4 py-2.5 rounded-xl outline-none text-sm resize-none" style={{ backgroundColor:"var(--input-bg)", color:"var(--text)", border:"1px solid var(--border)" }} />
            <p className="text-xs text-right" style={{ color:"var(--muted)" }}>{desc.length}/300</p>
          </div>
          {error && <p className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor:"rgba(248,81,73,0.1)", color:"#f85149" }}>{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full text-sm font-semibold hover:bg-[var(--surface2)] transition-all"
              style={{ border:"1px solid var(--border)", color:"var(--text)" }}>Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-all"
              style={{ backgroundColor:"var(--accent)" }}>{loading ? "Creating..." : "Create Community"}</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateCommunityModal;
