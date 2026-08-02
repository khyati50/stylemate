function ClothingModal({
  setShowModal,
  formData,
  setFormData,
  editId,
  HandleAddItem,
  HandleUpdateItem,
}) {
  function handleClose() {
    setShowModal(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
      <div className="w-full max-w-2xl rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="font-['Playfair_Display'] text-4xl font-bold text-[#2E2E2E]">
              {editId ? "Edit Item" : "Add New Item"}
            </h2>

            <p className="mt-2 text-gray-500">
              Keep your wardrobe organized beautifully.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="text-3xl text-gray-400 transition hover:text-red-500"
          >
            ×
          </button>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block font-medium text-[#2E2E2E]">
              Clothing Name
            </label>

            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium text-[#2E2E2E]">
              Category
            </label>

            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
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

          <div>
            <label className="mb-2 block font-medium">Colors</label>

            <input
              type="text"
              placeholder="White, Blue"
              value={formData.colors}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  colors: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Styles</label>

            <input
              type="text"
              placeholder="Casual, Streetwear"
              value={formData.styles}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  styles: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Seasons</label>

            <input
              type="text"
              placeholder="Summer, Winter"
              value={formData.seasons}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  seasons: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">Occasions</label>

            <input
              type="text"
              placeholder="College, Party"
              value={formData.occasions}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  occasions: e.target.value,
                })
              }
              className="w-full rounded-xl border border-gray-300 p-3 outline-none focus:border-[#8B6F47]"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2 block font-medium">Upload Image</label>

          <input
            type="file"
            onChange={(e) =>
              setFormData({
                ...formData,
                image: e.target.files[0],
              })
            }
            className="w-full rounded-xl border border-dashed border-gray-300 p-4 file:mr-4 file:rounded-lg file:border-0 file:bg-[#8B6F47] file:px-4 file:py-2 file:text-white hover:file:bg-[#725a39]"
          />
        </div>

        <div className="mt-10 flex justify-end gap-4">
          <button
            onClick={handleClose}
            className="rounded-xl border border-gray-300 px-6 py-3 font-medium transition hover:bg-gray-100"
          >
            Cancel
          </button>

          <button
            onClick={editId ? HandleUpdateItem : HandleAddItem}
            className="rounded-xl bg-[#8B6F47] px-6 py-3 font-medium text-white transition hover:bg-[#725a39]"
          >
            {editId ? "Update Item" : "Save Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClothingModal;
