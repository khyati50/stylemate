const { DataTypes } = require("sequelize");
const db = require("../config/db");

const OutfitHistory = db.define("OutfitHistory", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  outfit: {
    type: DataTypes.JSON,
    allowNull: false,
  },

  occasion: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = OutfitHistory;
