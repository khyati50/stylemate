const ClothingItem = require("../models/ClothingItem");
const addClothingItem = async (req, res) => {
  try {
    const { name, category, colors, style, seasons, occasions } = req.body;
    const imageUrl = req.file.path;

    const userId = req.user.id;
    const colorsArray = colors.split(",").map((c) => c.trim());
    const occasionsArray = occasions.split(",").map((o) => o.trim());
    const seasonsArray = seasons.split(",").map((s) => s.trim());
    const clothingItem = await ClothingItem.create({
      userId,
      name,
      colors: colorsArray,
      category,
      style,
      occasions: occasionsArray,
      seasons: seasonsArray,
      imageUrl,
    });

    res.status(201).json({
      message: "clothing item added successfully",
      clothingItem,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const getMyWardrobe = async (req, res) => {
  try {
    const userId = req.user.id;

    const wardrobe = await ClothingItem.findAll({
      where: { userId },
    });

    res.status(200).json({
      message: "wardrobe accessed successfully",
      wardrobe,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
const deleteClothingItem = async (req, res) => {
  try {
    const clothingId = req.params.id;
    const userId = req.user.id;

    const clothingItem = await ClothingItem.findOne({
      where: { id: clothingId },
    });

    if (!clothingItem) {
      return res.status(404).json({
        message: "clothing item did not found",
      });
    }

    if (clothingItem.userId !== userId) {
      return res.status(403).json({
        message: "not authorized to delete this item",
      });
    }

    await clothingItem.destroy();

    return res.status(200).json({
      message: "deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const updateClothingItem = async (req, res) => {
  try {
    const clothingId = req.params.id;
    const userId = req.user.id;

    const { name, category, colors, style, seasons, occasions, imageUrl } =
      req.body;

    const clothingItem = await ClothingItem.findOne({
      where: { id: clothingId },
    });

    if (!clothingItem) {
      return res.status(404).json({
        message: "item not found",
      });
    }

    if (clothingItem.userId !== userId) {
      return res.status(403).json({
        message: "not authorized to update",
      });
    }

    if (name) clothingItem.name = name;
    if (category) clothingItem.category = category;
    if (colors) clothingItem.colors = colors;
    if (style) clothingItem.style = style;
    if (seasons) clothingItem.seasons = seasons;
    if (occasions) clothingItem.occasions = occasions;
    if (imageUrl) clothingItem.imageUrl = imageUrl;

    await clothingItem.save();

    res.status(200).json({
      message: "updated successfully",
      clothingItem,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};
module.exports = {
  addClothingItem,
  getMyWardrobe,
  deleteClothingItem,
  updateClothingItem,
};
