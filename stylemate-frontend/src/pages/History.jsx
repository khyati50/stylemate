import AuthNavbar from "../components/AuthNavbar";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OutfitCard from "../components/OutfitCard";

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState(null);
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
        setHistory(data.history);
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
  return (
    <div className="min-h-screen bg-[#FAF7F2] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <AuthNavbar />

        <div className="mb-12 text-center">
          <h1 className="font-['Playfair_Display'] text-5xl font-bold tracking-wide text-[#2E2E2E]">
            Outfit History
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-gray-600">
            View all the outfits you've worn and rate them to help StyleMate
            improve future recommendations.
          </p>

          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-gray-500">No outfit history yet.</p>
          ) : (
            <div className="space-y-12">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-md transition hover:shadow-xl"
                >
                  {/* Header */}
                  <div className="flex flex-col gap-4 border-b bg-[#F8F4EE] px-8 py-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <span className="rounded-full bg-[#8B6F47] px-4 py-1 text-sm font-medium text-white">
                        {entry.occasion.charAt(0).toUpperCase() +
                          entry.occasion.slice(1)}
                      </span>

                      <p className="mt-3 text-sm text-gray-500">
                        {new Date(entry.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <div>
                      {entry.rating ? (
                        <div className="text-right">
                          <div className="text-2xl text-yellow-400">
                            {"★".repeat(entry.rating)}
                            <span className="text-gray-300">
                              {"★".repeat(5 - entry.rating)}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-gray-500">Rated</p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedHistory(entry);
                            setRating(0);
                            setShowRatingModal(true);
                          }}
                          className="rounded-xl bg-[#8B6F47] px-6 py-3 font-medium text-white transition hover:bg-[#725a39]"
                        >
                          ⭐ Rate Outfit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Outfit */}
                  <div className="p-8">
                    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                      {entry.outfit.fullBody ? (
                        <OutfitCard
                          title="Full Body"
                          item={entry.outfit.fullBody}
                        />
                      ) : (
                        <>
                          <OutfitCard title="Top" item={entry.outfit.top} />

                          <OutfitCard
                            title="Bottom"
                            item={entry.outfit.bottom}
                          />
                        </>
                      )}

                      <OutfitCard
                        title="Footwear"
                        item={entry.outfit.footwear}
                      />

                      {entry.outfit.outerwear && (
                        <OutfitCard
                          title="Outerwear"
                          item={entry.outfit.outerwear}
                        />
                      )}

                      {entry.outfit.accessory && (
                        <OutfitCard
                          title="Accessory"
                          item={entry.outfit.accessory}
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {showRatingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
              <h2 className="text-center text-3xl font-semibold text-[#2E2E2E]">
                Rate This Outfit
              </h2>

              <p className="mt-2 text-center text-gray-500">
                Your feedback helps StyleMate improve future recommendations.
              </p>

              <div className="mb-8 flex justify-center gap-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-5xl transition duration-200 hover:scale-125 ${
                      rating >= star ? "text-yellow-400" : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => {
                    setShowRatingModal(false);
                    setRating(0);
                    setSelectedHistory(null);
                  }}
                  className="rounded-xl border px-5 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={HandleSubmitRating}
                  disabled={rating === 0}
                  className="rounded-xl bg-[#8B6F47] px-5 py-2 text-white disabled:opacity-50"
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

export default History;
