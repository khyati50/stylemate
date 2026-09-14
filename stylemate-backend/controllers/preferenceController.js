const UserPreferences = require("../models/UserPreferences");
const { computeUserPreferences } = require("../utils/preferenceEngine");

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Fetch preferences for the authenticated user.
 * If none exist or if lastComputedAt is older than 1 hour, recomputes preferences.
 */
const getUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    let preferences = await UserPreferences.findOne({ where: { userId } });

    const now = Date.now();
    const isStale =
      !preferences ||
      !preferences.lastComputedAt ||
      now - new Date(preferences.lastComputedAt).getTime() > ONE_HOUR_MS;

    if (isStale) {
      preferences = await computeUserPreferences(userId);
    }

    return res.status(200).json({ preferences });
  } catch (error) {
    console.error("getUserPreferences error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

/**
 * Partial update of user preferences:
 * favoriteColors, favoriteStyles, favoriteOccasions, preferredFormalityLevel.
 * Disliked attributes and statistics are preserved.
 */
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      favoriteColors,
      favoriteStyles,
      favoriteOccasions,
      preferredFormalityLevel,
    } = req.body;

    let preferences = await UserPreferences.findOne({ where: { userId } });
    if (!preferences) {
      preferences = await computeUserPreferences(userId);
    }

    const updates = {};
    if (favoriteColors !== undefined) {
      updates.favoriteColors = favoriteColors;
    }
    if (favoriteStyles !== undefined) {
      updates.favoriteStyles = favoriteStyles;
    }
    if (favoriteOccasions !== undefined) {
      updates.favoriteOccasions = favoriteOccasions;
    }
    if (preferredFormalityLevel !== undefined) {
      updates.preferredFormalityLevel = preferredFormalityLevel;
    }

    preferences = await preferences.update(updates);

    return res.status(200).json({
      message: "Preferences updated successfully",
      preferences,
    });
  } catch (error) {
    console.error("updateUserPreferences error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  getUserPreferences,
  updateUserPreferences,
};
