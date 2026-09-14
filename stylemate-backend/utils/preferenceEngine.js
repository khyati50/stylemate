const OutfitFeedback = require("../models/OutfitFeedback");
const OutfitHistory = require("../models/OutfitHistory");
const UserPreferences = require("../models/UserPreferences");

/**
 * Normalizes values (array or string) into a list of lowercased, trimmed strings.
 */
function toCleanStringArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .filter((x) => typeof x === "string")
      .map((x) => x.toLowerCase().trim())
      .filter((x) => x.length > 0);
  }
  if (typeof val === "string") {
    return val
      .split(",")
      .map((x) => x.toLowerCase().trim())
      .filter((x) => x.length > 0);
  }
  return [];
}

/**
 * Extracts all distinct clothing items from an outfit object defensively,
 * checking both camelCase and snake_case slot names.
 */
function extractItemsFromOutfit(outfit) {
  if (!outfit) return [];
  let parsed = outfit;
  if (typeof outfit === "string") {
    try {
      parsed = JSON.parse(outfit);
    } catch (_) {
      return [];
    }
  }
  if (!parsed || typeof parsed !== "object") return [];

  const items = [];
  const seen = new Set();

  const candidates = [
    parsed.top,
    parsed.upper_body,
    parsed.upperBody,
    parsed.bottom,
    parsed.lower_body,
    parsed.lowerBody,
    parsed.fullBody,
    parsed.full_body,
    parsed.footwear,
    parsed.outerwear,
    parsed.accessory,
  ];

  if (Array.isArray(parsed.accessories)) {
    candidates.push(...parsed.accessories);
  } else if (parsed.accessories) {
    candidates.push(parsed.accessories);
  }

  for (const item of candidates) {
    if (item && typeof item === "object") {
      const key = item.id ? `id_${item.id}` : JSON.stringify(item);
      if (!seen.has(key)) {
        seen.add(key);
        items.push(item);
      }
    }
  }

  return items;
}

/**
 * Calculates top N most frequent items in an array.
 */
