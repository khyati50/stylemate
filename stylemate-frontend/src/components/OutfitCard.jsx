import { getImageUrl } from "../config/api";

function OutfitCard({ title, item, preferredStyle = "", preferredColor = "" }) {
  const cleanPrefStyle = typeof preferredStyle === "string" ? preferredStyle.trim().toLowerCase() : "";
  const cleanPrefColor = typeof preferredColor === "string" ? preferredColor.trim().toLowerCase() : "";

  const itemStyles = Array.isArray(item?.styles)
    ? item.styles
    : typeof item?.styles === "string"
    ? item.styles.split(",").map((s) => s.trim())
    : [];

  const itemColors = Array.isArray(item?.colors)
    ? item.colors
    : typeof item?.colors === "string"
    ? item.colors.split(",").map((c) => c.trim())
    : [];

  const isStyleMatch = Boolean(
    cleanPrefStyle &&
      itemStyles.some(
        (s) =>
          s &&
          (String(s).toLowerCase().includes(cleanPrefStyle) ||
            cleanPrefStyle.includes(String(s).toLowerCase()))
      )
  );

  const isColorMatch = Boolean(
    cleanPrefColor &&
      itemColors.some(
        (c) =>
          c &&
          (String(c).toLowerCase().includes(cleanPrefColor) ||
            cleanPrefColor.includes(String(c).toLowerCase()))
      )
  );

  return (
    <div className="group overflow-hidden rounded-2xl md:rounded-3xl bg-white shadow-sm border border-gray-100 transition-all duration-500 hover:shadow-xl hover:border-[#8B6F47]/30 flex flex-col">
      <div className="h-44 sm:h-64 md:h-80 bg-[#FAF7F2] relative overflow-hidden flex items-center justify-center">
        {item ? (
          <img
            src={getImageUrl(item.imageUrl)}
            alt={item.name}
            className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400 text-[10px] md:text-xs font-semibold uppercase tracking-widest">
            No Item
          </div>
        )}
      </div>

      <div className="p-3 sm:p-5 md:p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-[9px] md:text-xs font-bold uppercase tracking-[0.18em] text-[#8B6F47]">
              {title}
            </p>

            {(isStyleMatch || isColorMatch) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {isStyleMatch && (
                  <span className="rounded-full bg-[#8B6F47] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    ✓ {preferredStyle}
                  </span>
                )}
                {isColorMatch && (
                  <span className="rounded-full bg-[#2E2E2E] text-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                    ✓ {preferredColor}
                  </span>
                )}
              </div>
            )}
          </div>

          <h3 className="mt-1 md:mt-2 font-['Playfair_Display'] text-xs sm:text-base md:text-2xl font-bold text-[#2E2E2E] leading-tight truncate">
            {item ? item.name : "Not Found"}
          </h3>
        </div>

        {item && (
          <div className="mt-2 md:mt-4 pt-2 md:pt-3 border-t border-gray-100 flex flex-col gap-0.5 md:gap-1 text-[10px] md:text-xs text-gray-500">
            {itemStyles.length > 0 && (
              <p className="capitalize truncate">
                <span className="font-semibold text-[#2E2E2E]">Style:</span> {itemStyles.map(String).join(", ")}
              </p>
            )}

            {itemColors.length > 0 && (
              <p className="capitalize truncate">
                <span className="font-semibold text-[#2E2E2E]">Color:</span> {itemColors.map(String).join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OutfitCard;
