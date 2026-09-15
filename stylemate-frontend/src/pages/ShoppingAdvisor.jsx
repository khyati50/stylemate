import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sparkles,
  Check,
  ShoppingBag,
  Leaf,
  Layers,
  ArrowRight,
  Footprints,
  Tag,
} from "lucide-react";
import AuthNavbar from "../components/AuthNavbar";
import Toast from "../components/Toast";
import { API_BASE_URL } from "../config/api";

const FILTER_PILLS = [
  { id: "all", label: "All Picks", icon: Sparkles },
  { id: "staples", label: "Staples & Basics", icon: Tag },
  { id: "layers", label: "Blazers & Layers", icon: Layers },
  { id: "shoes", label: "Footwear & Shoes", icon: Footprints },
  { id: "occasions", label: "Occasion Solvers", icon: Sparkles },
];

function ShoppingAdvisor() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [totalWardrobeCount, setTotalWardrobeCount] = useState(0);
  const [wardrobeAudit, setWardrobeAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [naturalFabricsOnly, setNaturalFabricsOnly] = useState(true);
  const [selectedGender, setSelectedGender] = useState(null);
  const [boughtMap, setBoughtMap] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, variant = "success") => {
    setToast({ message, variant });
  };

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const queryParams = new URLSearchParams({
        filter: activeFilter,
        naturalFabricsOnly: naturalFabricsOnly ? "true" : "false",
      });
      if (selectedGender) {
        queryParams.set("gender", selectedGender);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/shopping/recommendations?${queryParams.toString()}`,
        {
          headers: {
            authorization: token,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to load shopping recommendations.");
        return;
      }

      setRecommendations(data.recommendations || []);
      setTotalWardrobeCount(data.totalWardrobeCount || data.wardrobeAudit?.totalItems || 0);
      setWardrobeAudit(data.wardrobeAudit || null);
      if (!selectedGender) {
        setSelectedGender(data.selectedGender || data.detectedGender || "women");
      }
    } catch (err) {
      console.error(err);
      setError("Unable to connect to shopping intelligence service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [selectedGender, naturalFabricsOnly]);

  // Filter pills filter client-side only — no extra API call
  const filteredRecommendations =
    activeFilter === "all"
      ? recommendations
      : recommendations.filter((group) => group.gapType === activeFilter);

  const handleMarkBought = async (product, gapCategory) => {
    const key = product.link;
    if (boughtMap[key] || submittingId) return;

    setSubmittingId(key);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/shopping/mark-bought`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          name: product.title,
          category: gapCategory,
          colors: [],
          styles: [],
          seasons: [],
          occasions: [],
          imageUrl: product.thumbnail,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showToast(data.message || "Could not add to wardrobe.", "error");
        return;
      }

      setBoughtMap((prev) => ({ ...prev, [key]: true }));
      setTotalWardrobeCount((prev) => prev + 1);
      setWardrobeAudit((prev) =>
        prev ? { ...prev, totalItems: prev.totalItems + 1 } : null
      );
      showToast(`Added "${product.title}" to your wardrobe! ✨`);
    } catch (err) {
      console.error(err);
      showToast("Network error. Please try again.", "error");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2E2E2E]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <AuthNavbar />

        {/* Standardized Editorial Header */}
        <div className="mb-8 border-b border-[#EAE5DD]/80 pb-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B6F47]/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B6F47] mb-2">
                <ShoppingBag size={12} />
                <span>✦ Smart Shopping Advisor</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-[#2E2E2E]">
                Smart Shopping Advisor
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#8C8277] max-w-xl">
                Personalized picks to fill your wardrobe gaps — real products, real links from Google Shopping.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                to="/gap-analysis"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#8B6F47]/30 bg-white px-3.5 py-2 text-xs font-semibold text-[#8B6F47] hover:bg-[#8B6F47] hover:text-white transition shadow-2xs"
              >
                <span>Wardrobe Audit</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>

        {/* Luxury Gender / Collection Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[#EAE5DD]/50 border border-[#EAE5DD] w-fit mb-6 shadow-xs">
          <button
            onClick={() => setSelectedGender("women")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedGender === "women"
                ? "bg-[#8B6F47] text-white shadow-sm"
                : "text-gray-600 hover:text-[#8B6F47]"
            }`}
          >
            <span>👗 Women's Collection</span>
          </button>
          <button
            onClick={() => setSelectedGender("men")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              selectedGender === "men"
                ? "bg-[#8B6F47] text-white shadow-sm"
                : "text-gray-600 hover:text-[#8B6F47]"
            }`}
          >
            <span>👔 Men's Collection</span>
          </button>
        </div>

        {/* Filter Controls & Quality Switch */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EAE5DD] shadow-sm">
          {/* Category Pills with Icons */}
          <div className="flex flex-wrap gap-2 items-center">
            {FILTER_PILLS.map((pill) => {
              const isActive = activeFilter === pill.id;
              const Icon = pill.icon;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveFilter(pill.id)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#8B6F47] text-white shadow-sm"
                      : "bg-[#FAF7F2] text-[#2E2E2E] hover:bg-[#EAE5DD]/60 border border-[#EAE5DD]"
                  }`}
                >
                  <Icon size={13} />
                  <span>{pill.label}</span>
                </button>
              );
            })}
          </div>

          {/* Natural & Quality Fabric Toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none bg-[#FAF7F2] hover:bg-[#f3ede3] px-3.5 py-2 rounded-xl border border-[#EAE5DD] transition">
            <input
              type="checkbox"
              checked={naturalFabricsOnly}
              onChange={(e) => setNaturalFabricsOnly(e.target.checked)}
              className="h-4 w-4 rounded accent-[#8B6F47] cursor-pointer"
            />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#2E2E2E]">
              <Leaf size={14} className="text-[#8B6F47]" />
              Natural & High-Quality Fabrics Only
            </div>
          </label>
        </div>

        {/* Loading State — Skeleton Cards */}
        {loading && (
          <div className="space-y-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="rounded-3xl border border-[#EAE5DD] bg-white p-6 shadow-sm animate-pulse"
              >
                <div className="h-4 w-48 bg-[#EAE5DD] rounded mb-5" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((m) => (
                    <div key={m} className="rounded-2xl border border-[#EAE5DD] overflow-hidden">
                      <div className="aspect-square bg-[#EAE5DD]" />
                      <div className="p-3 space-y-2">
                        <div className="h-3 w-3/4 bg-[#EAE5DD] rounded" />
                        <div className="h-3 w-1/2 bg-[#EAE5DD] rounded" />
                        <div className="h-8 w-full bg-[#EAE5DD] rounded-xl mt-2" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            {error.toLowerCase().includes("serpapi") ||
            error.toLowerCase().includes("key") ||
            error.toLowerCase().includes("configured") ? (
              <div className="space-y-2">
                <p className="text-lg font-bold text-red-700">⚙️ Shopping Service Not Configured</p>
                <p className="text-sm text-red-600">
                  The SERPAPI_KEY is missing from the backend <code>.env</code> file.
                  Add it and restart the server to see real product recommendations.
                </p>
              </div>
            ) : (
              <p className="text-sm text-red-700">{error}</p>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredRecommendations.length === 0 && (
          <div className="rounded-2xl border border-[#EAE5DD] bg-white p-12 text-center shadow-sm">
            <Info className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h3 className="font-['Playfair_Display'] text-lg font-bold text-[#2E2E2E]">
              No recommendations found for this filter
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Try switching your category or toggling the natural fabric filter.
            </p>
          </div>
        )}

        {/* Personalization Audit Banner */}
        {!loading && !error && wardrobeAudit && (
          <div className="mb-6 rounded-2xl border border-[#8B6F47]/20 bg-[#FAF7F2] p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8B6F47]/10 text-[#8B6F47] font-bold text-lg">
                🎯
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#2E2E2E]">Personalized for Your Wardrobe</h4>
                <p className="text-[11px] text-gray-500">
                  Audited {wardrobeAudit.totalItems} items • Showing real products from Google Shopping
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold text-emerald-800">
              ✓ Closet Inventory Synced
            </span>
          </div>
        )}

        {/* Recommendation Cards — Grouped by Wardrobe Gap */}
        {!loading && !error && filteredRecommendations.length > 0 && (
          <div className="space-y-10">
            {filteredRecommendations.map((group) => (
              <div key={group.gapCategory}>
                {/* Gap Group Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-px flex-1 bg-[#EAE5DD]" />
                  <span className="rounded-full bg-[#8B6F47]/10 px-4 py-1.5 text-xs font-bold text-[#8B6F47] border border-[#8B6F47]/20 uppercase tracking-wider whitespace-nowrap">
                    Fill Your Gap: {group.gapLabel}
                  </span>
                  <div className="h-px flex-1 bg-[#EAE5DD]" />
                </div>

                {/* 3-Column Product Card Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {group.products.map((product) => {
                    const key = product.link;
                    const isBought = Boolean(boughtMap[key]);
                    const isSubmitting = submittingId === key;

                    return (
                      <div
                        key={key}
                        className="flex flex-col rounded-2xl border border-[#EAE5DD] bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                      >
                        {/* Product Image */}
                        <div className="relative aspect-square overflow-hidden bg-[#FAF7F2]">
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-full w-full object-cover object-center transition-transform duration-500 hover:scale-105"
                            loading="lazy"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=600&q=80";
                            }}
                          />
                          {/* Store Name Badge */}
                          <div className="absolute top-2 left-2 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-[#2E2E2E] shadow-sm border border-[#EAE5DD]/70 uppercase tracking-wide">
                            {product.source}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="flex flex-col flex-1 p-4 gap-3">
                          {/* Title */}
                          <p className="text-sm font-semibold text-[#2E2E2E] line-clamp-2 leading-snug">
                            {product.title}
                          </p>

                          {/* Price + Rating */}
                          <div className="flex items-center justify-between">
                            <span className="text-base font-extrabold text-[#2E2E2E]">
                              {product.price}
                            </span>
                            {product.rating && (
                              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                ⭐ {product.rating}
                                {product.reviews && (
                                  <span className="text-gray-400 font-normal ml-0.5">
                                    ({Number(product.reviews).toLocaleString()})
                                  </span>
                                )}
                              </span>
                            )}
                          </div>

                          {/* CTA Buttons */}
                          <div className="flex flex-col gap-2 mt-auto pt-1">
                            {/* View on Store */}
                            <a
                              href={product.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 w-full rounded-xl bg-[#8B6F47] px-3 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#735833] hover:shadow-md"
                            >
                              🛍️ View on {product.source} →
                            </a>

                            {/* I Bought This */}
                            <button
                              onClick={() => handleMarkBought(product, group.gapCategory)}
                              disabled={isBought || isSubmitting}
                              className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                                isBought
                                  ? "bg-emerald-600 text-white cursor-default"
                                  : "bg-[#2E2E2E] hover:bg-black text-white shadow-sm active:scale-95"
                              }`}
                            >
                              {isBought ? (
                                <>
                                  <Check size={12} /> Added to Wardrobe ✓
                                </>
                              ) : isSubmitting ? (
                                "Adding…"
                              ) : (
                                <>
                                  <Check size={12} /> ✓ I Bought This
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Toast Notification */}
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

export default ShoppingAdvisor;
