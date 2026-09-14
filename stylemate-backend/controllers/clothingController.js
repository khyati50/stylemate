const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ClothingItem = require("../models/ClothingItem");

const AI_DIR = path.resolve(__dirname, "../../ai");
const SCRIPT_PATH = path.join(AI_DIR, "image_analyzer.py");
const VENV_PYTHON = path.join(AI_DIR, "venv/bin/python");
const PYTHON_CMD = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : "python3";

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

const analyzeClothingImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      message: "No image file provided for analysis.",
    });
  }

  const imagePath = path.resolve(req.file.path);

  try {
    const pythonProcess = spawn(PYTHON_CMD, [SCRIPT_PATH, imagePath], {
      cwd: AI_DIR,
      env: { ...process.env },
    });

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      // Remove temporary upload file
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, () => {});
      }

      if (code !== 0) {
        console.error(`image_analyzer.py exited with code ${code}. Stderr: ${stderrData}`);
        return res.status(500).json({
          message: "Failed to analyze image.",
          error: stderrData || "Analyzer process error",
        });
      }

      try {
        const result = JSON.parse(stdoutData.trim());
        return res.status(200).json(result);
      } catch (err) {
        console.error("Failed to parse image analyzer output:", stdoutData);
        return res.status(500).json({
          message: "Failed to parse analysis results.",
          error: err.message,
        });
      }
    });

    pythonProcess.on("error", (err) => {
      if (fs.existsSync(imagePath)) {
        fs.unlink(imagePath, () => {});
      }
      console.error("Failed to spawn image_analyzer.py:", err);
      return res.status(500).json({
        message: "Failed to start image analyzer process.",
        error: err.message,
      });
    });
  } catch (error) {
    console.error("analyzeClothingImage Error:", error);
    if (fs.existsSync(imagePath)) {
      fs.unlink(imagePath, () => {});
    }
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
  analyzeClothingImage,
};

