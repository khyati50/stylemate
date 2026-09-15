// Automatically resolves to the current origin (with Vite proxying /api and /uploads to port 5000),
// or the remote tunnel / Wi-Fi IP.
export const getApiBaseUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined" && window.location) {
    // If running in browser or PWA
    if (window.location.protocol.startsWith("http")) {
      return window.location.origin;
    }
    // If running inside Capacitor native container (capacitor://localhost)
    return "http://192.168.1.3:5000";
  }
  return "http://localhost:5000";
};

export const API_BASE_URL = getApiBaseUrl();

export const getImageUrl = (url) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  const base = getApiBaseUrl();
  return `${base}/${url.replace(/^\/+/, "")}`;
};

