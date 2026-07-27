import { Pencil, Trash2 } from "lucide-react";

function ClothingCard({ item, onDelete, onEdit }) {
  return (
    <div className="group overflow-hidden rounded-3xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Image */}
      <div className="relative h-72 overflow-hidden bg-gray-100">
        <img
          src={`http://localhost:5000/${item.imageUrl}`}
          alt={item.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />

        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-[#8B6F47] shadow">
          {item.category}
        </span>
      </div>

      {/* Content */}
      <div className="space-y-4 p-5">
        <div>
          <h3 className="font-['Playfair_Display'] text-2xl font-semibold text-[#2E2E2E]">
            {item.name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">{item.style}</p>
        </div>

        {/* Details */}
        <div className="space-y-2 text-sm text-gray-600">
          <p>
            <span className="font-medium text-[#2E2E2E]">Colors:</span>{" "}
            {item.colors.join(", ")}
          </p>

          <p>
            <span className="font-medium text-[#2E2E2E]">Season:</span>{" "}
            {item.seasons.join(", ")}
          </p>

          <p>
            <span className="font-medium text-[#2E2E2E]">Occasion:</span>{" "}
            {item.occasions.join(", ")}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onEdit(item)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#8B6F47] py-2 font-medium text-[#8B6F47] transition hover:bg-[#8B6F47] hover:text-white"
          >
            <Pencil size={18} />
            Edit
          </button>

          <button
            onClick={() => onDelete(item.id)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 py-2 font-medium text-white transition hover:bg-red-600"
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ClothingCard;
