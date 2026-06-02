const ClothingItem = require("../models/ClothingItem");
const addClothingItem = async (req, res) => {
  const { name, category, color, style, seasons, occasions, imageUrl } =
    req.body;
  const userId = req.user.id;
  const clothingItem = await ClothingItem.create({
    userId,
    name,
    color,
    category,
    style,
    seasons,
    occasions,
    imageUrl,
  });

  res.status(201).json({
    message: "clothing item added successfully",
    clothingItem,
  });
};
const getMyWardrobe = async (req, res) => {
  const userId = req.user.id;
  const wardrobe = await ClothingItem.findAll({
    where: { userId },
  });

  res.status(200).json({
    message: "wardrobe accessed successfully",
    wardrobe,
  });
};

const deleteClothingItem = async (req, res) => {
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
};

const updateClothingItem = async (req, res) => {
  const clothingId = req.params.id;
  const userId = req.user.id;
  const { name, category, color, style, seasons, occasions, imageUrl } =
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
  if (name) {
    clothingItem.name = name;
  }
  if (category) {
    clothingItem.category = category;
  }
  if (color) {
    clothingItem.color = color;
  }
  if (style) {
    clothingItem.style = style;
  }
  if (seasons) {
    clothingItem.seasons = seasons;
  }
  if (occasions) {
    clothingItem.occasions = occasions;
  }
  if (imageUrl) {
    clothingItem.imageUrl = imageUrl;
  }

  await clothingItem.save();
  res.status(200).json({
    message: "updated successfully",
    clothingItem,
  });
};
module.exports = {
  addClothingItem,
  getMyWardrobe,
  deleteClothingItem,
  updateClothingItem,
};
