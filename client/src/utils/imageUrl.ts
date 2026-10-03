const API_BASE = (import.meta.env.VITE_API_URL as string ?? "http://localhost:5000/api")
  .replace(/\/+$/, "");
const SERVER_BASE = API_BASE.replace(/\/api$/i, "");

/**
 * Converts a server-stored path like /uploads/abc.jpg to a full URL.
 * Passes through full URLs (http/https) unchanged.
 */
export const imgUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (/^(https?:|data:)/i.test(path)) return path;
  if (path.startsWith("/media/")) return `${API_BASE}${path}`;
  return `${SERVER_BASE}${path}`;
};
