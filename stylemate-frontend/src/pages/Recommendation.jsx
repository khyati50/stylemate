import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthNavbar from "../components/AuthNavbar";
import OutfitCard from "../components/OutfitCard";

function Recommendation() {
  const [occasion, setOccasion] = useState("");
  const [season, setSeason] = useState("");
  const [recommendation, setRecommendation] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const navigate = useNavigate();

  async function HandleRecommendation() {
    try {
      const token = localStorage.getItem("token");
      if (!occasion || !season) {
        setMessage("Please select both occasion and season.");
        setRecommendation(null);
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
        setRecommendation(data.outfit);
        setMessage("");
      } else {
        setRecommendation(null);
        setMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
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
            Tell us where you're going and the season, and StyleMate will curate
            an outfit from your wardrobe that matches the occasion.
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
                <option value="casual">Casual</option>
                <option value="college">College</option>
                <option value="meetings">Meetings</option>
                <option value="cafe">Cafe</option>
                <option value="hangouts">Hangouts</option>
                <option value="get together">Get Together</option>
                <option value="dinners">Dinners</option>
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
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block font-medium text-[#2E2E2E]">
                    Preferred Style
                  </label>

                  <select
                    disabled
                    className="w-full rounded-xl border border-gray-300 p-3 bg-gray-50 text-gray-400"
                  >
                    <option>Coming Soon</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-[#2E2E2E]">
                    Preferred Color
                  </label>

                  <select
                    disabled
                    className="w-full rounded-xl border border-gray-300 p-3 bg-gray-50 text-gray-400"
                  >
                    <option>Coming Soon</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-medium text-[#2E2E2E]">
                    Preferred Category
                  </label>

                  <select
                    disabled
                    className="w-full rounded-xl border border-gray-300 p-3 bg-gray-50 text-gray-400"
                  >
                    <option>Coming Soon</option>
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

            {recommendation && (
              <button
                onClick={HandleRecommendation}
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
              <OutfitCard title="Top" item={recommendation.top} />
              <OutfitCard title="Bottom" item={recommendation.bottom} />
              <OutfitCard title="Shoes" item={recommendation.shoes} />
              <OutfitCard title="Accessory" item={recommendation.accessory} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Recommendation;
