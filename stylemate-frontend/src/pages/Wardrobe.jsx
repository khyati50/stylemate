import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import ClothingCard from "../components/ClothingCard";
import ClothingModal from "../components/ClothingModal";
import AuthNavbar from "../components/AuthNavbar";

const initialFormData = {
  name: "",
  category: "",
  colors: "",
  style: "",
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
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const [filter, setFilter] = useState({
    category: "",
    colors: "",
    style: "",
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
      style: item.style,
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

      setWardrobe(data.wardrobe);
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
      form.append("style", formData.style);
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
            style: formData.style,
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
  const uniqueStyle = getUniqueValues("style");
  const uniqueColour = getUniqueValues("colors");
  const uniqueSeasons = getUniqueValues("seasons");
  const uniqueOccasions = getUniqueValues("occasions");

  const filteredWardrobe = wardrobe.filter((item) => {
    const categoryMatch =
      filter.category === "" || item.category === filter.category;

    const styleMatch = filter.style === "" || item.style === filter.style;

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
    <div className="min-h-screen bg-[#FAF7F2] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <AuthNavbar />
        {/* Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-['Playfair_Display'] text-5xl font-bold text-[#2E2E2E]">
              My Wardrobe
            </h1>

            <p className="mt-3 max-w-xl text-lg text-gray-600">
              Organize your wardrobe effortlessly and discover the perfect
              outfit every day.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="rounded-xl bg-[#8B6F47] px-6 py-3 font-medium text-white transition hover:bg-[#725a39]"
            >
              + Add New Item
            </button>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
            {message}
          </div>
        )}

        {/* Filters */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <select
              value={filter.category}
              onChange={(e) =>
                setFilter({ ...filter, category: e.target.value })
              }
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={filter.style}
              onChange={(e) => setFilter({ ...filter, style: e.target.value })}
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
            >
              <option value="">All Styles</option>
              {uniqueStyle.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>

            <select
              value={filter.colors}
              onChange={(e) => setFilter({ ...filter, colors: e.target.value })}
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
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
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
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
              className="rounded-lg border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
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

        {/* Cards */}
        {loading ? (
          <p className="text-center text-lg text-gray-500">
            Loading wardrobe...
          </p>
        ) : wardrobe.length === 0 ? (
          <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-[#2E2E2E]">
              Your wardrobe is empty
            </h2>

            <p className="mt-3 text-gray-500">
              Add your first clothing item to get started.
            </p>
          </div>
        ) : filteredWardrobe.length === 0 ? (
          <div className="rounded-2xl bg-white py-20 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-[#2E2E2E]">
              No matching items
            </h2>

            <p className="mt-3 text-gray-500">Try changing your filters.</p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-gray-500">
              Showing {filteredWardrobe.length} item
              {filteredWardrobe.length !== 1 && "s"}
            </p>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {filteredWardrobe.map((item) => (
                <ClothingCard
                  key={item.id}
                  item={item}
                  onDelete={(id) => {
                    setSelectedItemId(id);
                    setShowDeleteModal(true);
                  }}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          </>
        )}

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

        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h2 className="font-['Playfair_Display'] text-2xl font-semibold text-[#2E2E2E]">
                Delete Item
              </h2>

              <p className="mt-3 text-gray-600">
                Are you sure you want to delete this clothing item? This action
                cannot be undone.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedItemId(null);
                  }}
                  className="rounded-xl border border-gray-300 px-5 py-2 font-medium text-gray-700 transition hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  onClick={async () => {
                    await deleteClothing(selectedItemId);
                    setShowDeleteModal(false);
                    setSelectedItemId(null);
                  }}
                  className="rounded-xl bg-red-600 px-5 py-2 font-medium text-white transition hover:bg-red-700"
                >
                  Delete
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
