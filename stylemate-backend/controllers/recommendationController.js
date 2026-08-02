const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const ClothingItem = require("../models/ClothingItem");

const AI_DIR = path.resolve(__dirname, "../../ai");
const SCRIPT_PATH = path.join(AI_DIR, "recommendation.py");
const VENV_PYTHON = path.join(AI_DIR, "venv/bin/python");
const PYTHON_CMD = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : "python3";

/**
 * Spawns the Python recommendation pipeline and communicates via stdin/stdout.
 * @param {Object} inputData - { wardrobe, weather, user_preferences, user_history }
 * @returns {Promise<Array>} Ranked outfit recommendations from Python
 */
const runPythonRecommendation = (inputData) => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn(PYTHON_CMD, [SCRIPT_PATH], {
      cwd: AI_DIR,
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
      console.log("STDOUT:");
      console.log(stdoutData);

      console.log("STDERR:");
      console.log(stderrData);
      if (code !== 0) {
        let errorMessage = `Python process exited with code ${code}`;
        try {
          if (stdoutData.trim()) {
            const parsedError = JSON.parse(stdoutData);
            if (parsedError && parsedError.error) {
              errorMessage = parsedError.error;
            }
          }
        } catch (_) {
          if (stderrData.trim()) {
            errorMessage = stderrData.trim();
          }
        }
        return reject(new Error(errorMessage));
      }

      try {
        const result = JSON.parse(stdoutData);
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse Python output: ${err.message}`));
      }
    });

    pythonProcess.on("error", (err) => {
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });

    pythonProcess.stdin.write(JSON.stringify(inputData));
    pythonProcess.stdin.end();
  });
};

const recommendOutfit = async (req, res) => {
  try {
    const {
      occasion = "",
      season = "",
      weather = null,
      user_preferences = null,
      user_history = null,
    } = req.body;
    const userId = req.user.id;

    const wardrobeModels = await ClothingItem.findAll({
      where: { userId },
      status: "available",
    });

    const wardrobe = wardrobeModels.map((item) => item.toJSON());

    if (wardrobe.length === 0) {
      return res.status(404).json({
        message: "Your wardrobe is empty. Add some clothes first.",
      });
    }

    const inputData = {
      wardrobe,
      weather: weather || {
        temperature: req.body.temperature || 25,
        condition: req.body.condition || "sunny",
        season: season,
      },
      user_preferences: user_preferences || {
        occasion: occasion || "casual",
        preferred_style: req.body.preferred_style || "",
        preferred_colors: req.body.preferred_colors || [],
      },

      //       TODO:
      // Replace these defaults with real user interaction history
      //  after Outfit History & Feedback module is implemented.
      user_history: user_history || {
        average_rating: 4.0,
        times_worn: 0,
        days_since_last_worn: 30,
        accepted_before: false,
      },
    };

    const rankedOutfits = await runPythonRecommendation(inputData);

    if (!rankedOutfits || rankedOutfits.length === 0) {
      return res.status(404).json({
        message:
          "No matching outfit found for the selected occasion and season.",
      });
    }

    const normalizeOutfit = (raw) => ({
      top: raw.upper_body || null,
      bottom: raw.lower_body || null,
      fullBody: raw.full_body || null,
      footwear: raw.footwear || null,
      outerwear: raw.outerwear || null,
      accessory: Array.isArray(raw.accessories)
        ? raw.accessories[0] || null
        : raw.accessories || null,
    });

    const formattedOutfits = rankedOutfits.map((entry) => ({
      outfit: normalizeOutfit(entry.outfit),
      score: entry.score,
    }));

    return res.status(200).json({
      message: "Outfits recommended successfully.",
      outfits: formattedOutfits,
      outfit: formattedOutfits[0].outfit,
    });
  } catch (error) {
    console.error("Recommendation AI Error:", error);

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

/**
 * Extracts unique filter values (occasions, styles, colors)
 * from the authenticated user's wardrobe.
 */
const getRecommendationFilters = async (req, res) => {
  try {
    const userId = req.user.id;

    const wardrobe = await ClothingItem.findAll({
      where: { userId },
      raw: true,
    });
    /**
     * Flattens a JSON array field across all wardrobe items,
     * removes nulls/undefined/empty strings, deduplicates, and sorts.
     * @param {string} field - The ClothingItem field name (e.g. "occasions")
     * @returns {string[]}
     */
    const extractUnique = (field) =>
      [
        ...new Set(
          wardrobe
            .flatMap((item) => item[field] || [])
            .filter((val) => val !== null && val !== undefined && val !== ""),
        ),
      ].sort();

    return res.status(200).json({
      occasions: extractUnique("occasions"),
      styles: extractUnique("styles"),
      colors: extractUnique("colors"),
    });
  } catch (error) {
    console.error("getRecommendationFilters Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = { recommendOutfit, getRecommendationFilters };
