const { DataTypes } = require("sequelize");
const db = require("../config/db");

const UserPreferences = db.define("UserPreferences", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  favoriteColors: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  favoriteStyles: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  favoriteOccasions: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  dislikedColors: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  dislikedStyles: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  preferredFormalityLevel: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  averageRating: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  totalOutfitsWorn: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalFeedbackGiven: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastComputedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

module.exports = UserPreferences;
