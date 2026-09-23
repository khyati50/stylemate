import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shirt, Plus, Search, X } from "lucide-react";

import ClothingCard from "../components/ClothingCard";
import ClothingModal from "../components/ClothingModal";
import ClothingDetailModal from "../components/ClothingDetailModal";
import AuthNavbar from "../components/AuthNavbar";
import { API_BASE_URL } from "../config/api";

const initialFormData = {
  name: "",
  category: "",
  colors: "",
  styles: "",
  image: null,
  occasions: "",
  seasons: "",
};

// Module-level in-memory cache and launch state for instant zero-waiting tab navigation
let cachedWardrobe = null;
let hasAppLaunched =
  typeof window !== "undefined"
    ? sessionStorage.getItem("stylemate_app_launched") === "true"
    : false;

function Wardrobe() {
  const navigate = useNavigate();

  // Only show splash screen on very first app launch/load, NEVER during tab navigation
  const isFirstLaunch = !hasAppLaunched;
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(!cachedWardrobe);
  const [initialLoading, setInitialLoading] = useState(isFirstLaunch);
  const [message, setMessage] = useState("");

  const [editId, setEditId] = useState(null);

  const [wardrobe, setWardrobe] = useState(cachedWardrobe || []);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [searchQuery, setSearchQuery] = useState("");

  const [filter, setFilter] = useState({
    category: "",
    colors: "",
    styles: "",
    occasions: "",
    seasons: "",
  });

  function resetForm() {
    setFormData(initialFormData);
    setEditId(null);
  }

  function handleEdit(item) {
    setEditId(item.id);

    setFormData({
      name: item.name,
      category: item.category,
      colors: item.colors.join(", "),
      styles: item.styles.join(", "),
      image: null,
      occasions: item.occasions.join(", "),
      seasons: item.seasons.join(", "),
    });

    setShowModal(true);
  }

  async function fetchWardrobe(isInitial = false) {
    const startTime = Date.now();
    try {
      if (!isInitial && !cachedWardrobe) setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/clothing/my-wardrobe`,
        {
          method: "GET",
          headers: {
            authorization: token,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        sessionStorage.removeItem("stylemate_app_launched");
        hasAppLaunched = false;
        cachedWardrobe = null;
        navigate("/login");
        return;
      }

      const data = await response.json();
      const items = data.wardrobe || [];
      cachedWardrobe = items;
      setWardrobe(items);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      if (isInitial) {
        hasAppLaunched = true;
        try {
          sessionStorage.setItem("stylemate_app_launched", "true");
        } catch {
          // ignore
        }
        const elapsed = Date.now() - startTime;
        const delay = Math.max(0, 500 - elapsed);
        setTimeout(() => {
          setInitialLoading(false);
          setLoading(false);
        }, delay);
      } else {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWardrobe(isFirstLaunch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addClothing() {
    try {
      const token = localStorage.getItem("token");

      const form = new FormData();

      form.append("name", formData.name);
      form.append("category", formData.category);
      form.append("colors", formData.colors);
      form.append("styles", formData.styles);
      form.append("occasions", formData.occasions);
      form.append("seasons", formData.seasons);
      form.append("image", formData.image);

      const response = await fetch(
        `${API_BASE_URL}/api/clothing/addClothes`,
        {
          method: "POST",
          headers: {
            authorization: token,
          },
          body: form,
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await response.json();

      setMessage(data.message);

      if (response.ok) {
        await fetchWardrobe();
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    }
  }

  async function deleteClothing(id) {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/api/clothing/${id}`, {
        method: "DELETE",
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

      setMessage(data.message);

      if (response.ok) {
        fetchWardrobe();
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    }
  }

  async function updateClothing() {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_BASE_URL}/api/clothing/${editId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            authorization: token,
          },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category,
            colors: formData.colors.split(",").map((c) => c.trim()),
            styles: formData.styles.split(",").map((s) => s.trim()),
            occasions: formData.occasions.split(",").map((o) => o.trim()),
            seasons: formData.seasons.split(",").map((s) => s.trim()),
          }),
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await response.json();

      setMessage(data.message);

      if (response.ok) {
        await fetchWardrobe();
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    }
  }

  function getUniqueValues(property) {
    const values = wardrobe.flatMap((item) => item[property]);
    return [...new Set(values)];
  }

  /**
   * Returns the most frequently occurring value from a flattened array field
   * across all wardrobe items. Returns '—' when the wardrobe is empty.
   */
  function getMostFrequent(property) {
    if (wardrobe.length === 0) return "—";
    const values = wardrobe.flatMap((item) => item[property] || []);
    if (values.length === 0) return "—";
    const freq = values.reduce((acc, v) => {
      acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
  }

  const uniqueCategories = getUniqueValues("category");
  const uniqueStyles = getUniqueValues("styles");
  const uniqueColour = getUniqueValues("colors");
  const uniqueSeasons = getUniqueValues("seasons");
  const uniqueOccasions = getUniqueValues("occasions");

  const mostUsedColor = getMostFrequent("colors");
  const mostUsedOccasion = getMostFrequent("occasions");

  const isFilterActive =
    filter.category !== "" ||
    filter.styles !== "" ||
    filter.colors !== "" ||
    filter.seasons !== "" ||
    filter.occasions !== "";

  const resetFilters = () => {
    setFilter({
      category: "",
      colors: "",
      styles: "",
      occasions: "",
      seasons: "",
    });
  };

  const filteredWardrobe = wardrobe.filter((item) => {
    const nameMatch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryMatch =
      filter.category === "" || item.category === filter.category;

    const styleMatch =
      filter.styles === "" || item.styles.includes(filter.styles);

    const colorMatch =
      filter.colors === "" || item.colors.includes(filter.colors);

    const seasonMatch =
      filter.seasons === "" || item.seasons.includes(filter.seasons);

    const occasionMatch =
      filter.occasions === "" || item.occasions.includes(filter.occasions);

    return (
      nameMatch &&
      categoryMatch &&
      styleMatch &&
      colorMatch &&
      seasonMatch &&
      occasionMatch
    );
  });

  if (initialLoading) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#FAF7F2] text-[#1A1918] select-none">
        {/* Subtle Ambient Radial Warm Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(150,120,78,0.08)_0%,transparent_65%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-sm animate-in fade-in duration-300">
          {/* Glowing Animated Sparkle Badge */}
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white border border-[#EBE6DE] shadow-[0_10px_30px_rgba(150,120,78,0.12)] mb-5 text-[#96784E]">
            <span className="text-2xl animate-[spin_8s_linear_infinite]">✦</span>
          </div>

          {/* Luxury Brand Title */}
          <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-[#1A1918]">
            StyleMate
          </h1>

          <p className="mt-1.5 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-semibold text-[#8C8277]">
            AI Personal Stylist &amp; Smart Closet
          </p>

          {/* Luxury Gold Loading Progress Bar */}
          <div className="mt-8 w-48 h-1 bg-[#EAE5DD] rounded-full overflow-hidden relative">
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-transparent via-[#96784E] to-transparent rounded-full animate-[luxuryProgress_1.3s_ease-in-out_infinite]" />
          </div>

          {/* Status Message */}
          <p className="mt-3.5 text-xs font-medium text-[#8C8277] tracking-wide animate-pulse">
            Opening your digital wardrobe...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2E2E2E]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 md:py-10">
        <AuthNavbar />

        {/* Standardized Editorial Collection Header */}
        <div className="mb-8 border-b border-[#EAE5DD]/80 pb-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#8B6F47]/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B6F47] mb-2">
                <Shirt size={12} />
                <span>✦ Personal Collection</span>
              </div>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-[#2E2E2E]">
                My Wardrobe
              </h1>
              <p className="mt-1.5 text-xs sm:text-sm text-[#8C8277] max-w-xl">
                Organize, browse, and curate every piece in your personal collection with AI intelligence.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#8B6F47] px-5 py-2.5 md:px-6 md:py-3 text-xs font-bold tracking-wide text-white shadow-sm transition-all hover:bg-[#725a39] active:scale-[0.98] cursor-pointer"
              >
                <Plus size={16} />
                <span>Add Garment</span>
              </button>
            </div>
          </div>

          {/* Collection Summary Metrics */}
          <div className="mt-6 flex flex-wrap items-center gap-4 sm:gap-8 text-xs font-medium text-[#8C8277]">
            <div className="flex items-center gap-2">
              <span className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-[#2E2E2E]">
                {wardrobe.length}
              </span>
              <span>Total Garments</span>
            </div>

            <div className="h-4 w-px bg-[#EAE5DD]" />

            <div className="flex items-center gap-2">
              <span className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-[#2E2E2E]">
                {uniqueCategories.length}
              </span>
              <span>Categories</span>
            </div>

            <div className="h-4 w-px bg-[#EAE5DD]" />

            <div className="flex items-center gap-2">
              <span className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-[#8B6F47]">
                {filteredWardrobe.length}
              </span>
              <span>Filtered Items</span>
            </div>

            <div className="h-4 w-px bg-[#EAE5DD]" />

            <div className="flex items-center gap-2">
              <span className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-[#2E2E2E] capitalize">
                {mostUsedColor}
              </span>
              <span>Top Color</span>
            </div>

            <div className="h-4 w-px bg-[#EAE5DD]" />

            <div className="flex items-center gap-2">
              <span className="font-['Playfair_Display'] text-xl sm:text-2xl font-bold text-[#2E2E2E] capitalize">
                {mostUsedOccasion}
              </span>
              <span>Top Occasion</span>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className="mb-6 rounded-2xl border border-[#8B6F47]/20 bg-[#FAF7F2] p-4 text-xs font-semibold text-[#8B6F47]">
            {message}
          </div>
        )}

        {/* Garment Search Bar */}
        <div className="relative mb-6">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search garments by name, style, or color..."
            className="w-full rounded-2xl border border-[#EAE5DD] bg-white py-3 pl-11 pr-10 text-xs sm:text-sm text-[#2E2E2E] placeholder-[#8C8277]/60 outline-none transition focus:border-[#8B6F47] focus:ring-4 focus:ring-[#8B6F47]/10 shadow-xs"
          />
          {searchQuery !== "" && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-[#8C8277] hover:bg-[#FAF7F2] hover:text-[#2E2E2E] transition cursor-pointer"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Mobile Filter Trigger Bar (Mobile Viewports) */}
        <div className="mb-6 flex items-center justify-between md:hidden bg-white p-4 rounded-2xl border border-[#EAE5DD] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#8B6F47]">
              Browse Collection
            </span>
            {isFilterActive && (
              <span className="flex h-2 w-2 rounded-full bg-[#8B6F47]" />
            )}
          </div>

          <div className="flex items-center gap-2">
            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-[#8B6F47] hover:underline mr-1"
              >
                Reset ✕
              </button>
            )}

            <button
              onClick={() => setShowFilterModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#FAF7F2] border border-[#EAE5DD] px-3.5 py-2 text-xs font-semibold text-[#2E2E2E] active:scale-95 transition"
            >
              <span>Filters ⚙</span>
            </button>
          </div>
        </div>

        {/* Desktop Collection Filter Bar */}
        <div className="hidden md:block mb-10 rounded-3xl border border-[#EAE5DD] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B6F47]">
              Browse Collection
            </span>

            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="text-xs font-semibold text-[#8B6F47] hover:underline"
              >
                Reset Filters ✕
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <select
              value={filter.category}
              onChange={(e) =>
                setFilter({ ...filter, category: e.target.value })
              }
              className="rounded-xl border border-gray-200 bg-[#FAF7F2]/40 p-3 text-xs text-[#2E2E2E] outline-none transition focus:border-[#8B6F47]"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filter.styles}
              onChange={(e) => setFilter({ ...filter, styles: e.target.value })}
              className="rounded-xl border border-gray-200 bg-[#FAF7F2]/40 p-3 text-xs text-[#2E2E2E] outline-none transition focus:border-[#8B6F47]"
            >
              <option value="">All Styles</option>
              {uniqueStyles.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>

            <select
              value={filter.colors}
              onChange={(e) => setFilter({ ...filter, colors: e.target.value })}
              className="rounded-xl border border-gray-200 bg-[#FAF7F2]/40 p-3 text-xs text-[#2E2E2E] outline-none transition focus:border-[#8B6F47]"
            >
              <option value="">All Colors</option>
              {uniqueColour.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>

            <select
              value={filter.seasons}
              onChange={(e) =>
                setFilter({ ...filter, seasons: e.target.value })
              }
              className="rounded-xl border border-gray-200 bg-[#FAF7F2]/40 p-3 text-xs text-[#2E2E2E] outline-none transition focus:border-[#8B6F47]"
            >
              <option value="">All Seasons</option>
              {uniqueSeasons.map((season) => (
                <option key={season} value={season}>
                  {season}
                </option>
              ))}
            </select>

            <select
              value={filter.occasions}
              onChange={(e) =>
                setFilter({ ...filter, occasions: e.target.value })
              }
              className="rounded-xl border border-gray-200 bg-[#FAF7F2]/40 p-3 text-xs text-[#2E2E2E] outline-none transition focus:border-[#8B6F47]"
            >
              <option value="">All Occasions</option>
              {uniqueOccasions.map((occasion) => (
                <option key={occasion} value={occasion}>
                  {occasion}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Collection Grid (2 per row on Mobile, 3 on Tablet, 4 on Desktop) */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white border border-[#EBE6DE] shadow-xs text-[#96784E] mb-3">
              <span className="text-lg animate-[spin_3s_linear_infinite]">✦</span>
            </div>
            <p className="text-xs font-medium text-[#8C8277]">
              Refreshing your collection...
            </p>
          </div>
        ) : wardrobe.length === 0 ? (
          <div className="rounded-3xl border border-[#EAE5DD] bg-white py-20 text-center shadow-sm">
            <h2 className="font-['Playfair_Display'] text-3xl font-bold text-[#2E2E2E]">
              Your closet is empty
            </h2>

            <p className="mt-3 text-xs text-gray-500">
              Add your first clothing piece to start building your personal wardrobe.
            </p>
          </div>
        ) : filteredWardrobe.length === 0 ? (
          <div className="rounded-3xl border border-[#EAE5DD] bg-white py-20 text-center shadow-sm">
            <h2 className="font-['Playfair_Display'] text-3xl font-bold text-[#2E2E2E]">
              No matching pieces
            </h2>

            <p className="mt-3 text-xs text-gray-500">
              Try adjusting your browsing filters to discover items.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filteredWardrobe.map((item) => (
              <ClothingCard
                key={item.id}
                item={item}
                onSelect={(selected) => setSelectedDetailItem(selected)}
                onDelete={(id) => {
                  setSelectedItemId(id);
                  setShowDeleteModal(true);
                }}
                onEdit={handleEdit}
              />
            ))}
          </div>
        )}

        {/* Mobile Filter Drawer / Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#1C1C1C]/45 backdrop-blur-xs">
            <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl border border-[#EAE5DD] shadow-2xl p-5 md:p-6 max-h-[85vh] overflow-y-auto flex flex-col space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#EAE5DD] pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B6F47]">
                    Filter Collection
                  </span>
                  <h3 className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E]">
                    Refine Your Closet
                  </h3>
                </div>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF7F2] text-gray-500 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Filter Content */}
              <div className="space-y-4 py-1">
                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B6F47] mb-1.5">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilter({ ...filter, category: "" })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        filter.category === ""
                          ? "bg-[#8B6F47] text-white border-[#8B6F47]"
                          : "bg-[#FAF7F2] text-[#2E2E2E] border-[#EAE5DD]"
                      }`}
                    >
                      All Categories
                    </button>
                    {uniqueCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFilter({ ...filter, category: cat })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border capitalize transition ${
                          filter.category === cat
                            ? "bg-[#8B6F47] text-white border-[#8B6F47]"
                            : "bg-[#FAF7F2] text-[#2E2E2E] border-[#EAE5DD]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B6F47] mb-1.5">
                    Style
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilter({ ...filter, styles: "" })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        filter.styles === ""
                          ? "bg-[#8B6F47] text-white border-[#8B6F47]"
                          : "bg-[#FAF7F2] text-[#2E2E2E] border-[#EAE5DD]"
                      }`}
                    >
                      All Styles
                    </button>
                    {uniqueStyles.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFilter({ ...filter, styles: s })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border capitalize transition ${
                          filter.styles === s
                            ? "bg-[#8B6F47] text-white border-[#8B6F47]"
                            : "bg-[#FAF7F2] text-[#2E2E2E] border-[#EAE5DD]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B6F47] mb-1.5">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilter({ ...filter, colors: "" })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        filter.colors === ""
                          ? "bg-[#8B6F47] text-white border-[#8B6F47]"
                          : "bg-[#FAF7F2] text-[#2E2E2E] border-[#EAE5DD]"
                      }`}
                    >
                      All Colors
                    </button>
                    {uniqueColour.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFilter({ ...filter, colors: c })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border capitalize transition ${
                          filter.colors === c
                            ? "bg-[#8B6F47] text-white border-[#8B6F47]"
                            : "bg-[#FAF7F2] text-[#2E2E2E] border-[#EAE5DD]"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Season */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B6F47] mb-1.5">
                    Season
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilter({ ...filter, seasons: "" })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        filter.seasons === ""
                          ? "bg-[#8B6F47] text-white border-[#8B6F47]"
                          : "bg-[#FAF7F2] text-[#2E2E2E] border-[#EAE5DD]"
                      }`}
                    >
                      All Seasons
                    </button>
                    {uniqueSeasons.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFilter({ ...filter, seasons: s })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border capitalize transition ${
                          filter.seasons === s
                            ? "bg-[#8B6F47] text-white border-[#8B6F47]"
                            : "bg-[#FAF7F2] text-[#2E2E2E] border-[#EAE5DD]"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Occasion */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8B6F47] mb-1.5">
                    Occasion
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilter({ ...filter, occasions: "" })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        filter.occasions === ""
                          ? "bg-[#8B6F47] text-white border-[#8B6F47]"
                          : "bg-[#FAF7F2] text-[#2E2E2E] border-[#EAE5DD]"
                      }`}
                    >
                      All Occasions
                    </button>
                    {uniqueOccasions.map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setFilter({ ...filter, occasions: o })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border capitalize transition ${
                          filter.occasions === o
                            ? "bg-[#8B6F47] text-white border-[#8B6F47]"
                            : "bg-[#FAF7F2] text-[#2E2E2E] border-[#EAE5DD]"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between border-t border-[#EAE5DD] pt-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-xs font-semibold text-gray-500 hover:text-[#8B6F47]"
                >
                  Reset All
                </button>

                <button
                  type="button"
                  onClick={() => setShowFilterModal(false)}
                  className="rounded-xl bg-[#8B6F47] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#725a39]"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Item Detail Inspection Drawer/Modal */}
        {selectedDetailItem && (
          <ClothingDetailModal
            item={selectedDetailItem}
            onClose={() => setSelectedDetailItem(null)}
            onEdit={(itemToEdit) => handleEdit(itemToEdit)}
            onDelete={(idToDelete) => {
              setSelectedItemId(idToDelete);
              setShowDeleteModal(true);
            }}
          />
        )}

        {/* Existing Add / Edit Item Drawer */}
        {showModal && (
          <ClothingModal
            setShowModal={setShowModal}
            formData={formData}
            setFormData={setFormData}
            editId={editId}
            HandleAddItem={addClothing}
            HandleUpdateItem={updateClothing}
          />
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1C1C]/45 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl border border-[#EAE5DD]">
              <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#2E2E2E]">
                Remove Garment
              </h2>

              <p className="mt-3 text-xs text-gray-600 leading-relaxed">
                Are you sure you want to remove this piece from your wardrobe? This action cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedItemId(null);
                  }}
                  className="rounded-xl border border-gray-300 px-5 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    await deleteClothing(selectedItemId);
                    setShowDeleteModal(false);
                    setSelectedItemId(null);
                  }}
                  className="rounded-xl bg-red-600 px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-red-700"
                >
                  Remove Item
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Wardrobe;

