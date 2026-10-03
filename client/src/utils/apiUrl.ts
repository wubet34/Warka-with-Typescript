const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

// Keep the deployed app usable when Vercel is missing VITE_API_URL, while
// allowing an explicit API URL to override this Render service default.
export const API_BASE_URL = (
  configuredApiUrl ||
  (import.meta.env.PROD
    ? "https://warka-my9n.onrender.com/api"
    : "http://localhost:5000/api")
).replace(/\/+$/, "");

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api$/i, "");
