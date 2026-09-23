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

  styles: {
    type: DataTypes.JSON,
    allowNull: true,
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

  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "available",
  },
}, {
  indexes: [
    { fields: ["userId"] },
    { fields: ["userId", "category"] },
    { fields: ["userId", "status"] },
  ],
});
module.exports = ClothingItem;
