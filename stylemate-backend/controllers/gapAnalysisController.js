const ClothingItem = require("../models/ClothingItem");
const { runPythonScript } = require("../utils/pythonRunner");

// Module-level cache: results are valid for 1 hour per user
const cache = {};
const CACHE_TTL_MS = 60 * 60 * 1000;

const getGapAnalysis = async (req, res) => {
  try {
    const userId = req.user.id;
    const forceRefresh = req.query.refresh === "true";

    // Return cached result if valid and not forced to refresh
    if (!forceRefresh && cache[userId]) {
      const age = Date.now() - cache[userId].cachedAt;
      if (age < CACHE_TTL_MS) {
        return res.status(200).json({ ...cache[userId].result, cached: true });
      }
    }

    // Fetch ALL clothing items for this user (no status filter)
    const wardrobeModels = await ClothingItem.findAll({
      where: { userId },
    });

    const wardrobe = wardrobeModels.map((item) => item.toJSON());

    if (wardrobe.length === 0) {
      return res.status(404).json({
        message: "Your wardrobe is empty. Add some clothes first.",
      });
    }

    const result = await runPythonScript({
      scriptName: "gap_analysis.py",
      inputData: { wardrobe },
    });

    // Store result in cache
    cache[userId] = { result, cachedAt: Date.now() };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Gap Analysis AI Error:", error);

    return res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  }
};

module.exports = {
  getGapAnalysis,
  getWardrobeGaps: getGapAnalysis,
};
