const { DataTypes } = require("sequelize");
const db = require("../config/db");

const CapsuleTrip = db.define("CapsuleTrip", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  days: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  vibe: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  season: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  capsuleItems: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  itinerary: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  metrics: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  indexes: [
    { fields: ["userId"] },
  ],
});

module.exports = CapsuleTrip;
