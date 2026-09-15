// Automatically resolves to the local Wi-Fi IP when accessing from a phone, or localhost when on PC
export const getApiBaseUrl = () => {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.hostname &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return `http://${window.location.hostname}:5000`;
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

