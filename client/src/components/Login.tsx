import { useState } from "react";
import { LogIn, UserPlus, X, Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Props { onClose: () => void; defaultMode?: "login" | "register"; }

const Login = ({ onClose, defaultMode = "login" }: Props) => {
  const { login, register } = useAuth();
  const [mode, setMode]               = useState<"login"|"register">(defaultMode);
  const [form, setForm]               = useState({ username:"", email:"", password:"" });
  const [showPass, setShowPass]       = useState(false);
  const [error, setError]             = useState("");
  const [success, setSuccess]         = useState("");
  const [loading, setLoading]         = useState(false);

  const switchMode = (m: "login"|"register") => { setMode(m); setError(""); setSuccess(""); setForm({ username:"", email:"", password:"" }); setShowPass(false); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { setForm(p => ({ ...p, [e.target.name]: e.target.value })); setError(""); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setSuccess("");
    try {
      if (mode === "login") { await login(form.email, form.password); onClose(); }
      else { await register(form.username, form.email, form.password); setSuccess("Account created! Please sign in."); switchMode("login"); }
    } catch (err: unknown) {
      setError((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  const s = { backgroundColor:"var(--surface)", border:"1px solid var(--border)" };
  const inp = "w-full pl-10 pr-4 py-2.5 rounded-xl outline-none text-sm transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor:"rgba(0,0,0,0.6)" }}>
      <div className="rounded-2xl shadow-2xl w-full max-w-md relative" style={s}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-[var(--surface2)] transition-colors" style={{ color:"var(--muted)" }}>
          <X size={18} />
        </button>

        <div className="px-6 pt-8 pb-4">
          <h1 className="text-2xl font-bold mb-1" style={{ color:"var(--accent)" }}>Warka</h1>
          <h2 className="text-lg font-semibold" style={{ color:"var(--text)" }}>
            {mode === "login" ? "Welcome back" : "Create an account"}
          </h2>
          <p className="text-sm mt-1" style={{ color:"var(--muted)" }}>
            {mode === "login" ? "Sign in to continue" : "Join the Warka community"}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex mx-6 mb-5 p-1 rounded-xl" style={{ backgroundColor:"var(--surface2)" }}>
          {(["login","register"] as const).map(m => (
            <button key={m} type="button" onClick={() => switchMode(m)}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${mode === m ? "shadow-sm" : "opacity-60 hover:opacity-80"}`}
              style={mode === m ? { backgroundColor:"var(--surface)", color:"var(--accent)" } : { color:"var(--muted)" }}>
              {m === "login" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color:"var(--text)" }}>Username</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:"var(--muted)" }} />
                <input name="username" value={form.username} onChange={handleChange} required autoComplete="username" placeholder="yourname"
                  className={inp} style={{ backgroundColor:"var(--input-bg)", color:"var(--text)" }} />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color:"var(--text)" }}>Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:"var(--muted)" }} />
              <input name="email" type="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="you@example.com"
                className={inp} style={{ backgroundColor:"var(--input-bg)", color:"var(--text)" }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color:"var(--text)" }}>Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color:"var(--muted)" }} />
              <input name="password" type={showPass ? "text" : "password"} value={form.password} onChange={handleChange} required
                autoComplete={mode === "login" ? "current-password" : "new-password"} placeholder="••••••••"
                className={`${inp} pr-11`} style={{ backgroundColor:"var(--input-bg)", color:"var(--text)" }} />
              <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 hover:opacity-80" style={{ color:"var(--muted)" }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {mode === "register" && <p className="mt-1 text-xs" style={{ color:"var(--muted)" }}>At least 6 characters</p>}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-sm px-3 py-2.5 rounded-xl" style={{ backgroundColor:"rgba(248,81,73,0.1)", color:"#f85149" }}>
              <X size={14} className="shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {success && (
            <div className="text-sm px-3 py-2.5 rounded-xl" style={{ backgroundColor:"rgba(46,160,67,0.1)", color:"var(--accent)" }}>
              {success}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60 transition-all flex items-center justify-center gap-2 mt-1"
            style={{ backgroundColor:"var(--accent)" }}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Please wait...
              </span>
            ) : (
              <>{mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}{mode === "login" ? "Sign In" : "Create Account"}</>
            )}
          </button>

          <p className="text-xs text-center pt-1" style={{ color:"var(--muted)" }}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")}
              className="font-semibold hover:underline" style={{ color:"var(--accent)" }}>
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
export default Login;
