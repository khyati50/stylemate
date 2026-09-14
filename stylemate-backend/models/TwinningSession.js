const { DataTypes } = require("sequelize");
const db = require("../config/db");

const TwinningSession = db.define("TwinningSession", {
  sessionCode: {
    type: DataTypes.STRING(6),
    allowNull: false,
    unique: true,
  },
  initiatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  partnerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: "waiting", // "waiting" | "active" | "completed"
  },
  occasion: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  season: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  initiatorOutfit: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  partnerOutfit: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  pairScore: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  coordinationReason: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  pairs: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  timestamps: true,
});

module.exports = TwinningSession;
