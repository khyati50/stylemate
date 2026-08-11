import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";

function ClothingDetailModal({ item, onClose, onEdit, onDelete }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  function handleClose() {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300);
  }

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-[#1C1C1C]/45 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
          isAnimating ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Drawer Card */}
      <div
        className={`relative z-10 w-full max-w-2xl bg-white rounded-3xl md:rounded-[40px] border border-[#EAE5DD] shadow-[0_24px_70px_rgba(46,46,46,0.18)] overflow-hidden transition-all duration-300 ease-out transform max-h-[90vh] flex flex-col ${
          isAnimating
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Drawer Pull Handle */}
        <div className="pt-3 pb-1.5 flex flex-col items-center justify-center bg-[#FAF7F2] border-b border-[#EAE5DD]/80">
          <div className="w-14 h-1.5 rounded-full bg-[#8B6F47]/30 border border-[#8B6F47]/20 shadow-inner" />
        </div>

        {/* Header */}
        <div className="bg-[#FAF7F2] px-4 py-3 sm:px-6 md:px-8 border-b border-[#EAE5DD]/80 flex items-center justify-between">
          <div>
            <span className="rounded-full bg-white border border-[#EAE5DD] px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B6F47]">
              {item.category}
            </span>
            <h2 className="mt-1 font-['Playfair_Display'] text-xl sm:text-2xl md:text-3xl font-bold text-[#2E2E2E]">
              {item.name}
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white border border-[#EAE5DD] text-gray-400 transition hover:bg-gray-100 hover:text-[#2E2E2E] text-xs"
            aria-label="Close detail view"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">

          <div className="grid gap-6 md:grid-cols-2">
            {/* Image Viewport */}
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-[#EAE5DD] bg-[#FAF7F2] flex items-center justify-center">
              {item.imageUrl ? (
                <img
                  src={`http://localhost:5000/${item.imageUrl}`}
                  alt={item.name}
                  className="h-full w-full object-cover object-center"
                />
              ) : (
                <span className="text-xs text-gray-400 font-medium">No Image</span>
              )}
            </div>

            {/* Metadata Section */}
            <div className="flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B6F47] mb-1">
                    Garment Attributes
                  </h3>
                  <p className="font-['Playfair_Display'] text-xl font-bold text-[#2E2E2E]">
                    {item.name}
                  </p>
                </div>

                {item.styles && item.styles.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Styles
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.styles.map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-[#FAF7F2] border border-[#EAE5DD] px-2.5 py-1 text-xs font-medium text-[#2E2E2E] capitalize"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.colors && item.colors.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Colors
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.colors.map((c, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-[#FAF7F2] border border-[#EAE5DD] px-2.5 py-1 text-xs font-medium text-[#2E2E2E] capitalize"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.seasons && item.seasons.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Seasons
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.seasons.map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-[#FAF7F2] border border-[#EAE5DD] px-2.5 py-1 text-xs font-medium text-[#2E2E2E] capitalize"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {item.occasions && item.occasions.length > 0 && (
                  <div>
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Occasions
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.occasions.map((o, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-[#FAF7F2] border border-[#EAE5DD] px-2.5 py-1 text-xs font-medium text-[#2E2E2E] capitalize"
                        >
                          {o}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-[#EAE5DD] bg-[#FAF7F2] px-6 py-4 md:px-8 flex items-center justify-between gap-4">
          <button
            onClick={() => {
              handleClose();
              onDelete(item.id);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
          >
            <Trash2 size={14} />
            <span>Delete Garment</span>
          </button>

          <button
            onClick={() => {
              handleClose();
              onEdit(item);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#8B6F47] px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-[#725a39]"
          >
            <Pencil size={14} />
            <span>Edit Garment</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClothingDetailModal;
