import { useEffect, useState } from "react";

function ClothingModal({
  setShowModal,
  formData,
  setFormData,
  editId,
  HandleAddItem,
  HandleUpdateItem,
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [detectionBanner, setDetectionBanner] = useState(null);
  const [detectionSuggestions, setDetectionSuggestions] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (formData.image instanceof File) {
      const objectUrl = URL.createObjectURL(formData.image);
      setImagePreview(objectUrl);
      setDetectionBanner(null);
      setDetectionSuggestions(null);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setImagePreview(null);
    }
  }, [formData.image]);

  async function handleAutoDetect() {
    if (!formData.image || !(formData.image instanceof File)) {
      return;
    }

    try {
      setAnalyzing(true);
      setDetectionBanner(null);
      setDetectionSuggestions(null);

      const token = localStorage.getItem("token");
      const form = new FormData();
      form.append("image", formData.image);

      const response = await fetch("http://localhost:5000/api/clothing/analyze-image", {
        method: "POST",
        headers: {
          authorization: token,
        },
        body: form,
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      const colorsStr = Array.isArray(data.detected_colors)
        ? data.detected_colors.join(", ")
        : data.detected_colors || "";
      const stylesStr = Array.isArray(data.suggested_styles)
        ? data.suggested_styles.join(", ")
        : data.suggested_styles || "";
      const occasionsStr = Array.isArray(data.suggested_occasions)
        ? data.suggested_occasions.join(", ")
        : data.suggested_occasions || "";
      const seasonsStr = Array.isArray(data.suggested_seasons)
        ? data.suggested_seasons.join(", ")
        : data.suggested_seasons || "";

      if (data.auto_fill) {
        setFormData((prev) => ({
          ...prev,
          name: prev.name?.trim()
            ? prev.name
            : data.detected_name || data.suggested_name || data.detected_item || prev.name,
          category: data.detected_category || prev.category,
          colors: colorsStr || prev.colors,
          styles: stylesStr || prev.styles,
          occasions: occasionsStr || prev.occasions,
          seasons: seasonsStr || prev.seasons,
        }));

        const confidencePct = Math.round((data.confidence || 0.85) * 100);
        setDetectionBanner(
          `✨ Details auto-detected (${confidencePct}% confidence)! Please review and customize before saving.`
        );
      } else {
        setDetectionSuggestions(data);
        const itemName = data.detected_item || "item";
        setDetectionBanner(
          `Detected ${itemName} with moderate confidence. Review suggestions below.`
        );
      }
    } catch (error) {
      console.error("Auto-detect error:", error);
      setDetectionBanner("Could not detect details automatically. Please fill in manually.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleClose() {
    setIsAnimating(false);
    setTimeout(() => {
      setShowModal(false);
    }, 300);
  }


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Soft Dimmed Overlay */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-[#1C1C1C]/45 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Centered Wardrobe Drawer Container */}
      <div
        className={`relative z-10 w-full max-w-2xl bg-white rounded-3xl md:rounded-[40px] border border-[#EAE5DD] shadow-[0_24px_70px_rgba(46,46,46,0.18)] overflow-hidden transition-all duration-300 ease-out transform max-h-[90vh] flex flex-col ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Physical Drawer Pull Handle */}
        <div className="pt-3 pb-1.5 flex flex-col items-center justify-center bg-[#FAF7F2] border-b border-[#EAE5DD]/80">
          <div className="w-14 h-1.5 rounded-full bg-[#8B6F47]/30 border border-[#8B6F47]/20 shadow-inner" />
        </div>

        {/* Drawer Header */}
        <div className="bg-[#FAF7F2] px-4 py-3 sm:px-6 md:px-8 border-b border-[#EAE5DD]/80 flex items-center justify-between">
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-[#8B6F47]">
              Wardrobe Compartment
            </span>
            <h2 className="font-['Playfair_Display'] text-xl sm:text-2xl md:text-3xl font-bold text-[#2E2E2E]">
              {editId ? "Edit Clothing Item" : "Place Item in Drawer"}
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white border border-[#EAE5DD] text-gray-400 transition hover:bg-gray-100 hover:text-[#2E2E2E] shadow-xs text-xs"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">

          {/* Visual Image Placement Zone */}
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-[#8B6F47]">
              Garment Placement Space
            </label>

            <div className="relative group rounded-2xl border-2 border-dashed border-[#8B6F47]/30 bg-[#FAF7F2] p-6 text-center transition hover:border-[#8B6F47]">
              {imagePreview ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative h-40 w-32 overflow-hidden rounded-xl border border-[#EAE5DD] bg-white shadow-sm">
                    <img
                      src={imagePreview}
                      alt="Garment Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-600 font-medium truncate max-w-xs">
                    {formData.image.name}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
                    <label className="cursor-pointer text-xs font-semibold text-[#8B6F47] hover:underline">
                      <span>Change Garment Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            image: e.target.files[0],
                          })
                        }
                        className="hidden"
                      />
                    </label>

                    {analyzing ? (
                      <div className="flex items-center gap-2 rounded-full border border-[#8B6F47]/30 bg-[#8B6F47]/10 px-4 py-2 text-xs font-semibold text-[#8B6F47] animate-pulse shadow-xs">
                        <svg className="animate-spin h-3.5 w-3.5 text-[#8B6F47]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                        </svg>
                        <span>Analyzing garment with AI...</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleAutoDetect}
                        className="flex items-center gap-1.5 rounded-full border border-[#8B6F47] bg-white px-4 py-2 text-xs font-semibold text-[#8B6F47] shadow-xs transition hover:bg-[#8B6F47] hover:text-white active:scale-95 cursor-pointer"
                      >
                        <span>✨ Auto-Detect Details</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center py-4">
                  <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-[#8B6F47]/10 text-[#8B6F47]">
                    <svg
                      className="h-6 w-6 stroke-[#8B6F47]"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3a2.5 2.5 0 0 1 2.5 2.5c0 1.2-.85 2.2-2 2.45L20.5 13A2.5 2.5 0 0 1 19 17.5H5A2.5 2.5 0 0 1 3.5 13L11.5 7.95A2.5 2.5 0 0 1 12 3z" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-[#2E2E2E]">
                    Click to place garment photo in drawer
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    PNG, JPG or WEBP image format
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        image: e.target.files[0],
                      })
                    }
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* AI Auto-Detection Feedback Banner */}
          {detectionBanner && (
            <div
              className={`rounded-2xl p-4 text-xs font-medium flex items-center justify-between gap-3 shadow-xs transition-all ${
                detectionBanner.includes("Could not")
                  ? "bg-red-50 text-red-800 border border-red-200"
                  : detectionBanner.includes("moderate")
                  ? "bg-amber-50 text-amber-900 border border-amber-200"
                  : "bg-[#FAF7F2] text-[#6B5335] border border-[#8B6F47]/30"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-base">
                  {detectionBanner.startsWith("✨") ? "✨" : detectionBanner.includes("moderate") ? "💡" : "⚠️"}
                </span>
                <span>{detectionBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setDetectionBanner(null)}
                className="text-gray-400 hover:text-gray-600 text-xs px-1 cursor-pointer"
                aria-label="Dismiss banner"
              >
                ✕
              </button>
            </div>
          )}

          {/* Form Compartments */}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8B6F47]">
                Clothing Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Vintage Leather Jacket"
                value={formData.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    name: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-sm text-[#2E2E2E] outline-none transition focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/10"
              />
              {detectionSuggestions?.suggested_name && !formData.name && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Detected:{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, name: detectionSuggestions.suggested_name }))
                    }
                    className="text-[#8B6F47] font-semibold underline hover:text-[#705531] cursor-pointer"
                  >
                    {detectionSuggestions.suggested_name}
                  </button>{" "}
                  — click to accept or type your own
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8B6F47]">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-sm text-[#2E2E2E] outline-none transition focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/10"
              >
                <option value="">Select Category</option>
                <option value="Top">Top</option>
                <option value="Bottom">Bottom</option>
                <option value="Full Body">Full Body</option>
                <option value="Footwear">Footwear</option>
                <option value="Outerwear">Outerwear</option>
                <option value="Accessory">Accessory</option>
              </select>
              {detectionSuggestions?.detected_category && !formData.category && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Detected:{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, category: detectionSuggestions.detected_category }))
                    }
                    className="text-[#8B6F47] font-semibold underline hover:text-[#705531] cursor-pointer"
                  >
                    {detectionSuggestions.detected_category}
                  </button>{" "}
                  — click to accept
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8B6F47]">
                Colors
              </label>
              <input
                type="text"
                placeholder="e.g. White, Blue"
                value={formData.colors}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    colors: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-sm text-[#2E2E2E] outline-none transition focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/10"
              />
              {detectionSuggestions?.detected_colors?.length > 0 && !formData.colors && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Detected:{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        colors: detectionSuggestions.detected_colors.join(", "),
                      }))
                    }
                    className="text-[#8B6F47] font-semibold underline hover:text-[#705531] cursor-pointer"
                  >
                    {detectionSuggestions.detected_colors.join(", ")}
                  </button>{" "}
                  — click to accept
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8B6F47]">
                Styles
              </label>
              <input
                type="text"
                placeholder="e.g. Casual, Streetwear"
                value={formData.styles}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    styles: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-sm text-[#2E2E2E] outline-none transition focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/10"
              />
              {detectionSuggestions?.suggested_styles?.length > 0 && !formData.styles && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Suggested:{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        styles: detectionSuggestions.suggested_styles.join(", "),
                      }))
                    }
                    className="text-[#8B6F47] font-semibold underline hover:text-[#705531] cursor-pointer"
                  >
                    {detectionSuggestions.suggested_styles.join(", ")}
                  </button>{" "}
                  — click to accept
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8B6F47]">
                Seasons
              </label>
              <input
                type="text"
                placeholder="e.g. Summer, Winter"
                value={formData.seasons}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    seasons: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-sm text-[#2E2E2E] outline-none transition focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/10"
              />
              {detectionSuggestions?.suggested_seasons?.length > 0 && !formData.seasons && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Suggested:{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        seasons: detectionSuggestions.suggested_seasons.join(", "),
                      }))
                    }
                    className="text-[#8B6F47] font-semibold underline hover:text-[#705531] cursor-pointer"
                  >
                    {detectionSuggestions.suggested_seasons.join(", ")}
                  </button>{" "}
                  — click to accept
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#8B6F47]">
                Occasions
              </label>
              <input
                type="text"
                placeholder="e.g. College, Party"
                value={formData.occasions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    occasions: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white p-3.5 text-sm text-[#2E2E2E] outline-none transition focus:border-[#8B6F47] focus:ring-2 focus:ring-[#8B6F47]/10"
              />
              {detectionSuggestions?.suggested_occasions?.length > 0 && !formData.occasions && (
                <p className="mt-1.5 text-[11px] text-gray-500">
                  Suggested:{" "}
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({
                        ...p,
                        occasions: detectionSuggestions.suggested_occasions.join(", "),
                      }))
                    }
                    className="text-[#8B6F47] font-semibold underline hover:text-[#705531] cursor-pointer"
                  >
                    {detectionSuggestions.suggested_occasions.join(", ")}
                  </button>{" "}
                  — click to accept
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="border-t border-[#EAE5DD] bg-[#FAF7F2] px-6 py-4 md:px-8 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={editId ? HandleUpdateItem : HandleAddItem}
            className="rounded-xl bg-[#8B6F47] px-7 py-3 text-sm font-medium text-white shadow-md transition hover:bg-[#725a39] active:scale-[0.99]"
          >
            {editId ? "Update Item" : "Save to Wardrobe"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClothingModal;


