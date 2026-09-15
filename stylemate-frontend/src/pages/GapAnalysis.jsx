import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart2, RefreshCw } from "lucide-react";
import AuthNavbar from "../components/AuthNavbar";
import Toast from "../components/Toast";

// ---------------------------------------------------------------------------
// Health score helpers
// ---------------------------------------------------------------------------

function computeHealthScore(analysis) {
  const okSlots = analysis.slot_coverage.filter((s) => s.severity === "ok").length;
  const slot_score = (okSlots / 6) * 50;

  const totalOccasions = analysis.total_occasions || 0;
  const goodOccasions = totalOccasions - (analysis.occasion_gaps || []).length;
  const occasion_score = totalOccasions > 0
    ? (goodOccasions / totalOccasions) * 30
    : 30; // no occasions = no gaps

  const totalItems = analysis.total_items || 0;
  const lowVersatilityCount = (analysis.low_versatility_items || []).length;
  const goodItems = totalItems - lowVersatilityCount;
  const versatility_score = totalItems > 0
    ? (goodItems / totalItems) * 20
    : 20;

  return Math.round(Math.min(100, slot_score + occasion_score + versatility_score));
}

function healthLabel(score) {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Needs Work";
  return "Significant Gaps";
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const readableSlotName = {
  upper_body: "Tops",
  lower_body: "Bottoms",
  full_body: "Full Body",
  footwear: "Footwear",
  outerwear: "Outerwear",
  accessories: "Accessories",
};

const severityColor = {
  ok: {
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-700",
    dot: "bg-green-500",
    label: "Well Stocked",
  },
  weak: {
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-500",
    label: "Low Stock",
  },
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    dot: "bg-red-500",
    label: "Missing",
  },
};

// ---------------------------------------------------------------------------
// GapAnalysis page
// ---------------------------------------------------------------------------

