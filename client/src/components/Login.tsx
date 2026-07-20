import { useState } from "react";
import { LogIn, UserPlus, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface Props {
  onClose: () => void;
}

const Login = ({ onClose }: Props) => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        onClose();
      } else {
        await register(form.username, form.email, form.password);
        setMode("login");
        setForm({ username: "", email: "", password: "" });
      }
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-[#1A4329] mb-1">
          {mode === "login" ? "Sign in to Warka" : "Create your account"}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {mode === "login"
            ? "Welcome back!"
            : "Join thousands of creators on Warka."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-sm font-medium text-gray-700">Username</label>
              <input
                name="username"
                value={form.username}
                onChange={handleChange}
                required
                placeholder="yourname"
                className="mt-1 w-full px-4 py-2.5 bg-gray-100 rounded-xl outline-none text-sm focus:ring-2 focus:ring-[#1A4329]"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="you@example.com"
              className="mt-1 w-full px-4 py-2.5 bg-gray-100 rounded-xl outline-none text-sm focus:ring-2 focus:ring-[#1A4329]"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="mt-1 w-full px-4 py-2.5 bg-gray-100 rounded-xl outline-none text-sm focus:ring-2 focus:ring-[#1A4329]"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#1A4329] text-white rounded-xl text-sm font-semibold hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {mode === "login" ? <LogIn size={16} /> : <UserPlus size={16} />}
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="text-[#1A4329] font-semibold hover:underline"
          >
            {mode === "login" ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
