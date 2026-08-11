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
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setImagePreview(null);
    }
  }, [formData.image]);

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


