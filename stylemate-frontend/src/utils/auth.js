/**
 * Checks whether a JWT token is present and not expired.
 * @param {string|null} token
 * @returns {boolean}
 */
export function isTokenValid(token) {
  if (!token) return false;
  try {
    const rawToken = token.startsWith("Bearer ")
      ? token.slice(7).trim()
      : token.trim();
    const parts = rawToken.split(".");
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem("token");
      return false;
    }
    return true;
  } catch {
    localStorage.removeItem("token");
    return false;
  }
}
