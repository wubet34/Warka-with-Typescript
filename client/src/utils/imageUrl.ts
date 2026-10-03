import { API_BASE_URL, SERVER_BASE_URL } from "./apiUrl";

/**
 * Converts a server-stored media path like /media/1 to a full URL.
 * Passes through full URLs (http/https) and data URLs unchanged.
 */
export const imgUrl = (path: string | null | undefined): string | undefined => {
  if (!path) return undefined;
  if (/^(https?:|data:)/i.test(path)) return path;
  if (path.startsWith("/media/")) return `${API_BASE_URL}${path}`;
  return `${SERVER_BASE_URL}${path}`;
};
