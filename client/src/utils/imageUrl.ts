// Derive the server base from the API URL (strips /api suffix)
const SERVER_BASE = (import.meta.env.VITE_API_URL as string ?? "http://localhost:5000/api")
  .replace(/\/api\/?$/, "");

/**
 * Converts a server-stored path like /uploads/abc.jpg to a full URL.
 * Passes through full URLs (http/https) unchanged.
 */
export const imgUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${SERVER_BASE}${path}`;
};
