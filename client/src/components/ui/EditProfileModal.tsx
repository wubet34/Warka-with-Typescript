import { useState, useRef, useEffect } from "react";
import { X, Camera, UploadCloud } from "lucide-react";
import type { User } from "../../types/index";
import { authService } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { imgUrl } from "../../utils/imageUrl";

interface Props { user: User; onClose: () => void; onSaved: (u: User) => void; }

const EditProfileModal = ({ user, onClose, onSaved }: Props) => {
  const { updateUser } = useAuth();
  const [username, setUsername]     = useState(user.username);
  const [bio, setBio]               = useState(user.bio ?? "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile,  setCoverFile]  = useState<File | null>(null);
  const [avatarPrev, setAvatarPrev] = useState<string | null>(null);
  const [coverPrev,  setCoverPrev]  = useState<string | null>(null);
  const [error, setError]           = useState("");
  const [loading, setLoading]       = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const coverRef  = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (avatarPrev) URL.revokeObjectURL(avatarPrev); }, [avatarPrev]);
  useEffect(() => () => { if (coverPrev) URL.revokeObjectURL(coverPrev); }, [coverPrev]);

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>, kind: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const supported = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!supported.includes(file.type)) {
      setError("Choose a JPG, PNG, GIF, or WEBP image.");
      e.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Images must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }
    setError("");
    const preview = URL.createObjectURL(file);
    if (kind === "avatar") { setAvatarFile(file); setAvatarPrev(preview); }
    else { setCoverFile(file); setCoverPrev(preview); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) { setError("Username is required."); return; }
    setLoading(true); setError("");
    try {
      const updated = await authService.updateProfile({
        username: username.trim() === user.username ? undefined : username.trim(),
        bio: bio.trim(),
        avatar: avatarFile ?? undefined,
        cover: coverFile ?? undefined,
      });
      updateUser(updated); onSaved(updated); onClose();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Failed to update profile.");
    } finally { setLoading(false); }
  };

  const coverSrc  = coverPrev  ?? imgUrl(user.cover_image);
  const avatarSrc = avatarPrev ?? imgUrl(user.profile_image);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor:"rgba(0,0,0,0.6)" }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-lg relative overflow-hidden"
        style={{ backgroundColor:"var(--surface)", border:"1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom:"1px solid var(--border)" }}>
          <h2 className="text-base font-bold" style={{ color:"var(--text)" }}>Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--muted)" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Cover */}
          <button type="button" aria-label="Choose profile cover image" className="group relative block h-32 w-full cursor-pointer text-left"
            onClick={() => coverRef.current?.click()}>
            {coverSrc ? <img src={coverSrc} alt="cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full bg-gradient-to-r from-[#1A4329] to-green-500" />}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="flex items-center gap-2 text-white text-sm font-medium"><UploadCloud size={18}/> Change Cover</span>
            </div>
          </button>
          <input ref={coverRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => pickImage(e, "cover")} className="hidden" />

          {/* Avatar */}
          <div className="-mt-8 mb-3 flex items-end gap-3 px-5">
            <button type="button" aria-label="Choose profile avatar" className="group relative h-16 w-16 shrink-0"
              onClick={() => avatarRef.current?.click()}>
              {avatarSrc
                ? <img src={avatarSrc} className="w-16 h-16 rounded-full border-4 object-cover shadow" style={{ borderColor:"var(--surface)" }} alt="" />
                : <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center text-white text-2xl font-bold shadow"
                    style={{ borderColor:"var(--surface)", backgroundColor:"var(--accent)" }}>{username[0]?.toUpperCase()}</div>}
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={16} className="text-white" />
              </div>
            </button>
            <div className="pb-1">
              <p className="text-sm font-medium" style={{ color:"var(--text)" }}>Profile avatar</p>
              <button type="button" onClick={() => avatarRef.current?.click()} className="text-xs font-semibold hover:underline" style={{ color:"var(--accent)" }}>
                Choose image
              </button>
            </div>
            <input ref={avatarRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={e => pickImage(e, "avatar")} className="hidden" />
          </div>

          <div className="px-5 pb-5 space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color:"var(--text)" }}>Username</label>
              <input value={username} onChange={e => { setUsername(e.target.value); setError(""); }} maxLength={30} placeholder="yourname"
                className="w-full px-4 py-2.5 rounded-xl outline-none text-sm" style={{ backgroundColor:"var(--input-bg)", color:"var(--text)", border:"1px solid var(--border)" }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color:"var(--text)" }}>Bio</label>
              <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={200} placeholder="Tell people about yourself..."
                className="w-full px-4 py-2.5 rounded-xl outline-none text-sm resize-none" style={{ backgroundColor:"var(--input-bg)", color:"var(--text)", border:"1px solid var(--border)" }} />
              <p className="text-xs text-right" style={{ color:"var(--muted)" }}>{bio.length}/200</p>
            </div>
            <p className="text-xs" style={{ color:"var(--muted)" }}>Avatar and cover: JPG, PNG, GIF, or WEBP, up to 5 MB each.</p>
            {error && <p className="text-xs px-3 py-2 rounded-xl" style={{ backgroundColor:"rgba(248,81,73,0.1)", color:"#f85149" }}>{error}</p>}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-full text-sm font-semibold hover:bg-[var(--surface2)] transition-all"
                style={{ border:"1px solid var(--border)", color:"var(--text)" }}>
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-full text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-all"
                style={{ backgroundColor:"var(--accent)" }}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
export default EditProfileModal;
