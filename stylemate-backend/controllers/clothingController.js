const { where } = require("sequelize");
const ClothingItem = require("../models/ClothingItem");
const addClothingItem = async (req, res) => {
  const { name, category, color, style, imageUrl } = req.body;
  const userId = req.user.id;
  const clothingItem = await ClothingItem.create({
    userId,
    name,
    color,
    category,
    style,
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
module.exports = { addClothingItem, getMyWardrobe };
