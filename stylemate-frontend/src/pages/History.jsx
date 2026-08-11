import AuthNavbar from "../components/AuthNavbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OutfitCard from "../components/OutfitCard";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [selectedDetailEntry, setSelectedDetailEntry] = useState(null);
  const [rating, setRating] = useState(0);

  const navigate = useNavigate();

  async function fetchHistory() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/history", {
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

      if (response.ok) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  async function HandleSubmitRating() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          historyId: selectedHistory.id,
          outfit: selectedHistory.outfit,
          rating: rating,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Rating submitted successfully!");

        setShowRatingModal(false);
        setSelectedHistory(null);
        setRating(0);
        fetchHistory();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  }

  // Helper to extract outfit items cleanly
  const getOutfitItems = (outfit) => {
    if (!outfit) return [];
    const items = [];
    if (outfit.fullBody) items.push({ slot: "Full Body", item: outfit.fullBody });
    else {
      if (outfit.top) items.push({ slot: "Top", item: outfit.top });
      if (outfit.bottom) items.push({ slot: "Bottom", item: outfit.bottom });
    }
    if (outfit.footwear) items.push({ slot: "Footwear", item: outfit.footwear });
    if (outfit.outerwear) items.push({ slot: "Outerwear", item: outfit.outerwear });
    if (outfit.accessory) items.push({ slot: "Accessory", item: outfit.accessory });
    return items;
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] px-4 sm:px-6 py-6 md:py-12 text-[#2E2E2E]">
      <div className="mx-auto max-w-6xl">
        <AuthNavbar />

        {/* Editorial Journal Header */}
        <div className="mb-8 md:mb-12 border-b border-[#EAE5DD] pb-6 md:pb-8 pt-2 md:pt-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="mb-1.5 md:mb-2 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-[#8B6F47]">
                Styling Archive
              </span>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-[#2E2E2E] md:text-6xl">
                Outfit Journal
              </h1>
            </div>

            <p className="max-w-md text-xs sm:text-sm leading-relaxed text-gray-600">
              A curated log of worn ensembles. Rate previous recommendations to continuously refine your personal style profile.
            </p>
          </div>
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="py-16 md:py-20 text-center text-xs md:text-sm font-medium text-gray-500">
            Loading styling journal...
          </div>
        ) : history.length === 0 ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-[#EAE5DD] bg-white p-8 md:p-12 text-center shadow-sm">
            <span className="text-2xl md:text-3xl">📓</span>
            <h2 className="mt-3 font-['Playfair_Display'] text-xl md:text-2xl font-bold text-[#2E2E2E]">
              Your Journal is Empty
            </h2>
            <p className="mt-2 text-xs text-gray-500">
              Outfits you wear will be archived here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {history.map((entry) => {
              const outfitItems = getOutfitItems(entry.outfit);

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedDetailEntry(entry)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl border border-[#EAE5DD] bg-white p-4 sm:p-6 md:p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#8B6F47]/40 hover:shadow-xl"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* Left Column: Metadata */}
                    <div className="flex flex-col space-y-1.5 md:w-1/3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#8B6F47]/10 px-2.5 py-0.5 text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-[#8B6F47]">
                          {entry.occasion.charAt(0).toUpperCase() + entry.occasion.slice(1)}
                        </span>
                        <span className="text-[11px] md:text-xs font-semibold tracking-wider text-gray-400">
                          {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h3 className="font-['Playfair_Display'] text-lg sm:text-2xl font-bold text-[#2E2E2E] group-hover:text-[#8B6F47] transition-colors">
                        {entry.occasion.charAt(0).toUpperCase() + entry.occasion.slice(1)} Look
                      </h3>

                      <p className="text-[11px] md:text-xs text-gray-500">
                        {outfitItems.length} Piece{outfitItems.length !== 1 && "s"} Ensemble
                      </p>
                    </div>

                    {/* Middle Column: Visual Thumbnail Strip */}
                    <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto py-1 max-w-full md:w-1/2">
                      {outfitItems.map(({ slot, item }, idx) => (
                        <div
                          key={idx}
                          className="relative h-20 w-16 sm:h-24 sm:w-20 flex-shrink-0 overflow-hidden rounded-xl border border-[#EAE5DD] bg-[#FAF7F2]"
                        >
                          {item?.imageUrl ? (
                            <img
                              src={`http://localhost:5000/${item.imageUrl}`}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[9px] text-gray-400">
                              {slot}
                            </div>
                          )}
                          <span className="absolute bottom-0 inset-x-0 bg-black/50 py-0.5 text-center text-[8px] sm:text-[9px] font-semibold text-white backdrop-blur-xs">
                            {slot}
                          </span>
                        </div>
                      ))}
                    </div>


                    {/* Right Column: Rating & Actions */}
                    <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-4 md:flex-col md:items-end md:border-t-0 md:pt-0">
                      {entry.rating ? (
                        <div className="text-right">
                          <div className="text-lg text-amber-500">
                            {"★".repeat(entry.rating)}
                            <span className="text-gray-300">
                              {"★".repeat(5 - entry.rating)}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Rated {entry.rating}/5
                          </span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHistory(entry);
                            setRating(0);
                            setShowRatingModal(true);
                          }}
                          className="rounded-xl bg-[#8B6F47] px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#725a39] active:scale-95"
                        >
                          ⭐ Rate Outfit
                        </button>
                      )}

                      <span className="text-xs font-semibold tracking-wider text-[#8B6F47] group-hover:translate-x-1 transition-transform">
                        View Look →
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Detailed Journal Entry View Drawer/Modal */}
        {selectedDetailEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div
              onClick={() => setSelectedDetailEntry(null)}
              className="fixed inset-0 bg-[#1C1C1C]/45 backdrop-blur-xs transition-opacity"
            />

            <div className="relative z-10 w-full max-w-5xl rounded-[32px] md:rounded-[40px] border border-[#EAE5DD] bg-white p-6 md:p-10 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="mb-8 flex items-center justify-between border-b border-[#EAE5DD] pb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-[#8B6F47]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[#8B6F47]">
                      {selectedDetailEntry.occasion}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">
                      {new Date(selectedDetailEntry.createdAt).toLocaleDateString("en-IN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h2 className="mt-2 font-['Playfair_Display'] text-3xl font-bold text-[#2E2E2E]">
                    Journal Entry Breakdown
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedDetailEntry(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FAF7F2] text-gray-500 transition hover:bg-gray-200"
                >
                  ✕
                </button>
              </div>

              {/* Grid Breakdown */}
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {selectedDetailEntry.outfit.fullBody ? (
                  <OutfitCard
                    title="Full Body"
                    item={selectedDetailEntry.outfit.fullBody}
                  />
                ) : (
                  <>
                    <OutfitCard title="Top" item={selectedDetailEntry.outfit.top} />
                    <OutfitCard
                      title="Bottom"
                      item={selectedDetailEntry.outfit.bottom}
                    />
                  </>
                )}

                <OutfitCard
                  title="Footwear"
                  item={selectedDetailEntry.outfit.footwear}
                />

                {selectedDetailEntry.outfit.outerwear && (
                  <OutfitCard
                    title="Outerwear"
                    item={selectedDetailEntry.outfit.outerwear}
                  />
                )}

                {selectedDetailEntry.outfit.accessory && (
                  <OutfitCard
                    title="Accessory"
                    item={selectedDetailEntry.outfit.accessory}
                  />
                )}
              </div>

              {/* Rating Toolbar inside Detail Modal */}
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#EAE5DD] pt-6">
                <div>
                  {selectedDetailEntry.rating ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500">Your Rating:</span>
                      <div className="text-lg text-amber-500">
                        {"★".repeat(selectedDetailEntry.rating)}
                        <span className="text-gray-300">
                          {"★".repeat(5 - selectedDetailEntry.rating)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-gray-500">
                      This outfit has not been rated yet.
                    </span>
                  )}
                </div>

                {!selectedDetailEntry.rating && (
                  <button
                    onClick={() => {
                      setSelectedHistory(selectedDetailEntry);
                      setRating(0);
                      setShowRatingModal(true);
                      setSelectedDetailEntry(null);
                    }}
                    className="rounded-xl bg-[#8B6F47] px-6 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-[#725a39]"
                  >
                    ⭐ Rate Outfit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Rating Modal */}
        {showRatingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C1C]/45 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-[#EAE5DD]">
              <h2 className="text-center font-['Playfair_Display'] text-3xl font-bold text-[#2E2E2E]">
                Rate This Outfit
              </h2>

              <p className="mt-2 text-center text-xs text-gray-500">
                Your feedback helps StyleMate improve future recommendations.
              </p>

              <div className="my-8 flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-4xl transition duration-200 hover:scale-125 ${
                      rating >= star ? "text-amber-400" : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setRating(0);
                    setSelectedHistory(null);
                  }}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={HandleSubmitRating}
                  disabled={rating === 0}
                  className="rounded-xl bg-[#8B6F47] px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#725a39] disabled:opacity-40"
                >
                  Submit Rating
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default History;