function GapAnalysis() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null); // { message, variant }
  const [showLowVersatility, setShowLowVersatility] = useState(false);

  const navigate = useNavigate();

  const showToast = (message, variant = "success") => {
    setToast({ message, variant });
  };

  async function fetchAnalysis(forceRefresh = false) {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const url = forceRefresh
        ? "http://localhost:5000/api/gap-analysis?refresh=true"
        : "http://localhost:5000/api/gap-analysis";

      const response = await fetch(url, {
        headers: {
          authorization: token,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Failed to load analysis.");
        return;
      }

      setAnalysis(data);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const score = analysis ? computeHealthScore(analysis) : null;
  const label = score !== null ? healthLabel(score) : null;

  const scoreSentence =
    score !== null
      ? score >= 90
        ? "Your wardrobe is well-rounded and ready for any occasion."
        : score >= 70
        ? "Your wardrobe is in good shape with a few areas to improve."
        : score >= 50
        ? "Your wardrobe needs some attention to maximise outfit options."
        : "Your wardrobe has significant gaps — consider adding key pieces."
      : "";

  const scoreColor =
    score !== null
      ? score >= 90
        ? "text-green-600"
        : score >= 70
        ? "text-[#8B6F47]"
        : score >= 50
        ? "text-yellow-600"
        : "text-red-600"
      : "";

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2E2E2E]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <AuthNavbar />

        {/* Standardized Editorial Header */}
        <div className="mb-8 border-b border-[#EAE5DD]/80 pb-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B6F47]/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B6F47] mb-2">
                <BarChart2 size={12} />
                <span>✦ Wardrobe Audit</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-[#2E2E2E]">
                Wardrobe Intelligence
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#8C8277] max-w-xl">
                Understand your wardrobe gaps, monitor health scores, and discover personalized shopping suggestions.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchAnalysis(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-2xl border border-[#8B6F47]/30 bg-white px-4 py-2.5 text-xs font-semibold text-[#8B6F47] shadow-2xs transition hover:bg-[#8B6F47] hover:text-white disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                <span>{loading ? "Analysing…" : "Refresh Analysis"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#EAE5DD] border-t-[#8B6F47]" />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Analysis Content */}
        {!loading && analysis && (
          <div className="space-y-8">
            {/* Smart Shopping Advisor Banner */}
            <div className="relative overflow-hidden rounded-3xl border border-[#8B6F47]/30 bg-gradient-to-r from-[#8B6F47]/10 via-amber-50/70 to-[#8B6F47]/5 p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B6F47]/15 px-3 py-0.5 text-xs font-bold text-[#8B6F47]">
                    ✨ Smart Online Shopping Advisor
                  </div>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E]">
                    Turn Closet Gaps into High-Impact Outfits
                  </h3>
                  <p className="text-xs text-gray-600 max-w-xl">
                    Explore curated investment pieces filtered for natural fabrics and 4.0+ star customer reviews across Myntra, Savana, SSS, Ajio, and Zara.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/shopping")}
                  className="self-start sm:self-center rounded-2xl bg-[#8B6F47] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#735b39] transition active:scale-95 shrink-0 cursor-pointer"
                >
                  Open Shopping Advisor →
                </button>
              </div>
            </div>

            {/* Health Score Card */}
            <div className="rounded-2xl border border-[#EAE5DD] bg-white px-6 py-6 shadow-sm">
              <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-400">
                Wardrobe Health Score
              </h2>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div className="flex items-end gap-1">
                  <span className={`text-6xl font-bold ${scoreColor}`}>
                    {score}
                  </span>
                  <span className="mb-2 text-xl font-medium text-gray-400">/100</span>
                </div>
                <div>
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                      score >= 90
                        ? "bg-green-100 text-green-700"
                        : score >= 70
                        ? "bg-[#8B6F47]/10 text-[#8B6F47]"
                        : score >= 50
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {label}
                  </span>
                  <p className="mt-2 text-sm text-gray-600">{scoreSentence}</p>
                </div>
              </div>
            </div>

            {/* Slot Coverage */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-[#2E2E2E]">
                Slot Coverage
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {analysis.slot_coverage.map((entry) => {
                  const colors = severityColor[entry.severity] || severityColor.ok;
                  return (
                    <div
                      key={entry.slot}
                      className={`rounded-2xl border ${colors.border} ${colors.bg} p-4`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#2E2E2E]">
                          {readableSlotName[entry.slot] || entry.slot}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colors.badge}`}
                        >
                          {colors.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                        <span className="text-2xl font-bold text-[#2E2E2E]">
                          {entry.count}
                        </span>
                        <span className="text-xs text-gray-500">
                          {entry.count === 1 ? "item" : "items"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Occasion Coverage */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-[#2E2E2E]">
                Occasion Coverage
              </h2>
              {analysis.occasion_gaps.length === 0 ? (
                <div className="rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
                  Great — you have at least 3 complete outfits for every occasion in
                  your wardrobe.
                </div>
              ) : (
                <div className="space-y-2">
                  {analysis.occasion_gaps.map((gap) => (
                    <div
                      key={gap.occasion}
                      className="flex items-center justify-between rounded-xl border border-[#EAE5DD] bg-white px-5 py-3 text-sm"
                    >
                      <span className="font-medium capitalize text-[#2E2E2E]">
                        {gap.occasion}
                      </span>
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        {gap.outfit_count === 0
                          ? "No outfits"
                          : `${gap.outfit_count} outfit${gap.outfit_count === 1 ? "" : "s"}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-[#2E2E2E]">
                  What to Add Next
                </h2>
                <div className="space-y-3">
                  {analysis.suggestions.map((suggestion) => (
                    <div
                      key={suggestion.category}
                      className="rounded-2xl border border-[#EAE5DD] bg-white px-5 py-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="rounded-full bg-[#8B6F47]/10 px-2.5 py-0.5 text-xs font-semibold text-[#8B6F47]">
                              #{suggestion.rank}
                            </span>
                            <span className="text-sm font-semibold capitalize text-[#2E2E2E]">
                              {readableSlotName[suggestion.category] || suggestion.category}
                            </span>
                          </div>
                          <p className="mb-2 text-xs text-gray-500">
                            {suggestion.reason}
                          </p>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                            <span className="rounded-full border border-[#EAE5DD] bg-[#FAF7F2] px-2 py-0.5">
                              {suggestion.suggested_color}
                            </span>
                            <span className="rounded-full border border-[#EAE5DD] bg-[#FAF7F2] px-2 py-0.5">
                              {suggestion.suggested_style}
                            </span>
                            {suggestion.estimated_new_outfits > 0 && (
                              <span className="rounded-full border border-[#EAE5DD] bg-[#FAF7F2] px-2 py-0.5">
                                +{suggestion.estimated_new_outfits} new outfits
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => navigate("/shopping")}
                          className="self-start rounded-xl bg-[#8B6F47] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#7a6040] sm:self-center cursor-pointer flex items-center gap-1"
                        >
                          Shop This →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Low Versatility — collapsible */}
            {analysis.low_versatility_items.length > 0 && (
              <div>
                <button
                  onClick={() => setShowLowVersatility((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-2xl border border-[#EAE5DD] bg-white px-5 py-4 text-left shadow-sm transition hover:border-[#8B6F47]/40"
                >
                  <div>
                    <span className="text-sm font-semibold text-[#2E2E2E]">
                      Low Versatility Items
                    </span>
                    <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">
                      {analysis.low_versatility_items.length}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {showLowVersatility ? "Hide ▲" : "Show ▼"}
                  </span>
                </button>

                {showLowVersatility && (
                  <div className="mt-2 space-y-2">
                    {analysis.low_versatility_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-[#EAE5DD] bg-white px-5 py-3 text-sm"
                      >
                        <div>
                          <span className="font-medium text-[#2E2E2E]">
                            {item.name || "Unnamed item"}
                          </span>
                          <span className="ml-2 text-xs capitalize text-gray-400">
                            {item.category}
                          </span>
                        </div>
                        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                          {item.outfit_count === 0
                            ? "0 outfits"
                            : `${item.outfit_count} outfit`}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default GapAnalysis;
