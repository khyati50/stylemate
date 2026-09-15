import { getImageUrl } from "../config/api";

function OutfitCard({ title, item }) {
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
          <p className="text-[9px] md:text-xs font-bold uppercase tracking-[0.18em] text-[#8B6F47]">
            {title}
          </p>

          <h3 className="mt-1 md:mt-2 font-['Playfair_Display'] text-xs sm:text-base md:text-2xl font-bold text-[#2E2E2E] leading-tight truncate">
            {item ? item.name : "Not Found"}
          </h3>
        </div>

        {item && (
          <div className="mt-2 md:mt-4 pt-2 md:pt-3 border-t border-gray-100 flex flex-col gap-0.5 md:gap-1 text-[10px] md:text-xs text-gray-500">
            {item.styles && item.styles.length > 0 && (
              <p className="capitalize truncate">
                <span className="font-semibold text-[#2E2E2E]">Style:</span> {item.styles.join(", ")}
              </p>
            )}

            {item.colors && item.colors.length > 0 && (
              <p className="capitalize truncate">
                <span className="font-semibold text-[#2E2E2E]">Color:</span> {item.colors.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default OutfitCard;


