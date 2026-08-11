import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNavbar from "../components/AuthNavbar";
import OutfitCard from "../components/OutfitCard";

function Recommendation() {
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");
  const [availableOccasions, setAvailableOccasions] = useState([]);
  const [availableStyles, setAvailableStyles] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState("");
  const [feedbackDetails, setFeedbackDetails] = useState("");
  const [style, setStyle] = useState("");
  const [color, setColor] = useState("");

  const navigate = useNavigate();

  async function HandleRecommendation() {
    try {
      const token = localStorage.getItem("token");
      if (!occasion || !season) {
        setMessage("Please select both an occasion and a season.");
        setRecommendations([]);
        setCurrentIndex(0);
        return;
      }

      setMessage("");
      setLoading(true);
      setHasSearched(true);

      const response = await fetch(
        "http://localhost:5000/api/recommendation/recommend",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            authorization: token,
          },
          body: JSON.stringify({
            occasion,
            season,
            style,
            color,
          }),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setRecommendations(data.outfits);
        setCurrentIndex(0);
        setMessage("");
      } else {
        setRecommendations([]);
        setCurrentIndex(0);
        setMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchRecommendationFilters() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/recommendation/filters",
        {
          headers: {
            authorization: token,
          },
        },
      );

      if (!response.ok) return;

      const data = await response.json();

      setAvailableOccasions(data.occasions || []);
      setAvailableStyles(data.styles || []);
      setAvailableColors(data.colors || []);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchRecommendationFilters();
  }, []);

  const recommendation = recommendations[currentIndex]?.outfit || null;

  const activeItemCount = recommendation
    ? (recommendation.fullBody ? 1 : (recommendation.top ? 1 : 0) + (recommendation.bottom ? 1 : 0)) +
      (recommendation.footwear ? 1 : 0) +
      (recommendation.outerwear ? 1 : 0) +
      (recommendation.accessory ? 1 : 0)
    : 0;

  const mobileGridClass =
    activeItemCount === 3
      ? "grid-cols-3"
      : activeItemCount === 4
      ? "grid-cols-2"
      : activeItemCount === 2
      ? "grid-cols-2"
      : "grid-cols-1";

  async function HandleWearOutfit() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          outfit: recommendation,
          occasion,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Outfit added to history!");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }

  async function HandleSubmitFeedback() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          outfit: recommendation,
          feedbackReason: feedbackReason,
          feedbackDetails: feedbackReason === "OTHER" ? feedbackDetails : null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Thank you for your feedback!");

        setShowFeedbackModal(false);
        setFeedbackReason("");
        setFeedbackDetails("");

        setIsTransitioning(true);
        setTimeout(() => {
          setRecommendations((prev) =>
            prev.filter((_, index) => index !== currentIndex),
          );
          setCurrentIndex(0);
          setIsTransitioning(false);
        }, 150);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }

  const handleNextRecommendation = () => {
    if (recommendations.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % recommendations.length);
      setIsTransitioning(false);
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] px-4 sm:px-6 py-6 md:py-12">
      <div className="mx-auto max-w-6xl">
        <AuthNavbar />

        {/* Hero Header */}
        <div className="mb-8 text-center md:mb-14">
          <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-[#8B6F47]/20 bg-[#8B6F47]/10 px-3.5 py-1 text-[11px] md:text-xs font-semibold uppercase tracking-wider text-[#8B6F47]">
            <span>✨ AI-Powered Stylist</span>
          </div>

          <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-[#2E2E2E] md:text-6xl">
            Outfit Recommendation
          </h1>

          <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-base leading-relaxed text-gray-600 md:text-lg">
            Tell us where you're going and the season, and StyleMate will
            curate the best outfit from your wardrobe.
          </p>
        </div>


        {/* Recommendation Controls */}
        <div className="mx-auto mb-14 max-w-3xl rounded-3xl border border-gray-200/80 bg-white p-5 md:p-10 shadow-sm">
          <div className="grid gap-3 grid-cols-2 md:gap-6 md:grid-cols-2">
            <div>
              <label className="mb-1.5 md:mb-2 block text-[10px] md:text-xs font-semibold uppercase tracking-wider text-[#8B6F47]">
                Occasion <span className="text-red-400">*</span>
              </label>

              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full rounded-xl md:rounded-2xl border border-gray-200 bg-white px-3 py-2.5 md:px-4 md:py-3.5 text-xs md:text-sm text-[#2E2E2E] outline-none transition-all hover:border-[#8B6F47]/50 focus:border-[#8B6F47] focus:ring-4 focus:ring-[#8B6F47]/10"
              >
                <option value="">Select Occasion</option>
                {availableOccasions.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ.charAt(0).toUpperCase() + occ.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 md:mb-2 block text-[10px] md:text-xs font-semibold uppercase tracking-wider text-[#8B6F47]">
                Season <span className="text-red-400">*</span>
              </label>

              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full rounded-xl md:rounded-2xl border border-gray-200 bg-white px-3 py-2.5 md:px-4 md:py-3.5 text-xs md:text-sm text-[#2E2E2E] outline-none transition-all hover:border-[#8B6F47]/50 focus:border-[#8B6F47] focus:ring-4 focus:ring-[#8B6F47]/10"
              >
                <option value="">Select Season</option>
                <option value="summer">Summer</option>
                <option value="winter">Winter</option>
                <option value="spring">Spring</option>
                <option value="autumn">Autumn</option>
              </select>
            </div>
          </div>

          {/* Personalize Your Look (formerly Advanced Filters) */}
          <div className="mt-8 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#8B6F47] transition hover:text-[#725a39]"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8B6F47]/10 text-xs font-bold">
                {showAdvancedFilters ? "−" : "+"}
              </span>
              <span>Personalize Your Look</span>
            </button>

            {showAdvancedFilters && (
              <div className="mt-6 rounded-2xl border border-[#8B6F47]/15 bg-[#FAF7F2]/60 p-6 transition-all">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-[#2E2E2E]">
                    Fine-tune Style & Color Preferences
                  </h3>
                  <p className="text-xs text-gray-500">
                    Optional preferences to influence outfit ranking without excluding valid choices.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#2E2E2E]">
                      Preferred Style
                    </label>

                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-[#2E2E2E] outline-none transition hover:border-[#8B6F47]/50 focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/20"
                    >
                      <option value="">Any Style</option>
                      {availableStyles.map((styleOption) => (
                        <option key={styleOption} value={styleOption}>
                          {styleOption.charAt(0).toUpperCase() +
                            styleOption.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-[#2E2E2E]">
                      Preferred Color
                    </label>

                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-[#2E2E2E] outline-none transition hover:border-[#8B6F47]/50 focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/20"
                    >
                      <option value="">Any Color</option>
                      {availableColors.map((colorOption) => (
                        <option key={colorOption} value={colorOption}>
                          {colorOption.charAt(0).toUpperCase() +
                            colorOption.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={HandleRecommendation}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-[#8B6F47] px-8 py-3.5 font-medium text-white shadow-md shadow-[#8B6F47]/20 transition-all hover:bg-[#725a39] hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Finding Your Outfit...</span>
                </>
              ) : (
                <span>Find My Outfit</span>
              )}
            </button>

            {recommendations.length > 1 && (
              <button
                onClick={handleNextRecommendation}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-2xl border border-[#8B6F47] bg-white px-8 py-3.5 font-medium text-[#8B6F47] shadow-sm transition-all hover:bg-[#8B6F47] hover:text-white disabled:opacity-50"
              >
                <span>Try Another Outfit</span>
                <span className="rounded-full bg-[#8B6F47]/10 px-2 py-0.5 text-xs font-semibold group-hover:bg-white/20">
                  {currentIndex + 1}/{recommendations.length}
                </span>
              </button>
            )}
          </div>

          {message && (
            <div className="mt-6 rounded-xl bg-red-50 p-3 text-center text-sm font-medium text-red-600 border border-red-100">
              {message}
            </div>
          )}
        </div>

        {/* Result Spotlight Showcase */}
        {recommendation && (
          <div
            className={`transition-all duration-300 ${
              isTransitioning
                ? "opacity-0 translate-y-2 scale-[0.99]"
                : "opacity-100 translate-y-0 scale-100"
            }`}
          >
            <div className="mb-8 flex flex-col items-center justify-between gap-4 border-b border-gray-200/60 pb-6 md:flex-row">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#8B6F47]">
                  Curated Recommendation
                </span>
                <h2 className="font-['Playfair_Display'] text-3xl font-bold text-[#2E2E2E] md:text-4xl">
                  Recommended Look
                </h2>
              </div>

              {recommendations.length > 1 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500">
                    Option {currentIndex + 1} of {recommendations.length}
                  </span>
                  <div className="flex gap-1.5">
                    {recommendations.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setIsTransitioning(true);
                          setTimeout(() => {
                            setCurrentIndex(idx);
                            setIsTransitioning(false);
                          }, 150);
                        }}
                        className={`h-2.5 rounded-full transition-all ${
                          idx === currentIndex
                            ? "w-6 bg-[#8B6F47]"
                            : "w-2.5 bg-gray-300 hover:bg-gray-400"
                        }`}
                        title={`Go to outfit ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Grid of Outfit Cards */}
            <div className={`grid gap-3 md:gap-8 ${mobileGridClass} md:grid-cols-2 xl:grid-cols-4`}>
              {recommendation.fullBody ? (
                <OutfitCard title="Full Body" item={recommendation.fullBody} />
              ) : (
                <>
                  <OutfitCard title="Top" item={recommendation.top} />
                  <OutfitCard title="Bottom" item={recommendation.bottom} />
                </>
              )}
              <OutfitCard title="Footwear" item={recommendation.footwear} />
              {recommendation.outerwear && (
                <OutfitCard title="Outerwear" item={recommendation.outerwear} />
              )}
              {recommendation.accessory && (
                <OutfitCard title="Accessory" item={recommendation.accessory} />
              )}
            </div>


            {/* Action Buttons Toolbar */}
            <div className="mt-10 flex flex-wrap justify-center gap-4 border-t border-gray-200/60 pt-8">
              <button
                onClick={HandleWearOutfit}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#8B6F47] px-8 py-3.5 font-medium text-white shadow-md transition-all hover:bg-[#725a39] hover:shadow-lg active:scale-[0.99]"
              >
                <span>👗 Wear This Outfit</span>
              </button>

              <button
                onClick={() => {
                  setFeedbackReason("");
                  setShowFeedbackModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-6 py-3.5 font-medium text-red-600 shadow-sm transition-all hover:border-red-500 hover:bg-red-50 active:scale-[0.99]"
              >
                <span>👎 I Don't Like This Recommendation</span>
              </button>
            </div>
          </div>
        )}

        {/* Initial empty state / No More Recommendations */}
        {hasSearched && !recommendation && recommendations.length === 0 && !loading && (
          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-gray-200/80 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF7F2] text-2xl">
              ✨
            </div>
            <h2 className="font-['Playfair_Display'] text-3xl font-semibold text-[#2E2E2E]">
              No More Recommendations
            </h2>

            <p className="mt-3 text-base text-gray-600">
              You've gone through all the outfits available for these
              preferences. Try changing your occasion or season to discover more
              combinations.
            </p>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-gray-100">
              <h2 className="text-center font-['Playfair_Display'] text-2xl font-semibold text-[#2E2E2E]">
                Why didn't you like this outfit?
              </h2>

              <p className="mt-2 mb-6 text-center text-sm text-gray-500">
                Your feedback helps StyleMate improve future recommendations.
              </p>

              <div className="space-y-3">
                {[
                  { label: "Color mismatch", value: "COLOR_MISMATCH" },
                  { label: "Style mismatch", value: "STYLE_MISMATCH" },
                  { label: "Too formal", value: "TOO_FORMAL" },
                  { label: "Too casual", value: "TOO_CASUAL" },
                  { label: "Occasion mismatch", value: "OCCASION_MISMATCH" },
                  { label: "Other", value: "OTHER" },
                ].map((reason) => (
                  <label
                    key={reason.value}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-sm transition ${
                      feedbackReason === reason.value
                        ? "border-[#8B6F47] bg-[#FAF7F2] text-[#8B6F47] font-medium"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <span>{reason.label}</span>
                    <input
                      type="radio"
                      name="feedback"
                      value={reason.value}
                      checked={feedbackReason === reason.value}
                      onChange={(e) => setFeedbackReason(e.target.value)}
                      className="accent-[#8B6F47]"
                    />
                  </label>
                ))}
                {feedbackReason === "OTHER" && (
                  <textarea
                    value={feedbackDetails}
                    onChange={(e) => setFeedbackDetails(e.target.value)}
                    placeholder="Tell us what you didn't like about this outfit..."
                    rows={3}
                    className="mt-3 w-full resize-none rounded-xl border border-gray-200 p-3 text-sm text-gray-700 outline-none focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/20"
                  />
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackReason("");
                  }}
                  className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>

                <button
                  onClick={HandleSubmitFeedback}
                  disabled={!feedbackReason}
                  className="rounded-xl bg-red-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-600 disabled:opacity-40"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Recommendation;
