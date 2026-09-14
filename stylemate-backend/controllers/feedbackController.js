const OutfitFeedback = require("../models/OutfitFeedback");
const { computeUserPreferences } = require("../utils/preferenceEngine");

const saveOutfitFeedback = async (req, res) => {
  try {
    const { historyId, outfit, rating, feedbackReason, feedbackDetails } =
      req.body;
    const VALID_REASONS = [
      "COLOR_MISMATCH",
      "STYLE_MISMATCH",
      "TOO_FORMAL",
      "TOO_CASUAL",
      "OCCASION_MISMATCH",
      "OTHER",
    ];
    const userId = req.user.id;

    if (!outfit) {
      return res.status(400).json({
        message: "Invalid outfit data",
      });
    }

    if (!rating && !feedbackReason) {
      return res.status(400).json({
        message: "Provide either a rating or feedback reason",
      });
    }
    if (feedbackReason && !VALID_REASONS.includes(feedbackReason)) {
      return res.status(400).json({
        message: "Invalid feedback reason",
      });
    }

    if (historyId) {
      const existingFeedback = await OutfitFeedback.findOne({
        where: {
          userId,
          historyId,
        },
      });

      if (existingFeedback) {
        return res.status(400).json({
          message: "This outfit has already been rated.",
        });
      }
    }
    await OutfitFeedback.create({
      userId,
      historyId: historyId || null,
      outfit,
      rating,
      feedbackReason,
      feedbackDetails,
    });

    computeUserPreferences(userId).catch(console.error);

    return res.status(201).json({
      message: "Feedback submitted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getOutfitFeedback = async (req, res) => {
  try {
    const userId = req.user.id;

    const feedback = await OutfitFeedback.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      feedback,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  saveOutfitFeedback,
  getOutfitFeedback,
};
