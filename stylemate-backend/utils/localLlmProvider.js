/**
 * Local Open-Source LLM Provider for StyleMate
 * ============================================
 * Interfaces with the local Python inference microservice (port 5001).
 * Provides health checking, intent extraction, and stylist response generation.
 */

const LOCAL_LLM_URL = process.env.LOCAL_LLM_URL || "http://localhost:5001";
const HEALTH_TIMEOUT_MS = 1500;
const INFERENCE_TIMEOUT_MS = 3000;

/**
 * Creates a fetch signal with a timeout for node environments.
 */
function getTimeoutSignal(ms) {
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

/**
 * Checks if the local open-source LLM server is up and responsive.
 * @returns {Promise<boolean>}
 */
async function isLocalLlmAvailable() {
  try {
    const url = `${LOCAL_LLM_URL.replace(/\/+$/, "")}/health`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: getTimeoutSignal(HEALTH_TIMEOUT_MS),
    });

    if (!response.ok) return false;
    const data = await response.json();
    return data && (data.status === "ok" || data.status === "healthy");
  } catch (err) {
    // Expected when local server is not running
    return false;
  }
}

/**
 * Calls the local LLM microservice for intent parsing and stylist response.
 * @param {string} queryText - User message text
 * @param {Array} history - Prior conversation turns
 * @returns {Promise<Object|null>} Parsed LLM result or null on failure
 */
async function callLocalLlm(queryText, history = []) {
  try {
    const url = `${LOCAL_LLM_URL.replace(/\/+$/, "")}/api/chat`;
    const startTime = Date.now();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        message: queryText,
        history: history || [],
      }),
      signal: getTimeoutSignal(INFERENCE_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.warn(`[LocalLLM] Server returned HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const latencyMs = Date.now() - startTime;

    return {
      provider: data.provider || "local_open_source",
      model: data.model || "StyleMate-FineTuned-1B",
      latency_ms: data.latency_ms || latencyMs,
      parsed_context: data.parsed_context || {},
      stylist_response: data.stylist_response || null,
    };
  } catch (err) {
    console.warn(`[LocalLLM] Request failed: ${err.message}`);
    return null;
  }
}

module.exports = {
  callLocalLlm,
  isLocalLlmAvailable,
  LOCAL_LLM_URL,
};
