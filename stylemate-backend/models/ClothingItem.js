const { DataTypes } = require("sequelize");
const db = require("../config/db.js");
const ClothingItem = db.define("ClothingItem", {
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },

  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  style: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  colors: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  imageUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },

  seasons: {
    type: DataTypes.JSON,
    allowNull: true,
  },

  occasions: {
    type: DataTypes.JSON,
    allowNull: true,
  },
});
module.exports = ClothingItem;
