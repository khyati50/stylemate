const OutfitHistory = require("../models/OutfitHistory");
const OutfitFeedback = require("../models/OutfitFeedback");
const saveOutfitHistory = async (req, res) => {
  try {
    const { outfit, occasion } = req.body;
    const userId = req.user.id;

    if (!outfit || outfit.length === 0 || !occasion) {
      return res.status(400).json({
        message: "Invalid outfit data",
      });
    }

    await OutfitHistory.create({
      userId,
      outfit,
      occasion,
    });

    return res.status(201).json({
      message: "Outfit saved to history successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

const getOutfitHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    const history = await OutfitHistory.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    const feedback = await OutfitFeedback.findAll({
      where: { userId },
    });

    const historyWithRatings = history.map((entry) => {
      const rating = feedback.find((item) => item.historyId === entry.id);

      return {
        ...entry.toJSON(),
        rating: rating ? rating.rating : null,
      };
    });

    return res.status(200).json({
      history: historyWithRatings,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  saveOutfitHistory,
  getOutfitHistory,
};
