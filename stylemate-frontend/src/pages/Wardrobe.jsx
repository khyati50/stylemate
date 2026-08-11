import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import ClothingCard from "../components/ClothingCard";
import ClothingModal from "../components/ClothingModal";
import ClothingDetailModal from "../components/ClothingDetailModal";
import AuthNavbar from "../components/AuthNavbar";

const initialFormData = {
  name: "",
  category: "",
  colors: "",
  styles: "",
  image: null,
  occasions: "",
  seasons: "",
};

function Wardrobe() {
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [editId, setEditId] = useState(null);

  const [wardrobe, setWardrobe] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

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

  async function fetchWardrobe() {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await fetch(
        "http://localhost:5000/api/clothing/my-wardrobe",
        {
          method: "GET",
          headers: {
            authorization: token,
          },
        },
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      const data = await response.json();

      setWardrobe(data.wardrobe || []);
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWardrobe();
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
        "http://localhost:5000/api/clothing/addClothes",
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

      const response = await fetch(`http://localhost:5000/api/clothing/${id}`, {
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
        `http://localhost:5000/api/clothing/${editId}`,
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

  const uniqueCategories = getUniqueValues("category");
  const uniqueStyles = getUniqueValues("styles");
  const uniqueColour = getUniqueValues("colors");
  const uniqueSeasons = getUniqueValues("seasons");
  const uniqueOccasions = getUniqueValues("occasions");

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
      categoryMatch && styleMatch && colorMatch && seasonMatch && occasionMatch
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF7F2] px-4 sm:px-6 py-6 md:py-12 text-[#2E2E2E]">
      <div className="mx-auto max-w-6xl">
        <AuthNavbar />

        {/* Editorial Collection Header */}
        <div className="mb-8 border-b border-[#EAE5DD] pb-6 pt-2 md:mb-12 md:pb-8 md:pt-4">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="mb-1.5 text-[10px] md:text-xs font-bold uppercase tracking-[0.25em] text-[#8B6F47]">
                Personal Closet
              </span>
              <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl font-bold tracking-tight text-[#2E2E2E] md:text-6xl">
                My Wardrobe
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#8B6F47] px-5 py-3 md:px-7 md:py-3.5 text-[11px] md:text-xs font-bold uppercase tracking-[0.18em] text-white shadow-md transition-all hover:bg-[#725a39] active:scale-[0.99]"
              >
                <span>+ Add New Item</span>
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
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <div className="mb-6 rounded-2xl border border-[#8B6F47]/20 bg-[#FAF7F2] p-4 text-xs font-semibold text-[#8B6F47]">
            {message}
          </div>
        )}

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
          <p className="py-20 text-center text-sm font-medium text-gray-500">
            Loading your digital collection...
          </p>
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

