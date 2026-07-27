const recommendOutfitEngine = (wardrobe, occasion, season) => {
  // Filter by occasion
  const filteredByOccasion = wardrobe.filter((item) =>
    item.occasions.includes(occasion),
  );

  // Filter by season
  const filteredBySeason = filteredByOccasion.filter((item) =>
    item.seasons.includes(season),
  );

  const tops = filteredBySeason.filter(
    (item) => item.category.toLowerCase() === "top",
  );

  const bottoms = filteredBySeason.filter(
    (item) => item.category.toLowerCase() === "bottom",
  );

  const shoes = filteredBySeason.filter(
    (item) => item.category.toLowerCase() === "shoes",
  );

  const accessories = filteredBySeason.filter(
    (item) => item.category.toLowerCase() === "accessory",
  );

  const getRandomItem = (items) => {
    if (items.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * items.length);
    return items[randomIndex];
  };

  const outfit = {
    top: getRandomItem(tops),
    bottom: getRandomItem(bottoms),
    shoes: getRandomItem(shoes),
    accessory: getRandomItem(accessories),
  };

  if (!outfit.top && !outfit.bottom && !outfit.shoes && !outfit.accessory) {
    return null;
  }

  return outfit;
};

module.exports = recommendOutfitEngine;
