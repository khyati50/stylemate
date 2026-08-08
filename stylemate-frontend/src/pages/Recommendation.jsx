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

        // Show next recommendation automatically
        setRecommendations((prev) =>
          prev.filter((_, index) => index !== currentIndex),
        );

        setCurrentIndex(0);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }
  return (
    <div className="min-h-screen bg-[#FAF7F2] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <AuthNavbar />

        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-['Playfair_Display'] text-5xl font-bold text-[#2E2E2E]">
            Outfit Recommendation
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
            Tell us where you're going and the season, and StyleMate will
            curate the best outfit from your wardrobe.
          </p>
        </div>

        {/* Recommendation Form */}
        <div className="mx-auto mb-12 max-w-3xl rounded-3xl border border-gray-100 bg-white p-10 shadow-sm">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block font-medium text-[#2E2E2E]">
                Occasion
              </label>

              <select
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#2E2E2E] outline-none transition focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/20"
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
              <label className="mb-2 block font-medium text-[#2E2E2E]">
                Season
              </label>

              <select
                value={season}
                onChange={(e) => setSeason(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-[#2E2E2E] outline-none transition focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/20"
              >
                <option value="">Select Season</option>
                <option value="summer">Summer</option>
                <option value="winter">Winter</option>
                <option value="spring">Spring</option>
                <option value="autumn">Autumn</option>
              </select>
            </div>
          </div>

          {/* Advanced Filters (UI only) */}
          <div className="mt-8 border-t pt-6">
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="font-medium text-[#8B6F47] transition hover:underline"
            >
              {showAdvancedFilters
                ? "− Hide Advanced Filters"
                : "+ Advanced Filters"}
            </button>

            {showAdvancedFilters && (
              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block font-medium text-[#2E2E2E]">
                    Preferred Style
                  </label>

                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-[#2E2E2E] outline-none transition focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/20"
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
                  <label className="mb-2 block font-medium text-[#2E2E2E]">
                    Preferred Color
                  </label>

                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-[#2E2E2E] outline-none transition focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/20"
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
            )}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={HandleRecommendation}
              disabled={loading}
              className="rounded-xl bg-[#8B6F47] px-8 py-3 font-medium text-white transition hover:bg-[#725a39] disabled:opacity-50"
            >
              {loading ? "Finding Your Outfit..." : "Find My Outfit"}
            </button>

            {recommendations.length > 0 && (
              <button
                onClick={() =>
                  setCurrentIndex((prev) => (prev + 1) % recommendations.length)
                }
                disabled={loading}
                className="rounded-xl border border-[#8B6F47] px-8 py-3 font-medium text-[#8B6F47] transition hover:bg-[#8B6F47] hover:text-white disabled:opacity-50"
              >
                {loading ? "Finding..." : "Try Another Outfit"}
              </button>
            )}
          </div>

          {message && (
            <p className="mt-6 text-center text-red-500">{message}</p>
          )}
        </div>

        {/* Result */}
        {recommendation && (
          <>
            <h2 className="mb-8 font-['Playfair_Display'] text-4xl font-semibold text-[#2E2E2E]">
              Recommended Outfit
            </h2>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
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
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={HandleWearOutfit}
                className="rounded-xl bg-[#8B6F47] px-6 py-3 font-medium text-white transition hover:bg-[#725a39]"
              >
                👗 Wear This Outfit
              </button>

              <button
                onClick={() => {
                  setFeedbackReason("");
                  setShowFeedbackModal(true);
                }}
                className="rounded-xl border border-red-500 px-6 py-3 font-medium text-red-500 transition hover:bg-red-500 hover:text-white"
              >
                👎 I Don't Like This Recommendation
              </button>
            </div>
          </>
        )}
        {!recommendation && recommendations.length === 0 && (
          <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-gray-200 bg-white p-10 text-center shadow-sm">
            <h2 className="font-['Playfair_Display'] text-3xl font-semibold text-[#2E2E2E]">
              No More Recommendations
            </h2>

            <p className="mt-3 text-gray-600">
              You've gone through all the outfits available for these
              preferences. Try changing your occasion or season to discover more
              combinations.
            </p>
          </div>
        )}

        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <h2 className="text-center text-2xl font-semibold text-[#2E2E2E]">
                Why didn't you like this outfit?
              </h2>

              <p className="mt-2 mb-6 text-center text-gray-500">
                Your feedback helps StyleMate improve future recommendations.
              </p>

              <div className="space-y-4">
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
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <input
                      type="radio"
                      name="feedback"
                      value={reason.value}
                      checked={feedbackReason === reason.value}
                      onChange={(e) => setFeedbackReason(e.target.value)}
                    />

                    <span>{reason.label}</span>
                  </label>
                ))}
                {feedbackReason === "OTHER" && (
                  <textarea
                    value={feedbackDetails}
                    onChange={(e) => setFeedbackDetails(e.target.value)}
                    placeholder="Tell us what you didn't like about this outfit..."
                    rows={4}
                    className="mt-4 w-full resize-none rounded-xl border border-gray-300 p-3 text-gray-700 outline-none focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/20"
                  />
                )}
              </div>

              <div className="mt-8 flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowFeedbackModal(false);
                    setFeedbackReason("");
                  }}
                  className="rounded-xl border px-5 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={HandleSubmitFeedback}
                  disabled={!feedbackReason}
                  className="rounded-xl bg-red-500 px-5 py-2 text-white disabled:opacity-50"
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