function getTopFrequencies(arr, limit) {
  const freq = {};
  for (const item of arr) {
    if (!item) continue;
    freq[item] = (freq[item] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((entry) => entry[0]);
}

/**
 * Computes user preferences from feedback and history, then upserts the record.
 * @param {number} userId - The user's ID
 * @returns {Promise<UserPreferences>} The updated or created UserPreferences record
 */
async function computeUserPreferences(userId) {
  const feedbacks = await OutfitFeedback.findAll({
    where: { userId },
  });

  const totalOutfitsWorn = await OutfitHistory.count({
    where: { userId },
  });

  const likedColors = [];
  const likedStyles = [];
  const likedOccasions = [];

  const dislikedColorsList = [];
  const dislikedStylesList = [];

  for (const fb of feedbacks) {
    let parsedOutfit = fb.outfit;
    if (typeof parsedOutfit === "string") {
      try {
        parsedOutfit = JSON.parse(parsedOutfit);
      } catch (_) {
        parsedOutfit = null;
      }
    }

    const items = extractItemsFromOutfit(parsedOutfit);
    const rating =
      fb.rating !== null && fb.rating !== undefined && !isNaN(Number(fb.rating))
        ? Number(fb.rating)
        : null;
    const reason = fb.feedbackReason;

    // Liked group: rating >= 4
    if (rating !== null && rating >= 4) {
      for (const item of items) {
        likedColors.push(...toCleanStringArray(item.colors || item.color));
        likedStyles.push(...toCleanStringArray(item.styles || item.style));
        likedOccasions.push(
          ...toCleanStringArray(item.occasions || item.occasion)
        );
      }
      if (parsedOutfit && typeof parsedOutfit === "object") {
        likedOccasions.push(
          ...toCleanStringArray(parsedOutfit.occasion || parsedOutfit.occasions)
        );
      }
    }

    // Disliked color signal: feedbackReason === "COLOR_MISMATCH" OR rating <= 2
    if (reason === "COLOR_MISMATCH" || (rating !== null && rating <= 2)) {
      for (const item of items) {
        dislikedColorsList.push(...toCleanStringArray(item.colors || item.color));
      }
    }

    // Disliked style signal: feedbackReason === "STYLE_MISMATCH" OR rating <= 2
    if (reason === "STYLE_MISMATCH" || (rating !== null && rating <= 2)) {
      for (const item of items) {
        dislikedStylesList.push(...toCleanStringArray(item.styles || item.style));
      }
    }
  }

  // Top frequencies
  const computedFavoriteColors = getTopFrequencies(likedColors, 3);
  const computedFavoriteStyles = getTopFrequencies(likedStyles, 3);
  const computedFavoriteOccasions = getTopFrequencies(likedOccasions, 3);
  const computedDislikedColors = getTopFrequencies(dislikedColorsList, 2);
  const computedDislikedStyles = getTopFrequencies(dislikedStylesList, 2);

  // Formality detection based on top liked style
  const CASUAL_STYLES = new Set(["casual", "streetwear", "sporty"]);
  const SMART_CASUAL_STYLES = new Set([
    "smart",
    "smart-casual",
    "smart casual",
    "business",
  ]);
  const FORMAL_STYLES = new Set(["formal", "ethnic"]);

  let computedFormalityLevel = null;
  if (computedFavoriteStyles.length > 0) {
    const topStyle = computedFavoriteStyles[0].toLowerCase().trim();
    if (CASUAL_STYLES.has(topStyle)) {
      computedFormalityLevel = "casual";
    } else if (SMART_CASUAL_STYLES.has(topStyle)) {
      computedFormalityLevel = "smart-casual";
    } else if (FORMAL_STYLES.has(topStyle)) {
      computedFormalityLevel = "formal";
    }
  }

  // Average rating
  const ratedFeedbacks = feedbacks.filter(
    (fb) =>
      fb.rating !== null && fb.rating !== undefined && !isNaN(Number(fb.rating))
  );
  let averageRating = 0.0;
  if (ratedFeedbacks.length > 0) {
    const sum = ratedFeedbacks.reduce((acc, fb) => acc + Number(fb.rating), 0);
    averageRating = Math.round((sum / ratedFeedbacks.length) * 10) / 10;
  }

  // Preserve existing manual preferences if computed arrays are empty
  const existing = await UserPreferences.findOne({ where: { userId } });

  const favoriteColors =
    computedFavoriteColors.length > 0
      ? computedFavoriteColors
      : existing?.favoriteColors || [];

  const favoriteStyles =
    computedFavoriteStyles.length > 0
      ? computedFavoriteStyles
      : existing?.favoriteStyles || [];

  const favoriteOccasions =
    computedFavoriteOccasions.length > 0
      ? computedFavoriteOccasions
      : existing?.favoriteOccasions || [];

  const dislikedColors =
    computedDislikedColors.length > 0
      ? computedDislikedColors
      : existing?.dislikedColors || [];

  const dislikedStyles =
    computedDislikedStyles.length > 0
      ? computedDislikedStyles
      : existing?.dislikedStyles || [];

  const preferredFormalityLevel =
    computedFormalityLevel || existing?.preferredFormalityLevel || null;

  const dataToSave = {
    userId,
    favoriteColors,
    favoriteStyles,
    favoriteOccasions,
    dislikedColors,
    dislikedStyles,
    preferredFormalityLevel,
    averageRating,
    totalOutfitsWorn,
    totalFeedbackGiven: feedbacks.length,
    lastComputedAt: new Date(),
  };

  let preferencesRecord;
  if (existing) {
    preferencesRecord = await existing.update(dataToSave);
  } else {
    preferencesRecord = await UserPreferences.create(dataToSave);
  }

  return preferencesRecord;
}

module.exports = {
  computeUserPreferences,
};
