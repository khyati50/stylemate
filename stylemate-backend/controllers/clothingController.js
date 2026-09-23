const path = require("path");
const fs = require("fs");
const ClothingItem = require("../models/ClothingItem");
const { runPythonScript } = require("../utils/pythonRunner");

const addClothingItem = async (req, res) => {
  try {
    const { name, category, colors, styles, seasons, occasions } = req.body;
    const imageUrl = req.file.path;

    const userId = req.user.id;
    const colorsArray = colors.split(",").map((c) => c.trim().toLowerCase());
    const stylesArray = styles.split(",").map((s) => s.trim().toLowerCase());
    const occasionsArray = occasions
      .split(",")
      .map((o) => o.trim().toLowerCase());
    const seasonsArray = seasons.split(",").map((s) => s.trim().toLowerCase());
    const clothingItem = await ClothingItem.create({
      userId,
      name,
      colors: colorsArray,
      category,
      styles: stylesArray,
      occasions: occasionsArray,
      seasons: seasonsArray,
      imageUrl,
      status: "available",
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
        message: "Clothing item not found.",
      });
    }

    if (clothingItem.userId !== userId) {
      return res.status(403).json({
        message: "Not authorized to delete this item.",
      });
    }

    // Delete the associated image file from disk only if it resides within the safe uploads directory
    if (clothingItem.imageUrl && typeof clothingItem.imageUrl === "string") {
      const uploadsDir = path.resolve(__dirname, "../uploads");
      const imagePath = path.resolve(__dirname, "../", clothingItem.imageUrl);
      if (
        imagePath.startsWith(uploadsDir + path.sep) &&
        fs.existsSync(imagePath)
      ) {
        fs.unlink(imagePath, (err) => {
          if (err) console.error("Failed to delete image file:", err.message);
        });
      }
    }

    await clothingItem.destroy();

    return res.status(200).json({
      message: "Item deleted successfully.",
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

    const { name, category, colors, styles, seasons, occasions, imageUrl } =
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
    if (styles) clothingItem.styles = styles;
    if (seasons) clothingItem.seasons = seasons;
    if (occasions) clothingItem.occasions = occasions;
    if (imageUrl) {
      // Validate imageUrl to prevent arbitrary path traversal
      const isHttp = /^https?:\/\//i.test(imageUrl);
      const isRelativeUpload = /^uploads[/\\][^/\\]+/i.test(imageUrl);
      if (isHttp || isRelativeUpload) {
        clothingItem.imageUrl = imageUrl;
      }
    }

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

const analyzeClothingImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image file provided for analysis.",
    });
  }

  const imagePath = path.resolve(req.file.path);

  try {
    const result = await runPythonScript({
      scriptName: "image_analyzer.py",
      args: [imagePath],
      timeoutMs: 45_000,
    });

    // Clean up uploaded file
    if (fs.existsSync(imagePath)) {
      fs.unlink(imagePath, () => {});
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("analyzeClothingImage Error:", error);
    if (fs.existsSync(imagePath)) {
      fs.unlink(imagePath, () => {});
    }
    return res.status(500).json({
      message: error.message || "Failed to analyze image.",
    });
  }
};

module.exports = {
  addClothingItem,
  getMyWardrobe,
  deleteClothingItem,
  updateClothingItem,
  analyzeClothingImage,
};

