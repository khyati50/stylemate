import { Pencil, Trash2 } from "lucide-react";
import { getImageUrl } from "../config/api";

function ClothingCard({ item, onDelete, onEdit, onSelect }) {
  return (
    <div
      onClick={() => onSelect && onSelect(item)}
      className="group relative cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl border border-[#EAE5DD] bg-white shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:border-[#8B6F47]/40 hover:shadow-xl flex flex-col"
    >
      {/* 4:5 Portrait Image Container */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#FAF7F2] flex items-center justify-center">
        {item.imageUrl ? (
          <img
            src={getImageUrl(item.imageUrl)}
            alt={item.name}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            No Image
          </div>
        )}

        {/* Category Badge Overlay */}
        <span className="absolute left-2 top-2 sm:left-3 sm:top-3 rounded-full bg-white/90 backdrop-blur-xs px-2 py-0.5 sm:px-3 text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.18em] text-[#8B6F47] shadow-xs border border-[#EAE5DD]/60">
          {item.category}
        </span>

        {/* Action Controls Overlay (Revealed on Hover) */}
        <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex gap-1 sm:gap-1.5 opacity-0 transition-all duration-300 group-hover:opacity-100 transform translate-y-1 group-hover:translate-y-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white text-[#2E2E2E] shadow-md border border-[#EAE5DD] transition hover:bg-[#8B6F47] hover:text-white"
            title="Edit item"
          >
            <Pencil size={12} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item.id);
            }}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-white text-red-500 shadow-md border border-red-100 transition hover:bg-red-600 hover:text-white"
            title="Delete item"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Card Info */}
      <div className="p-2.5 sm:p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-['Playfair_Display'] text-xs sm:text-base md:text-lg font-bold text-[#2E2E2E] leading-tight truncate group-hover:text-[#8B6F47] transition-colors">
            {item.name}
          </h3>

          {item.styles && item.styles.length > 0 && (
            <p className="mt-0.5 text-[10px] sm:text-xs text-[#8C8277] capitalize truncate">
              {item.styles.join(", ")}
            </p>
          )}
        </div>

        {/* Hover-Revealed Detailed Metadata */}
        <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-500 group-hover:max-h-24 group-hover:opacity-100 group-hover:mt-2 group-hover:pt-1.5 border-t border-[#EAE5DD]/60 space-y-0.5 text-[10px] sm:text-[11px] text-gray-500">
          {item.colors && item.colors.length > 0 && (
            <p className="capitalize truncate">
              <span className="font-semibold text-[#2E2E2E]">Colors:</span>{" "}
              {item.colors.join(", ")}
            </p>
          )}

          {item.seasons && item.seasons.length > 0 && (
            <p className="capitalize truncate">
              <span className="font-semibold text-[#2E2E2E]">Seasons:</span>{" "}
              {item.seasons.join(", ")}
            </p>
          )}

          {item.occasions && item.occasions.length > 0 && (
            <p className="capitalize truncate">
              <span className="font-semibold text-[#2E2E2E]">Occasions:</span>{" "}
              {item.occasions.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClothingCard;




