const ClothingItem = require("../models/ClothingItem");
const UserPreferences = require("../models/UserPreferences");
const { computeUserPreferences } = require("../utils/preferenceEngine");
const { runPythonRecommendation } = require("../utils/pythonRunner");

const recommendOutfit = async (req, res) => {
  try {
    const {
      occasion = "",
      season = "",
      style = "",
      color = "",
      weather = null,
      user_preferences = null,
      user_history = null,
    } = req.body;
    const userId = req.user.id;

    const wardrobeModels = await ClothingItem.findAll({
      where: { userId, status: 'available' },
    });

    const wardrobe = wardrobeModels.map((item) => item.toJSON());

    if (wardrobe.length === 0) {
      return res.status(404).json({
        message: "Your wardrobe is empty. Add some clothes first.",
      });
    }

    let userPrefs = await UserPreferences.findOne({ where: { userId } });
    const ONE_HOUR = 60 * 60 * 1000;
    if (
      !userPrefs ||
      !userPrefs.lastComputedAt ||
      Date.now() - new Date(userPrefs.lastComputedAt).getTime() > ONE_HOUR
    ) {
      userPrefs = await computeUserPreferences(userId);
    }

    const chosenStyle = typeof style === "string" ? style.trim().toLowerCase() : "";
    const chosenColor = typeof color === "string" ? color.trim().toLowerCase() : "";

    // Filter out the explicitly chosen style/color from disliked arrays safely
    const filteredDislikedStyles = (userPrefs?.dislikedStyles || [])
      .filter((s) => s && typeof s === "string")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s && s !== chosenStyle);
    const filteredDislikedColors = (userPrefs?.dislikedColors || [])
      .filter((c) => c && typeof c === "string")
      .map((c) => c.trim().toLowerCase())
      .filter((c) => c && c !== chosenColor);

    const fallbackStyle = typeof userPrefs?.favoriteStyles?.[0] === "string"
      ? userPrefs.favoriteStyles[0].trim().toLowerCase()
      : "";
    const fallbackColor = typeof userPrefs?.favoriteColors?.[0] === "string"
      ? userPrefs.favoriteColors[0].trim().toLowerCase()
      : "";

    const inputData = {
      wardrobe,
      weather: weather || {
        temperature: req.body.temperature || 25,
        condition: req.body.condition || "sunny",
        season: season,
      },
      user_preferences: user_preferences || {
        occasion: typeof occasion === "string" ? occasion.trim().toLowerCase() : "casual",
        preferred_style: chosenStyle || fallbackStyle,
        preferred_color: chosenColor || fallbackColor,
        disliked_colors: filteredDislikedColors,
        disliked_styles: filteredDislikedStyles,
        explicit_style: !!chosenStyle,
        explicit_color: !!chosenColor,
      },
      user_history: user_history || {
        average_rating: userPrefs?.averageRating || 4.0,
        times_worn: userPrefs?.totalOutfitsWorn || 0,
        days_since_last_worn: 30,
        accepted_before: (userPrefs?.totalOutfitsWorn || 0) > 0,
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
      appliedPreferences: {
        style: chosenStyle,
        color: chosenColor,
      },
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
