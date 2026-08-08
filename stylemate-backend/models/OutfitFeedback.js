const { DataTypes } = require("sequelize");
const db = require("../config/db");

const OutfitFeedback = db.define("OutfitFeedback", {
  historyId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  outfit: {
    type: DataTypes.JSON,
    allowNull: false,
  },

  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5,
    },
  },

  feedbackReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  feedbackDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

module.exports = OutfitFeedback;
