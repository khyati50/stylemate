function OutfitCard({ title, item }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm transition hover:shadow-lg">
      <div className="h-64 bg-gray-100">
        {item ? (
          <img
            src={`http://localhost:5000/${item.imageUrl}`}
            alt={item.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
            No Item
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-sm uppercase tracking-wider text-[#8B6F47]">
          {title}
        </p>

        <h3 className="mt-2 font-['Playfair_Display'] text-2xl font-semibold text-[#2E2E2E]">
          {item ? item.name : "Not Found"}
        </h3>

        {item && (
          <>
            <p className="mt-2 text-gray-500">{item.styles.join(", ")}</p>

            <p className="mt-3 text-sm text-gray-600">
              {item.colors.join(", ")}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default OutfitCard;
