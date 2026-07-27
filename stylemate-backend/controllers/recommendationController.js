const ClothingItem = require("../models/ClothingItem");
const recommendOutfitEngine = require("../utils/recommendationEngine");

const recommendOutfit = async (req, res) => {
  try {
    const { occasion, season } = req.body;
    const userId = req.user.id;

    const wardrobe = await ClothingItem.findAll({
      where: { userId },
    });

    if (wardrobe.length === 0) {
      return res.status(404).json({
        message: "Your wardrobe is empty. Add some clothes first.",
      });
    }

    const outfit = recommendOutfitEngine(wardrobe, occasion, season);

    if (!outfit) {
      return res.status(404).json({
        message:
          "No matching outfit found for the selected occasion and season.",
      });
    }

    return res.status(200).json({
      message: "Outfit recommended successfully.",
      outfit,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = { recommendOutfit };
